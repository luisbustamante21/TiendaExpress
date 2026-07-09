from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.auth_views import AuthViewSet
from api.views.product_views import ProductViewSet
from api.views.order_views import OrderViewSet

router = DefaultRouter()
# Al usar basename='auth', los endpoints serán /api/auth/login/ y /api/auth/refresh/
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Prefijo /api/ para cumplir con la ruta de la prueba técnica
    path('api/', include(router.urls)), 
]