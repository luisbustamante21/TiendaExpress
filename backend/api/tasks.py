import random
import logging
from celery import shared_task
from django.db import transaction
from api.models.order import Order
from api.models.product import Product

logger = logging.getLogger(__name__)


@shared_task
def enviar_notificacion_async(order_id, status, trace_id=None):
    logger.info(f"[TraceID: {trace_id}] EMAIL ENVIADO: Pedido {order_id} actualizado a {status}.")
    return True


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def procesar_pago_async(self, order_id, trace_id=None):
    logger.info(f"[TraceID: {trace_id}] Procesando pago de orden {order_id}. Intento {self.request.retries + 1}")

    # Simulación de un error de conexión aleatorio para probar los reintentos
    if random.random() < 0.2:
        logger.warning(f"[TraceID: {trace_id}] Timeout en la pasarela de pago. Activando retry...")
        raise Exception("Error de red con la pasarela.")

    pago_exitoso = random.choices([True, False], weights=[0.8, 0.2])[0]

    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)

            # Evitar procesar dos veces si ya se completó en un intento anterior
            if order.status != 'PENDING':
                logger.info(f"[TraceID: {trace_id}] La orden {order_id} ya fue procesada previamente.")
                return

            if pago_exitoso:
                order.status = 'CONFIRMED'
                order.save()
                logger.info(f"[TraceID: {trace_id}] Pago APROBADO para el pedido {order_id}.")
                enviar_notificacion_async.delay(order.id, order.status, trace_id)
            else:
                order.status = 'FAILED'
                order.save()
                logger.warning(f"[TraceID: {trace_id}] Pago RECHAZADO para el pedido {order_id}.")

                # TEMA 6: Consistencia Eventual y Patrón Saga.
                # Como el pago falló definitivamente, aplicamos una "Transacción Compensatoria" para devolver el stock.
                logger.info(f"[TraceID: {trace_id}] Iniciando saga de compensación de inventario...")
                for item in order.items.all():
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.stock_quantity += item.quantity
                    product.save()
                    logger.info(
                        f"[TraceID: {trace_id}] Compensación: +{item.quantity} unidades devueltas al producto {product.name}.")

    except Order.DoesNotExist:
        logger.error(f"[TraceID: {trace_id}] Error SAGA: No se encontró el pedido {order_id}.")