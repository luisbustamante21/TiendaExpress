from rest_framework import serializers
from api.models.order import Order
from .order_item_serializer import OrderItemSerializer

class OrderSerializer(serializers.ModelSerializer):
    # Incluimos los items anidados para que al pedir una orden, te devuelva sus productos
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'