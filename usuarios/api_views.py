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


@method_decorator(csrf_exempt, name='dispatch')
class SolicitarResetPasswordView(APIView):
    """Vista para solicitar recuperación de contraseña por WhatsApp o Email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import SolicitarResetPasswordSerializer
        from .models import PasswordResetToken
        from django.core.mail import send_mail
        from django.conf import settings
        from notificaciones.n8n_service import n8n_service
        import logging
        
        logger = logging.getLogger(__name__)
        serializer = SolicitarResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            canal = serializer.validated_data.get('canal', 'whatsapp')
            email = serializer.validated_data.get('email')
            telefono = serializer.validated_data.get('telefono')
            
            # Obtener usuario según el canal
            if canal == 'email':
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    return Response(
                        {'error': 'No existe un usuario con ese email'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:  # whatsapp
                from usuarios.models import PerfilUsuario
                perfil = PerfilUsuario.objects.filter(telefono=telefono).first()
                if not perfil:
                    return Response(
                        {'error': 'No existe un usuario con ese teléfono'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                user = perfil.user
            
            # Crear token de recuperación
            reset_token = PasswordResetToken.create_token(user)
            
            # Construir URL del frontend
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            
            # Enviar según el canal elegido
            if canal == 'whatsapp':
                try:
                    nombre_usuario = user.first_name or user.username
                    success = n8n_service.enviar_recuperacion_password(
                        telefono=telefono,
                        nombre_usuario=nombre_usuario,
                        token=reset_token.token,
                        frontend_url=frontend_url
                    )
                    
                    if success:
                        logger.info(f"✅ WhatsApp de recuperación enviado a {telefono}")
                        return Response({
                            'message': 'Se ha enviado un WhatsApp con el enlace para recuperar tu contraseña',
                            'canal': 'whatsapp'
                        }, status=status.HTTP_200_OK)
                    else:
                        logger.error(f"❌ Error enviando WhatsApp a {telefono}")
                        return Response({
                            'error': 'Error al enviar WhatsApp. Intenta con email o nuevamente más tarde.'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                except Exception as e:
                    logger.error(f"❌ Error enviando WhatsApp de recuperación: {e}")
                    return Response({
                        'error': 'Error al enviar WhatsApp. Intenta con email o nuevamente más tarde.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            else:  # email
                try:
                    reset_url = f"{frontend_url}/reset-password/{reset_token.token}"
                    subject = '🔐 Recuperación de Contraseña - Florería Cristina'
                    message = f"""
Hola {user.first_name or user.username},

Recibimos una solicitud para restablecer tu contraseña.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace expirará en 2 horas.

Si no solicitaste este cambio, puedes ignorar este email.

Saludos,
Florería Cristina
                    """
                    
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                    
                    logger.info(f"✅ Email de recuperación enviado a {email}")
                    
                    return Response({
                        'message': 'Se ha enviado un email con las instrucciones para recuperar tu contraseña',
                        'canal': 'email'
                    }, status=status.HTTP_200_OK)
                    
                except Exception as e:
                    logger.error(f"❌ Error enviando email de recuperación: {e}")
                    return Response({
                        'error': 'Error al enviar el email. Intenta nuevamente más tarde.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'error': 'Datos inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ValidarTokenView(APIView):
    """Vista para validar token de recuperación"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import ValidarTokenSerializer
        from .models import PasswordResetToken
        
        serializer = ValidarTokenSerializer(data=request.data)
        
        if serializer.is_valid():
            token_str = serializer.validated_data['token']
            
            try:
                token = PasswordResetToken.objects.get(token=token_str)
                
                if token.is_valid():
                    return Response({
                        'valid': True,
                        'message': 'Token válido'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'valid': False,
                        'message': 'Token expirado o ya utilizado'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except PasswordResetToken.DoesNotExist:
                return Response({
                    'valid': False,
                    'message': 'Token inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': 'Datos inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordView(APIView):
    """Vista para resetear contraseña con token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import ResetPasswordSerializer
        from .models import PasswordResetToken
        import logging
        
        logger = logging.getLogger(__name__)
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            token_str = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                token = PasswordResetToken.objects.get(token=token_str)
                
                if not token.is_valid():
                    return Response({
                        'error': 'Token expirado o ya utilizado'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Cambiar contraseña
                user = token.user
                user.set_password(new_password)
                user.save()
                
                # Marcar token como usado
                token.mark_as_used()
                
                # Invalidar tokens de autenticación existentes
                try:
                    user.auth_token.delete()
                except:
                    pass
                
                logger.info(f"✅ Contraseña reseteada para {user.email}")
                
                return Response({
                    'message': 'Contraseña cambiada exitosamente'
                }, status=status.HTTP_200_OK)
                
            except PasswordResetToken.DoesNotExist:
                return Response({
                    'error': 'Token inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': 'Datos inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
