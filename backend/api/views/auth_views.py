from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _set_auth_cookies(self, response, access_token, refresh_token):
        # Configuraciones de seguridad para la cookie
        cookie_kwargs = {
            'httponly': True,  # JS no puede leerla (Previene XSS)
            'secure': not settings.DEBUG,  # True en producción (solo viaja por HTTPS)
            'samesite': 'Lax', # Protege contra ataques CSRF básicos
        }
        response.set_cookie('access_token', access_token, max_age=3600, **cookie_kwargs)
        if refresh_token:
            response.set_cookie('refresh_token', refresh_token, max_age=86400 * 7, **cookie_kwargs)

    @action(detail=False, methods=['post'])
    def login(self, request):
        try:
            serializer = TokenObtainPairSerializer(data=request.data)
            if serializer.is_valid():
                response = Response({"detail": "Login exitoso"}, status=status.HTTP_200_OK)
                # Inyectamos los tokens como cookies, no en el JSON
                self._set_auth_cookies(
                    response,
                    serializer.validated_data['access'],
                    serializer.validated_data['refresh']
                )
                return response
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error en login: {str(e)}", exc_info=True)
            return Response({"detail": "Error interno del servidor."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        try:
            # Lee el token de la cookie, no del body
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({"detail": "No se proporcionó token de refresco."}, status=status.HTTP_401_UNAUTHORIZED)

            serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
            if serializer.is_valid():
                response = Response({"detail": "Token refrescado exitosamente"}, status=status.HTTP_200_OK)
                self._set_auth_cookies(
                    response,
                    serializer.validated_data['access'],
                    serializer.validated_data.get('refresh') # A veces SimpleJWT rota el refresh
                )
                return response
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error al refrescar token: {str(e)}", exc_info=True)
            return Response({"detail": "Ocurrió un error al renovar la sesión."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        response = Response({"detail": "Logout exitoso"}, status=status.HTTP_200_OK)

        # se debe usar las mismas reglas para poder borrarlas
        cookie_kwargs = {
            'httponly': True,
            'secure': not settings.DEBUG,
            'samesite': 'Lax',
        }

        response.delete_cookie('access_token', **cookie_kwargs)
        response.delete_cookie('refresh_token', **cookie_kwargs)
        return response