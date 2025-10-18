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
        
        print("=" * 80)
        print("🚀 INICIANDO SIMPLE CHECKOUT")
        print("=" * 80)
        
        # Verificar si hay token de autenticación
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
                print(f"✅ Usuario autenticado: {request.user.username} (ID: {request.user.id})")
            except Token.DoesNotExist:
                print("⚠️ Token inválido, procesando como usuario anónimo")
        else:
            print("⚠️ No se encontró token, procesando como usuario anónimo")
        
        # Debug de sesión
        print(f"📋 Session key: {request.session.session_key}")
        print(f"📋 Session data: {dict(request.session)}")
        print(f"📋 Cookies: {request.COOKIES}")
        
        data = json.loads(request.body)
        cart = Cart(request)
        
        # Debug detallado del carrito
        print(f"🛒 Carrito is_empty: {cart.is_empty}")
        print(f"🛒 Carrito len: {len(cart)}")
        print(f"🛒 Usuario autenticado: {request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else False}")
        
        if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            print(f"🛒 Items en BD: {cart.carrito_db.items.count() if hasattr(cart, 'carrito_db') else 0}")
        else:
            print(f"🛒 Items en sesión: {cart.cart if hasattr(cart, 'cart') else {}}")
        
        # Obtener items del carrito
        cart_items = list(cart)
        print(f"🛒 Items obtenidos: {len(cart_items)}")
        for item in cart_items:
            print(f"  - {item['producto'].nombre}: {item['quantity']} x ${item['price']}")
        
        if cart.is_empty:
            print("❌ CARRITO VACÍO - Rechazando pedido")
            return JsonResponse({
                'error': 'El carrito esta vacio',
                'details': {
                    'session_key': request.session.session_key,
                    'user_authenticated': request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else False,
                    'cart_length': len(cart)
                }
            }, status=400)
        
        print("✅ Carrito válido, procediendo con el pedido...")
        
        with transaction.atomic():
            serializer = CheckoutSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                pedido = serializer.save()
                print(f"📦 Pedido creado: #{pedido.numero_pedido}, cliente_id={pedido.cliente_id}")
                return JsonResponse({
                    'success': True,
                    'pedido_id': pedido.id,
                    'numero_pedido': pedido.numero_pedido
                })
            else:
                print(f"❌ Error de validación: {serializer.errors}")
                return JsonResponse({'error': serializer.errors}, status=400)
                
    except Exception as e:
        import traceback
        print("❌ EXCEPCIÓN EN SIMPLE CHECKOUT:")
        traceback.print_exc()
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


@csrf_exempt
def simple_checkout_with_items(request):
    """
    Vista de checkout que recibe los items directamente en el body,
    sin depender del carrito en sesión.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Solo POST permitido'}, status=405)
    
    try:
        from .models import Pedido, PedidoItem, MetodoEnvio
        from catalogo.models import Producto
        from decimal import Decimal
        
        print("=" * 80)
        print("🚀 CHECKOUT CON ITEMS DIRECTOS")
        print("=" * 80)
        
        # Verificar autenticación
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
                print(f"✅ Usuario autenticado: {request.user.username}")
            except Token.DoesNotExist:
                print("⚠️ Token inválido")
        
        data = json.loads(request.body)
        
        # Validar que vengan los items
        items_data = data.get('items', [])
        if not items_data:
            return JsonResponse({
                'error': 'No se enviaron items en el pedido',
                'details': 'Debes incluir un array "items" con los productos'
            }, status=400)
        
        print(f"📦 Items recibidos: {len(items_data)}")
        
        # Validar datos requeridos
        required_fields = [
            'nombre_comprador', 'email_comprador', 'telefono_comprador',
            'nombre_destinatario', 'telefono_destinatario', 'direccion',
            'fecha_entrega', 'franja_horaria', 'metodo_envio_id'
        ]
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return JsonResponse({
                'error': 'Faltan campos requeridos',
                'details': missing_fields
            }, status=400)
        
        with transaction.atomic():
            # Obtener método de envío
            try:
                metodo_envio = MetodoEnvio.objects.get(id=data['metodo_envio_id'])
            except MetodoEnvio.DoesNotExist:
                return JsonResponse({
                    'error': f'Método de envío {data["metodo_envio_id"]} no encontrado'
                }, status=400)
            
            # Crear pedido
            pedido = Pedido.objects.create(
                nombre_comprador=data['nombre_comprador'],
                email_comprador=data['email_comprador'],
                telefono_comprador=data['telefono_comprador'],
                nombre_destinatario=data['nombre_destinatario'],
                telefono_destinatario=data['telefono_destinatario'],
                direccion=data['direccion'],
                ciudad=data.get('ciudad', 'Buenos Aires'),
                codigo_postal=data.get('codigo_postal', ''),
                fecha_entrega=data['fecha_entrega'],
                franja_horaria=data['franja_horaria'],
                metodo_envio=metodo_envio,
                tipo_envio=data.get('metodo_envio'),  # 'retiro', 'express', 'programado'
                dedicatoria=data.get('dedicatoria', ''),
                instrucciones=data.get('instrucciones', ''),
                regalo_anonimo=data.get('regalo_anonimo', False),
                medio_pago=data.get('medio_pago', 'mercadopago'),
                cliente=request.user if request.user.is_authenticated else None,
                anonimo=not request.user.is_authenticated
            )
            
            print(f"🚚 Tipo de envío guardado: {data.get('metodo_envio')}")
            
            print(f"✅ Pedido creado: #{pedido.numero_pedido}")
            
            # Crear items del pedido
            total_productos = Decimal('0.00')
            for item_data in items_data:
                try:
                    producto = Producto.objects.get(id=item_data['producto_id'])
                    cantidad = int(item_data['cantidad'])
                    
                    # Verificar stock
                    if producto.stock < cantidad:
                        raise Exception(f"Stock insuficiente para {producto.nombre}")
                    
                    # Crear item (NO reducir stock aquí, lo hará confirmar_pedido)
                    PedidoItem.objects.create(
                        pedido=pedido,
                        producto=producto,
                        cantidad=cantidad,
                        precio=producto.get_precio_final
                    )
                    
                    total_productos += producto.get_precio_final * cantidad
                    print(f"  ✅ Item agregado: {producto.nombre} x{cantidad}")
                    
                except Producto.DoesNotExist:
                    pedido.delete()
                    return JsonResponse({
                        'error': f'Producto {item_data.get("producto_id")} no encontrado'
                    }, status=400)
                except Exception as e:
                    pedido.delete()
                    return JsonResponse({'error': str(e)}, status=400)
            
            # Calcular total
            pedido.total = total_productos + metodo_envio.costo
            pedido.save()
            
            print(f"💰 Total del pedido: ${pedido.total}")
            
            # Confirmar pedido (esto reduce stock y envía notificaciones)
            print("📧 Confirmando pedido y enviando notificaciones...")
            success, message = pedido.confirmar_pedido()
            if success:
                print(f"✅ {message}")
            else:
                print(f"⚠️ {message}")
            
            return JsonResponse({
                'success': True,
                'pedido_id': pedido.id,
                'numero_pedido': pedido.numero_pedido,
                'total': str(pedido.total)
            })
            
    except Exception as e:
        import traceback
        print("❌ ERROR EN CHECKOUT CON ITEMS:")
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
