from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
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
