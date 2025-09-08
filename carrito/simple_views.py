from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
import json

from catalogo.models import Producto
from .cart import Cart


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_add_to_cart(request):
    """Vista simple para agregar productos al carrito sin middleware problemático"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        return response
    
    try:
        # Parsear datos JSON
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id:
            return JsonResponse({'error': 'product_id es requerido'}, status=400)
        
        # Obtener el producto
        producto = get_object_or_404(Producto, id=product_id, is_active=True)
        
        # Verificar stock disponible
        cart = Cart(request)
        current_quantity = 0
        
        # Calcular cantidad actual en carrito
        for item in cart:
            if item['producto'].id == product_id:
                current_quantity = item['quantity']
                break
        
        total_requested = current_quantity + quantity
        if total_requested > producto.stock:
            response = JsonResponse({
                'error': f'Stock insuficiente. Disponible: {producto.stock}, en carrito: {current_quantity}'
            }, status=400)
        else:
            # Agregar al carrito
            cart.add(producto, quantity)
            
            # Retornar estado actualizado del carrito
            items_data = []
            for item in cart.get_items():
                items_data.append({
                    'producto': {
                        'id': item['producto'].id,
                        'nombre': item['producto'].nombre,
                        'precio': str(item['producto'].precio),
                        'imagen_principal': item['producto'].get_primary_image_url
                    },
                    'quantity': item['quantity'],
                    'price': str(item['price']),
                    'total_price': str(item['total_price'])
                })
            
            cart_data = {
                'items': items_data,
                'total_price': str(cart.get_total_price()),
                'total_items': len(cart),
                'is_empty': cart.is_empty
            }
            
            response = JsonResponse({
                'message': 'Producto agregado al carrito',
                'cart': cart_data
            })
        
        # Agregar headers CORS
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        
        return response
        
    except json.JSONDecodeError:
        response = JsonResponse({'error': 'JSON inválido'}, status=400)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response['Access-Control-Allow-Origin'] = '*'
        return response


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simple_get_cart(request):
    """Vista simple para obtener el carrito"""
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        return response
    
    try:
        cart = Cart(request)
        
        # Preparar datos para el serializer
        items_data = []
        for item in cart.get_items():
            items_data.append({
                'producto': {
                    'id': item['producto'].id,
                    'nombre': item['producto'].nombre,
                    'precio': str(item['producto'].precio),
                    'imagen_principal': item['producto'].get_primary_image_url
                },
                'quantity': item['quantity'],
                'price': str(item['price']),
                'total_price': str(item['total_price'])
            })
        
        cart_data = {
            'items': items_data,
            'total_price': str(cart.get_total_price()),
            'total_items': len(cart),
            'is_empty': cart.is_empty
        }
        
        response = JsonResponse(cart_data)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        
        return response
        
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response['Access-Control-Allow-Origin'] = '*'
        return response
