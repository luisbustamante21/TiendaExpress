from django.db import models
from django.contrib.auth.models import User  # <-- Importación de la tabla nativa de Django

class Order(models.Model):
    # Apunta directamente al User nativo
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='orders')
    status = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    idempotency_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'orders'