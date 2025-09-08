"""
Vistas simples para usuarios sin middleware CSRF problemático
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import PerfilUsuario
from .serializers import UsuarioSerializer, RegistroSerializer


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_registro(request):
    """Vista simple para registro sin middleware CSRF"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        # Parsear datos JSON
        data = json.loads(request.body.decode('utf-8'))
        
        # Validar campos requeridos
        required_fields = ['username', 'email', 'password', 'password_confirm']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Validar que las contraseñas coincidan
        if data['password'] != data['password_confirm']:
            return JsonResponse({
                'error': 'Las contraseñas no coinciden'
            }, status=400)
        
        # Verificar que el usuario no exista
        if User.objects.filter(username=data['username']).exists():
            return JsonResponse({
                'error': 'El nombre de usuario ya existe'
            }, status=400)
        
        # Verificar que el email no exista
        if User.objects.filter(email=data['email']).exists():
            return JsonResponse({
                'error': 'El email ya está registrado'
            }, status=400)
        
        # Crear usuario
        usuario = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        
        # El perfil se crea automáticamente por la señal
        # Actualizar campos adicionales del perfil si se proporcionan
        if hasattr(usuario, 'perfil'):
            perfil = usuario.perfil
            perfil.telefono = data.get('telefono', '')
            perfil.direccion = data.get('direccion', '')
            perfil.ciudad = data.get('ciudad', '')
            perfil.codigo_postal = data.get('codigo_postal', '')
            perfil.recibir_ofertas = data.get('recibir_ofertas', True)
            perfil.save()
        
        # Crear token
        token, created = Token.objects.get_or_create(user=usuario)
        
        # Serializar usuario
        serializer = UsuarioSerializer(usuario)
        
        response_data = {
            'message': 'Usuario registrado exitosamente',
            'user': serializer.data,
            'token': token.key
        }
        
        response = JsonResponse(response_data, status=201)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Datos JSON inválidos'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_login(request):
    """Vista simple para login sin middleware CSRF"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        # Parsear datos JSON
        data = json.loads(request.body.decode('utf-8'))
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({
                'error': 'Usuario y contraseña son requeridos'
            }, status=400)
        
        # Autenticar usuario
        user = authenticate(username=username, password=password)
        
        if user is None:
            return JsonResponse({
                'error': 'Credenciales inválidas'
            }, status=401)
        
        if not user.is_active:
            return JsonResponse({
                'error': 'Cuenta desactivada'
            }, status=401)
        
        # Crear o obtener token
        token, created = Token.objects.get_or_create(user=user)
        
        # Serializar usuario
        serializer = UsuarioSerializer(user)
        
        response_data = {
            'message': 'Login exitoso',
            'user': serializer.data,
            'token': token.key
        }
        
        response = JsonResponse(response_data)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Datos JSON inválidos'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "OPTIONS"])
def simple_perfil(request):
    """Vista simple para perfil sin middleware CSRF"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, PUT, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        # Verificar autenticación por token
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Token '):
            return JsonResponse({
                'error': 'Token de autenticación requerido'
            }, status=401)
        
        token_key = auth_header.split(' ')[1]
        
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return JsonResponse({
                'error': 'Token inválido'
            }, status=401)
        
        if request.method == 'GET':
            # Obtener perfil
            serializer = UsuarioSerializer(user)
            response_data = {
                'user': serializer.data
            }
            
            response = JsonResponse(response_data)
            response['Access-Control-Allow-Origin'] = '*'
            return response
        
        elif request.method == 'PUT':
            # Actualizar perfil
            data = json.loads(request.body.decode('utf-8'))
            
            # Actualizar campos del usuario
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            
            user.save()
            
            # Actualizar campos del perfil
            if hasattr(user, 'perfil'):
                perfil = user.perfil
                if 'telefono' in data:
                    perfil.telefono = data['telefono']
                if 'direccion' in data:
                    perfil.direccion = data['direccion']
                if 'ciudad' in data:
                    perfil.ciudad = data['ciudad']
                if 'codigo_postal' in data:
                    perfil.codigo_postal = data['codigo_postal']
                if 'recibir_ofertas' in data:
                    perfil.recibir_ofertas = data['recibir_ofertas']
                
                perfil.save()
            
            # Serializar usuario actualizado
            serializer = UsuarioSerializer(user)
            
            response_data = {
                'message': 'Perfil actualizado exitosamente',
                'user': serializer.data
            }
            
            response = JsonResponse(response_data)
            response['Access-Control-Allow-Origin'] = '*'
            return response
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Datos JSON inválidos'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_logout(request):
    """Vista simple para logout sin middleware CSRF"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        # Verificar autenticación por token
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            
            try:
                token = Token.objects.get(key=token_key)
                token.delete()  # Eliminar token para cerrar sesión
            except Token.DoesNotExist:
                pass  # Token ya no existe, no hay problema
        
        response_data = {
            'message': 'Logout exitoso'
        }
        
        response = JsonResponse(response_data)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)
