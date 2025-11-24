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
    """Vista simple para agregar productos al carrito"""
    # Manejar preflight OPTIONS - Django CORS middleware maneja los headers
    if request.method == 'OPTIONS':
        return JsonResponse({})
    # Asegurar que la sesión esté inicializada
    if not request.session.session_key:
        request.session.create()
        request.session.save()

    try:
        # Obtener datos del request
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return JsonResponse({'error': 'product_id es requerido'}, status=400)
            
        # Obtener producto
        try:
            producto = Producto.objects.get(id=product_id, is_active=True)
        except Producto.DoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado'}, status=404)
        
        # Validar stock
        if producto.stock < quantity:
            return JsonResponse({
                'error': f'Stock insuficiente. Disponible: {producto.stock}',
                'stock_disponible': producto.stock
            }, status=400)

        # Agregar al carrito
        cart = Cart(request)
        cart.add(producto, quantity)

        # Preparar respuesta (incluyendo imagen_principal como en simple_get_cart)
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

        # Django CORS middleware agrega los headers automáticamente
        return JsonResponse({
            'message': 'Producto agregado al carrito',
            'cart': cart_data,
            'producto': {
                'nombre': producto.nombre,
                'precio': str(producto.precio),
                'stock_restante': producto.stock - quantity
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
        
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
            
            # Guardar la sesión explícitamente
            request.session.save()
            
            response = JsonResponse({
                'message': 'Producto agregado al carrito',
                'cart': cart_data
            })
        
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simple_get_cart(request):
    """Vista simple para obtener el carrito"""
    
    # Manejar preflight OPTIONS - Django CORS middleware maneja los headers
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
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
        
        return JsonResponse(cart_data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_update_cart(request):
    """Vista simple para actualizar cantidad de un producto en el carrito"""
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return JsonResponse({'error': 'product_id es requerido'}, status=400)
        
        if quantity < 1:
            return JsonResponse({'error': 'La cantidad debe ser mayor a 0'}, status=400)
            
        # Obtener producto
        try:
            producto = Producto.objects.get(id=product_id, is_active=True)
        except Producto.DoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado'}, status=404)
        
        # Validar stock
        if producto.stock < quantity:
            return JsonResponse({
                'error': f'Stock insuficiente. Disponible: {producto.stock}',
                'stock_disponible': producto.stock
            }, status=400)
        
        # Actualizar carrito
        cart = Cart(request)
        cart.add(producto, quantity, override_quantity=True)
        
        # Retornar carrito actualizado
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
        
        return JsonResponse({
            'message': 'Cantidad actualizada',
            'cart': cart_data
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_remove_from_cart(request):
    """Vista simple para eliminar un producto del carrito"""
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        
        if not product_id:
            return JsonResponse({'error': 'product_id es requerido'}, status=400)
            
        # Obtener producto
        try:
            producto = Producto.objects.get(id=product_id)
        except Producto.DoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado'}, status=404)
        
        # Eliminar del carrito
        cart = Cart(request)
        cart.remove(producto)
        
        # Retornar carrito actualizado
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
        
        return JsonResponse({
            'message': 'Producto eliminado del carrito',
            'cart': cart_data
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simple_clear_cart(request):
    """Vista simple para limpiar completamente el carrito"""
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    try:
        # Limpiar el carrito
        cart = Cart(request)
        cart.clear()
        
        # Guardar la sesión explícitamente
        request.session.save()
        
        # Retornar carrito vacío
        cart_data = {
            'items': [],
            'total_price': '0',
            'total_items': 0,
            'is_empty': True
        }
        
        return JsonResponse({
            'message': 'Carrito limpiado exitosamente',
            'cart': cart_data
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
