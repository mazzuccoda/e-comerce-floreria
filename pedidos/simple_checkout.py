from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
import json
from .models import Pedido, MetodoEnvio
from .serializers import CheckoutSerializer, PedidoReadSerializer
from carrito.cart import Cart
from rest_framework.authtoken.models import Token


@csrf_exempt
@require_http_methods(["GET", "POST"])
def simple_checkout(request):
    """
    Vista simple para crear pedidos sin problemas de CSRF
    """
    if request.method == "GET":
        return JsonResponse({
            'message': 'Endpoint para crear pedidos',
            'method': 'POST',
            'required_fields': [
                'nombre_comprador', 'email_comprador', 'telefono_comprador',
                'nombre_destinatario', 'telefono_destinatario', 'direccion',
                'ciudad', 'codigo_postal', 'fecha_entrega', 'franja_horaria',
                'metodo_envio_id', 'medio_pago'
            ]
        })
    
    try:
        # Autenticar usuario por token si está presente
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
                print(f"✅ Usuario autenticado: {token.user.username} (ID: {token.user.id})")
            except Token.DoesNotExist:
                print("❌ Token inválido")
                pass  # Continuar como usuario anónimo
        else:
            print("⚠️ No hay token de autenticación")
        
        with transaction.atomic():
            # Obtener datos del request con codificación UTF-8
            body_unicode = request.body.decode('utf-8')
            data = json.loads(body_unicode)
            
            # Obtener carrito de la sesión
            cart = Cart(request)
            
            if cart.is_empty:
                return JsonResponse({
                    'error': 'El carrito esta vacio'
                }, status=400)
            
            # Crear el pedido usando el serializer
            serializer = CheckoutSerializer(data=data, context={'request': request})
            
            if serializer.is_valid():
                # Crear el pedido (esto automáticamente descuenta stock y limpia carrito)
                pedido = serializer.save()
                
                # Serializar respuesta
                pedido_data = PedidoReadSerializer(pedido).data
                
                return JsonResponse({
                    'success': True,
                    'message': 'Pedido creado exitosamente',
                    'pedido': pedido_data,
                    'pedido_id': pedido.id,
                    'numero_pedido': pedido.numero_pedido
                }, status=201)
            else:
                return JsonResponse({
                    'error': 'Datos inválidos',
                    'details': serializer.errors
                }, status=400)
                
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def test_cart(request):
    """
    Vista para probar el estado del carrito
    """
    cart = Cart(request)
    return JsonResponse({
        'items': list(cart),
        'total_price': str(cart.get_total_price()),
        'total_items': len(cart),
        'is_empty': cart.is_empty
    })
