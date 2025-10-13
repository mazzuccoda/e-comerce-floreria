from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from rest_framework.authtoken.models import Token
import json


@csrf_exempt
def simple_checkout(request):
    """Vista simple para checkout sin CSRF"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Solo POST permitido'}, status=405)
    
    try:
        from .serializers import CheckoutSerializer, PedidoReadSerializer
        from carrito.cart import Cart
        
        data = json.loads(request.body)
        cart = Cart(request)
        
        if cart.is_empty:
            return JsonResponse({'error': 'Carrito vacío'}, status=400)
        
        with transaction.atomic():
            serializer = CheckoutSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                pedido = serializer.save()
                return JsonResponse({
                    'success': True,
                    'pedido_id': pedido.id,
                    'numero_pedido': pedido.numero_pedido
                })
            else:
                return JsonResponse({'error': serializer.errors}, status=400)
                
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simple_mis_pedidos(request):
    """Vista simple para obtener pedidos del usuario autenticado por token"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
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
        
        # Obtener pedidos del usuario
        from .models import Pedido
        from .serializers import PedidoReadSerializer
        
        print(f"🔍 Buscando pedidos para usuario: {user.username} (ID: {user.id})")
        
        pedidos = Pedido.objects.filter(cliente=user).order_by('-creado')
        print(f"📦 Pedidos encontrados: {pedidos.count()}")
        
        # Mostrar información de todos los pedidos
        todos_pedidos = Pedido.objects.all()
        print(f"📊 Total de pedidos en BD: {todos_pedidos.count()}")
        for p in todos_pedidos:
            print(f"  - Pedido #{p.numero_pedido}: cliente_id={p.cliente_id}, email={p.email_comprador}")
        
        serializer = PedidoReadSerializer(pedidos, many=True)
        
        response_data = {
            'pedidos': serializer.data
        }
        
        response = JsonResponse(response_data)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simple_pedido_detalle(request, pedido_id):
    """Vista simple para obtener detalle de un pedido específico"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
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
        
        # Obtener pedido específico
        from .models import Pedido
        from .serializers import PedidoReadSerializer
        
        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            return JsonResponse({
                'error': 'Pedido no encontrado'
            }, status=404)
        
        # Verificar que el pedido pertenezca al usuario
        if pedido.cliente_id != user.id:
            return JsonResponse({
                'error': 'No tienes permiso para ver este pedido'
            }, status=403)
        
        serializer = PedidoReadSerializer(pedido)
        
        response = JsonResponse(serializer.data)
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_create_payment(request, pedido_id):
    """Vista simple para crear preferencia de pago de MercadoPago sin CSRF"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        from .models import Pedido
        from .mercadopago_service import MercadoPagoService
        
        # Obtener el pedido
        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Pedido no encontrado'
            }, status=404)
        
        # Verificar que el pedido esté en estado correcto para pago
        if pedido.estado_pago not in ['pendiente', 'pending']:
            return JsonResponse({
                'success': False,
                'error': 'El pedido ya ha sido procesado'
            }, status=400)
        
        # Crear preferencia en Mercado Pago
        try:
            mp_service = MercadoPagoService()
            print(f"✅ Servicio MercadoPago creado")
            
            preference_result = mp_service.create_preference(pedido, request)
            print(f"📋 Resultado de preferencia: {preference_result}")
            
            if preference_result['success']:
                response_data = {
                    'success': True,
                    'preference_id': preference_result['preference_id'],
                    'init_point': preference_result['init_point'],
                    'sandbox_init_point': preference_result.get('sandbox_init_point')
                }
                
                response = JsonResponse(response_data)
                response['Access-Control-Allow-Origin'] = '*'
                return response
            else:
                error_msg = preference_result.get('error', 'Error al crear preferencia de pago')
                print(f"❌ Error en preferencia: {error_msg}")
                return JsonResponse({
                    'success': False,
                    'error': error_msg
                }, status=500)
        except Exception as e:
            print(f"❌ Excepción al crear preferencia: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': f'Error al inicializar MercadoPago: {str(e)}'
            }, status=500)
            
    except Exception as e:
        print(f"❌ Error en simple_create_payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }, status=500)


@csrf_exempt
def simple_cart_test(request):
    """Vista simple para probar carrito"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo GET permitido'}, status=405)
    
    try:
        from carrito.cart import Cart
        cart = Cart(request)
        return JsonResponse({
            'total_items': len(cart),
            'is_empty': cart.is_empty,
            'total_price': str(cart.get_total_price())
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
