from django.db import models

class Product(models.Model):
    sku = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'product'