from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import PerfilUsuario
from .serializers import (
    UsuarioSerializer, RegistroSerializer, LoginSerializer, 
    CambiarPasswordSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class RegistroView(APIView):
    """Vista para registro de nuevos usuarios"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            token, created = Token.objects.get_or_create(user=usuario)
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': UsuarioSerializer(usuario).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'error': 'Error en el registro',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """Vista para login de usuarios"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Login exitoso',
                'user': UsuarioSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Error en el login',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    """Vista para logout de usuarios"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Eliminar token
            request.user.auth_token.delete()
        except:
            pass
        
        logout(request)
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class PerfilView(APIView):
    """Vista para obtener y actualizar perfil de usuario"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response({
            'user': serializer.data
        })

    def put(self, request):
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': serializer.data
            })
        
        return Response({
            'error': 'Error al actualizar perfil',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class CambiarPasswordView(APIView):
    """Vista para cambiar contraseña"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Regenerar token
            try:
                user.auth_token.delete()
            except:
                pass
            token = Token.objects.create(user=user)
            
            return Response({
                'message': 'Contraseña cambiada exitosamente',
                'token': token.key
            })
        
        return Response({
            'error': 'Error al cambiar contraseña',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verificar_usuario(request, username):
    """Verificar si un username ya existe"""
    exists = User.objects.filter(username=username).exists()
    return Response({
        'exists': exists,
        'available': not exists
    })


@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verificar_email(request, email):
    """Verificar si un email ya existe"""
    exists = User.objects.filter(email=email).exists()
    return Response({
        'exists': exists,
        'available': not exists
    })
