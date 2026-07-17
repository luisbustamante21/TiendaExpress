from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from api.models.order import Order
from api.models.order_item import OrderItem
from api.models.product import Product
from api.serializers.order_serializer import OrderSerializer
from api.tasks import procesar_pago_async
import logging
import uuid
from decimal import Decimal

logger = logging.getLogger(__name__)

class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Listado de pedidos, filtrable por status.
        """
        try:
            status_param = request.query_params.get('status')
            # filtrar por el usuario autenticado
            queryset = Order.objects.filter(user=request.user)

            if status_param:
                queryset = queryset.filter(status=status_param)

            serializer = OrderSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error al listar pedidos del usuario {request.user.id}: {str(e)}")
            return Response({"detail": "Error interno al obtener los pedidos."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.error(f"Error al recuperar el pedido {pk}: {str(e)}")
            return Response({"detail": "Error interno al cargar el pedido."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @transaction.atomic
    def create(self, request):
        trace_id = str(uuid.uuid4())
        logger.info(f"[TraceID: {trace_id}] Iniciando creación de orden para el usuario {request.user.id}")

        try:
            idem_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
            if idem_key:
                existing_order = Order.objects.filter(idempotency_key=idem_key, user=request.user).first()
                if existing_order:
                    logger.info(f"[TraceID: {trace_id}] Petición duplicada detectada. Devolviendo orden existente.")
                    return Response(OrderSerializer(existing_order).data, status=status.HTTP_200_OK)

            items_data = request.data.get('items', [])
            if not items_data:
                return Response({"detail": "El pedido debe contener al menos un producto."},
                                status=status.HTTP_400_BAD_REQUEST)

            items_data = sorted(items_data, key=lambda x: x.get('product_id'))
            products_to_buy = []
            total_amount = Decimal('0.00')

            for item in items_data:
                product_id = item.get('product_id')
                quantity = int(item.get('quantity', 0))

                try:
                    product = Product.objects.select_for_update().get(pk=product_id)
                except Product.DoesNotExist:
                    return Response({"detail": f"Producto ID {product_id} no existe."},
                                    status=status.HTTP_404_NOT_FOUND)

                if product.stock_quantity < quantity:
                    return Response({"detail": f"Stock insuficiente para '{product.name}'."},
                                    status=status.HTTP_400_BAD_REQUEST)

                product.stock_quantity -= quantity
                product.save()

                subtotal = product.price * quantity
                total_amount += subtotal

                products_to_buy.append((product, quantity))

            # Crear Orden con el total y la llave de idempotencia
            order = Order.objects.create(
                user=request.user,
                status='PENDING',
                total_amount=total_amount,
                idempotency_key=idem_key
            )

            order_items = [
                OrderItem(order=order, product=product, quantity=quantity, unit_price=product.price)
                for product, quantity in products_to_buy
            ]
            OrderItem.objects.bulk_create(order_items)

            transaction.on_commit(lambda: procesar_pago_async.delay(order.id, trace_id))

            logger.info(f"[TraceID: {trace_id}] Orden {order.id} creada exitosamente. Esperando validación de pago.")
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # TEMA 5: Information Exposure. Evitamos enviar 'str(e)' al frontend.
            logger.error(f"[TraceID: {trace_id}] Error crítico: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Error interno del servidor al procesar el pedido. Intente nuevamente."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )