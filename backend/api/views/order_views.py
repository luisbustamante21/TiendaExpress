from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from api.models.order import Order
from api.models.order_item import OrderItem
from api.models.product import Product
from api.serializers.order_serializer import OrderSerializer
from api.tasks import procesar_pago_async


class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Listado de pedidos, filtrable por status.
        """
        try:
            status_param = request.query_params.get('status')
            # Filtramos por el usuario autenticado (asumiendo que request.user está configurado)
            queryset = Order.objects.filter(user=request.user)

            if status_param:
                queryset = queryset.filter(status=status_param)

            serializer = OrderSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        """
        Detalle de un pedido específico.
        """
        try:
            order = Order.objects.get(pk=pk, user=request.user)
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @transaction.atomic
    def create(self, request):
        """
        Crea un pedido, valida stock (evitando oversell) y deja el estado en PENDING.
        """
        try:
            items_data = request.data.get('items', [])
            if not items_data:
                return Response({"detail": "El pedido debe contener al menos un producto."},
                                status=status.HTTP_400_BAD_REQUEST)

            # BUENA PRÁCTICA: Ordenar los items por ID de producto antes de bloquear.
            # Esto evita "deadlocks" si dos peticiones intentan comprar los mismos
            # productos en distinto orden.
            items_data = sorted(items_data, key=lambda x: x.get('product_id'))

            products_to_buy = []

            # 1. Validar y bloquear stock de todos los productos ANTES de crear la orden
            for item in items_data:
                product_id = item.get('product_id')
                quantity = int(item.get('quantity', 0))

                try:
                    # SELECT FOR UPDATE: Bloquea la fila en la BD hasta que termine el @transaction.atomic
                    product = Product.objects.select_for_update().get(pk=product_id)
                except Product.DoesNotExist:
                    return Response({"detail": f"El producto con ID {product_id} no existe."},
                                    status=status.HTTP_404_NOT_FOUND)

                if product.stock_quantity < quantity:
                    return Response({
                        "detail": f"Stock insuficiente para '{product.name}'. Disponible: {product.stock_quantity}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Descontamos el stock de una vez como "reserva" para que el select_for_update tenga efecto real.
                # Si el pago asíncrono falla luego, la tarea de Celery deberá sumar este stock de vuelta.
                product.stock_quantity -= quantity
                product.save()

                products_to_buy.append((product, quantity))

            # 2. Crear la Orden (Estado PENDING)
            order = Order.objects.create(
                user=request.user,
                status='PENDING'
            )

            # 3. Crear los OrderItems
            order_items = []
            for product, quantity in products_to_buy:
                order_items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.price
                    )
                )
            OrderItem.objects.bulk_create(order_items)

            # 4. DISPARAR TAREA CELERY
            procesar_pago_async.delay(order.id)

            serializer = OrderSerializer(order)
            return Response({
                "message": "Pedido creado correctamente y en proceso de validación.",
                "order": serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": f"Error al procesar el pedido: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)