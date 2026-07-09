from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from api.models.product import Product
from api.serializers.product_serializer import ProductSerializer


class ProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


class ProductViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Listado paginado de productos.
        """
        try:
            queryset = Product.objects.all().order_by('id')
            paginator = ProductPagination()
            page = paginator.paginate_queryset(queryset, request)

            if page is not None:
                serializer = ProductSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = ProductSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error al obtener productos: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)