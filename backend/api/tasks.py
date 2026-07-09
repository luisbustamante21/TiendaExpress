import time
import random
import logging
from celery import shared_task
from django.db import transaction
from api.models.order import Order
from api.models.product import Product

logger = logging.getLogger(__name__)


@shared_task
def enviar_notificacion_async(order_id, status):
    """Simula el envío de una notificación (email)."""
    logger.info("=========================================")
    logger.info(f"SIMULANDO EMAIL: El pedido {order_id} ha sido actualizado a estado {status}.")
    logger.info("=========================================")
    return f"Notificación enviada para el pedido {order_id}"


@shared_task
def procesar_pago_async(order_id):
    """
    Simula la verificación de pago.
    - Éxito: Pasa a CONFIRMED y notifica.
    - Fallo: Pasa a FAILED y devuelve el stock.
    """
    logger.info(f"Iniciando procesamiento asíncrono para el pedido {order_id}...")

    # 1. Simular retardo de verificación
    time.sleep(3)

    # 2. Resultado aleatorio (80% éxito, 20% fallo para probar ambos flujos)
    pago_exitoso = random.choices([True, False], weights=[0.8, 0.2])[0]

    try:
        # Usamos atomic para asegurar consistencia al modificar la orden y el stock
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)

            if pago_exitoso:
                order.status = 'CONFIRMED'
                order.save()
                logger.info(f"Pago APROBADO para el pedido {order_id}.")
                # Disparar tarea de notificación
                enviar_notificacion_async.delay(order.id, order.status)
            else:
                order.status = 'FAILED'
                order.save()
                logger.warning(f"Pago RECHAZADO para el pedido {order_id}. Devolviendo stock...")

                # Restaurar stock de los productos descontados previamente
                for item in order.items.all():
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.stock_quantity += item.quantity
                    product.save()
                    logger.info(f"Devueltos {item.quantity} unidades al producto {product.name}.")

    except Order.DoesNotExist:
        logger.error(f"No se encontró el pedido {order_id}.")