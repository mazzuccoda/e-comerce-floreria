from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
import json


@csrf_exempt
def direct_checkout_view(request):
    """
    Vista directa para crear pedidos sin CSRF
    """
    if request.method != 'POST':
        return JsonResponse({'error': f'Método "{request.method}" no permitido. Use POST.'}, status=405)
        
    try:
        # Importar aquí para evitar problemas circulares
        from .serializers import CheckoutSerializer, PedidoReadSerializer
        from carrito.cart import Cart
        
        with transaction.atomic():
            # Obtener datos del request
            data = json.loads(request.body)
            
            # Obtener carrito de la sesión
            cart = Cart(request)
            
            if cart.is_empty:
                return JsonResponse({
                    'error': 'El carrito está vacío'
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
def test_cart_view(request):
    """
    Vista para probar el estado del carrito
    """
    if request.method != 'GET':
        return JsonResponse({'error': f'Método "{request.method}" no permitido. Use GET.'}, status=405)
        
    try:
        # Importar aquí para evitar problemas circulares
        from carrito.cart import Cart
        
        cart = Cart(request)
        return JsonResponse({
            'items': list(cart),
            'total_price': str(cart.get_total_price()),
            'total_items': len(cart),
            'is_empty': cart.is_empty
        })
    except Exception as e:
        return JsonResponse({
            'error': f'Error: {str(e)}'
        }, status=500)
