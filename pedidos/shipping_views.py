from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
from .models import ShippingConfig, ShippingZone, ShippingPricingRule
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_shipping_config(request):
    """
    Obtiene la configuración general de envíos
    GET /api/shipping/config
    """
    try:
        config = ShippingConfig.get_config()
        
        if not config:
            return Response({
                'error': 'No hay configuración de envíos disponible'
            }, status=status.HTTP_404_NOT_FOUND)
        
        data = {
            'store_name': config.store_name,
            'store_address': config.store_address,
            'store_lat': float(config.store_lat),
            'store_lng': float(config.store_lng),
            'max_distance_express_km': float(config.max_distance_express_km),
            'max_distance_programado_km': float(config.max_distance_programado_km),
            'use_distance_matrix': config.use_distance_matrix,
        }
        
        return Response(data)
        
    except Exception as e:
        logger.error(f"Error al obtener configuración de envíos: {str(e)}")
        return Response({
            'error': 'Error al obtener configuración'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_shipping_zones(request, method):
    """
    Obtiene las zonas de envío por método
    GET /api/shipping/zones/<method>
    method: 'express' o 'programado'
    """
    try:
        if method not in ['express', 'programado']:
            return Response({
                'error': 'Método de envío inválido. Use "express" o "programado"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        zones = ShippingZone.objects.filter(
            shipping_method=method,
            is_active=True
        ).order_by('zone_order')
        
        data = []
        for zone in zones:
            data.append({
                'id': zone.id,
                'zone_name': zone.zone_name,
                'min_distance_km': float(zone.min_distance_km),
                'max_distance_km': float(zone.max_distance_km),
                'base_price': float(zone.base_price),
                'price_per_km': float(zone.price_per_km),
                'zone_order': zone.zone_order,
            })
        
        return Response(data)
        
    except Exception as e:
        logger.error(f"Error al obtener zonas de envío: {str(e)}")
        return Response({
            'error': 'Error al obtener zonas'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping_cost(request):
    """
    Calcula el costo de envío según distancia
    POST /api/shipping/calculate
    Body: {
        "distance_km": 7.5,
        "shipping_method": "express",
        "order_amount": 25000  (opcional),
        "cart_items": [...]  (opcional, para verificar envío gratis por producto)
    }
    """
    try:
        distance_km = request.data.get('distance_km')
        shipping_method = request.data.get('shipping_method')
        order_amount = request.data.get('order_amount', 0)
        cart_items = request.data.get('cart_items', [])
        
        # Validaciones
        if not distance_km or not shipping_method:
            return Response({
                'error': 'Faltan parámetros: distance_km y shipping_method son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if shipping_method not in ['express', 'programado']:
            return Response({
                'error': 'Método de envío inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            distance_km = float(distance_km)
            order_amount = float(order_amount)
        except (ValueError, TypeError):
            return Response({
                'error': 'Los valores numéricos son inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar zona correspondiente
        logger.info(f"Buscando zona para {shipping_method}, distancia: {distance_km} km")
        
        # Debug: listar todas las zonas disponibles
        all_zones = ShippingZone.objects.filter(
            shipping_method=shipping_method,
            is_active=True
        )
        logger.info(f"Zonas disponibles para {shipping_method}:")
        for z in all_zones:
            logger.info(f"  - {z.zone_name}: {z.min_distance_km}-{z.max_distance_km} km")
        
        zone = ShippingZone.objects.filter(
            shipping_method=shipping_method,
            min_distance_km__lte=distance_km,
            max_distance_km__gt=distance_km,
            is_active=True
        ).first()
        
        if zone:
            logger.info(f"Zona encontrada: {zone.zone_name}")
        else:
            logger.warning(f"No se encontró zona para {distance_km} km")
        
        if not zone:
            # Fuera de cobertura
            config = ShippingConfig.get_config()
            max_distance = config.max_distance_express_km if shipping_method == 'express' else config.max_distance_programado_km
            
            return Response({
                'available': False,
                'error': 'Fuera de zona de cobertura',
                'max_distance_km': float(max_distance),
                'distance_km': distance_km
            }, status=status.HTTP_200_OK)
        
        # Calcular precio
        shipping_cost = zone.calculate_price(distance_km)
        logger.info(f"Costo calculado por zona: {shipping_cost}")
        
        # Verificar envío gratis POR PRODUCTO
        is_free_shipping = False
        free_shipping_reason = None
        
        # 1. Verificar si TODOS los productos en el carrito tienen envío gratis
        if cart_items:
            from catalogo.models import Producto
            logger.info(f"📦 Verificando envío gratis para {len(cart_items)} items")
            
            all_products_free_shipping = True
            for item in cart_items:
                producto_id = item.get('producto_id') or item.get('producto', {}).get('id')
                if producto_id:
                    try:
                        producto = Producto.objects.get(id=producto_id)
                        logger.info(f"  - Producto #{producto_id} ({producto.nombre}): envio_gratis={producto.envio_gratis}")
                        if not producto.envio_gratis:
                            all_products_free_shipping = False
                            break
                    except Producto.DoesNotExist:
                        logger.warning(f"  - Producto #{producto_id} no encontrado")
                        all_products_free_shipping = False
                        break
            
            if all_products_free_shipping and len(cart_items) > 0:
                is_free_shipping = True
                shipping_cost = 0
                free_shipping_reason = "Todos los productos tienen envío gratis"
                logger.info(f"✅ ENVÍO GRATIS APLICADO: {free_shipping_reason}")
        
        # 2. Si no hay envío gratis por producto, verificar regla por monto
        if not is_free_shipping:
            rule = ShippingPricingRule.objects.filter(
                shipping_method=shipping_method,
                is_active=True
            ).first()
            
            logger.info(f"Regla de envío gratis por monto: {rule}")
            if rule:
                logger.info(f"  - Umbral: {rule.free_shipping_threshold}")
                logger.info(f"  - Monto pedido: {order_amount}")
            
            if rule and rule.free_shipping_threshold:
                if order_amount >= float(rule.free_shipping_threshold):
                    is_free_shipping = True
                    shipping_cost = 0
                    free_shipping_reason = f"Monto del pedido supera umbral (${order_amount} >= ${rule.free_shipping_threshold})"
                    logger.info(f"✅ ENVÍO GRATIS APLICADO: {free_shipping_reason}")
                else:
                    logger.info(f"❌ No califica para envío gratis (pedido ${order_amount} < ${rule.free_shipping_threshold})")
        
        return Response({
            'available': True,
            'zone_id': zone.id,
            'zone_name': zone.zone_name,
            'distance_km': round(distance_km, 2),
            'base_price': float(zone.base_price),
            'shipping_cost': shipping_cost,
            'is_free_shipping': is_free_shipping,
            'free_shipping_threshold': float(rule.free_shipping_threshold) if rule and rule.free_shipping_threshold else None
        })
        
    except Exception as e:
        logger.error(f"Error al calcular costo de envío: {str(e)}")
        return Response({
            'error': 'Error al calcular costo de envío'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])  # TODO: Cambiar a IsAdminUser en producción
def update_shipping_config(request):
    """
    Actualiza la configuración de envíos (solo admin)
    PUT /api/shipping/config
    """
    try:
        config = ShippingConfig.get_config()
        
        if not config:
            # Crear nueva configuración
            config = ShippingConfig()
        
        # Actualizar campos
        if 'store_address' in request.data:
            config.store_address = request.data['store_address']
        if 'store_lat' in request.data:
            config.store_lat = Decimal(str(request.data['store_lat']))
        if 'store_lng' in request.data:
            config.store_lng = Decimal(str(request.data['store_lng']))
        if 'max_distance_express_km' in request.data:
            config.max_distance_express_km = Decimal(str(request.data['max_distance_express_km']))
        if 'max_distance_programado_km' in request.data:
            config.max_distance_programado_km = Decimal(str(request.data['max_distance_programado_km']))
        
        config.save()
        
        return Response({
            'success': True,
            'message': 'Configuración actualizada exitosamente'
        })
        
    except Exception as e:
        logger.error(f"Error al actualizar configuración: {str(e)}")
        return Response({
            'error': 'Error al actualizar configuración'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST', 'PUT'])
@permission_classes([AllowAny])  # TODO: Cambiar a IsAdminUser en producción
def create_or_update_zone(request):
    """
    Crea o actualiza una zona de envío (solo admin)
    POST /api/shipping/zones
    """
    try:
        zone_id = request.data.get('id')
        
        if zone_id:
            # Actualizar zona existente
            zone = ShippingZone.objects.get(id=zone_id)
        else:
            # Crear nueva zona
            zone = ShippingZone()
        
        # Actualizar campos
        zone.shipping_method = request.data.get('shipping_method', zone.shipping_method)
        zone.zone_name = request.data.get('zone_name', zone.zone_name)
        zone.min_distance_km = Decimal(str(request.data.get('min_distance_km', zone.min_distance_km)))
        zone.max_distance_km = Decimal(str(request.data.get('max_distance_km', zone.max_distance_km)))
        zone.base_price = Decimal(str(request.data.get('base_price', zone.base_price)))
        zone.price_per_km = Decimal(str(request.data.get('price_per_km', zone.price_per_km)))
        zone.zone_order = int(request.data.get('zone_order', zone.zone_order))
        
        zone.save()
        
        return Response({
            'success': True,
            'zone_id': zone.id,
            'message': 'Zona guardada exitosamente'
        })
        
    except Exception as e:
        logger.error(f"Error al guardar zona: {str(e)}")
        return Response({
            'error': 'Error al guardar zona'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def init_shipping_data(request):
    """
    Endpoint temporal para inicializar datos de shipping zones
    POST /api/pedidos/shipping/init/
    """
    try:
        # Crear o actualizar configuración principal
        config, created = ShippingConfig.objects.get_or_create(
            id=1,
            defaults={
                'store_name': 'Florería Cristina',
                'store_address': 'Av. Solano Vera 480, Yerba Buena, Tucumán',
                'store_lat': Decimal('-26.8167'),
                'store_lng': Decimal('-65.3167'),
                'max_distance_express_km': Decimal('5.00'),
                'max_distance_programado_km': Decimal('11.00'),
                'use_distance_matrix': True,
            }
        )
        
        result = {
            'config_created': created,
            'express_zones': [],
            'programado_zones': []
        }
        
        # Crear zonas Express
        express_zones = [
            {
                'zone_name': 'Yerba Buena Centro',
                'min_distance_km': Decimal('0'),
                'max_distance_km': Decimal('3'),
                'base_price': Decimal('5000.00'),
                'price_per_km': Decimal('0'),
                'zone_order': 1,
            },
            {
                'zone_name': 'Yerba Buena Extendido',
                'min_distance_km': Decimal('3'),
                'max_distance_km': Decimal('5'),
                'base_price': Decimal('7000.00'),
                'price_per_km': Decimal('500.00'),
                'zone_order': 2,
            },
        ]
        
        for zone_data in express_zones:
            zone, created = ShippingZone.objects.update_or_create(
                shipping_method='express',
                zone_order=zone_data['zone_order'],
                defaults=zone_data
            )
            result['express_zones'].append({
                'name': zone.zone_name,
                'created': created
            })
        
        # Crear zonas Programado
        programado_zones = [
            {
                'zone_name': 'Yerba Buena',
                'min_distance_km': Decimal('0'),
                'max_distance_km': Decimal('5'),
                'base_price': Decimal('5000.00'),
                'price_per_km': Decimal('0'),
                'zone_order': 1,
            },
            {
                'zone_name': 'San Miguel Centro',
                'min_distance_km': Decimal('5'),
                'max_distance_km': Decimal('8'),
                'base_price': Decimal('7000.00'),
                'price_per_km': Decimal('500.00'),
                'zone_order': 2,
            },
            {
                'zone_name': 'San Miguel Extendido',
                'min_distance_km': Decimal('8'),
                'max_distance_km': Decimal('11'),
                'base_price': Decimal('10000.00'),
                'price_per_km': Decimal('800.00'),
                'zone_order': 3,
            },
        ]
        
        for zone_data in programado_zones:
            zone, created = ShippingZone.objects.update_or_create(
                shipping_method='programado',
                zone_order=zone_data['zone_order'],
                defaults=zone_data
            )
            result['programado_zones'].append({
                'name': zone.zone_name,
                'created': created
            })
        
        return Response({
            'success': True,
            'message': 'Datos de shipping inicializados correctamente',
            'details': result
        })
        
    except Exception as e:
        logger.error(f"Error al inicializar shipping data: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
