from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

class AuthViewSet(viewsets.ViewSet):
    """
    Endpoints para autenticación JWT: login y refresh.
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        try:
            serializer = TokenObtainPairSerializer(data=request.data)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"detail": f"Error en login: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        try:
            serializer = TokenRefreshSerializer(data=request.data)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Error al refrescar token: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)