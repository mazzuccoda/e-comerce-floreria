"""
Views para validación de zonas de entrega
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from catalogo.models import ZonaEntrega
from math import radians, cos, sin, asin, sqrt


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
    Retorna la distancia en kilómetros.
    """
    # Convertir grados a radianes
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Fórmula de Haversine
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radio de la Tierra en kilómetros
    r = 6371
    
    return c * r


@api_view(['POST'])
def validate_delivery_zone(request):
    """
    Valida si una dirección está en zona de cobertura.
    
    Request body:
    {
        "lat": -34.6037,
        "lng": -58.3816,
        "formatted_address": "Av. Corrientes 1234, Buenos Aires"
    }
    
    Response:
    {
        "delivers_here": true,
        "zone_name": "Capital Federal",
        "delivery_cost": 1500.00,
        "estimated_time": "60-90 minutos",
        "free_shipping_from": 50000.00,
        "distance_km": 5.2
    }
    """
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    formatted_address = request.data.get('formatted_address', '')
    
    if not lat or not lng:
        return Response(
            {'error': 'Coordenadas (lat, lng) son requeridas'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Coordenadas inválidas'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Obtener todas las zonas activas
    zonas = ZonaEntrega.objects.filter(is_active=True)
    
    if not zonas.exists():
        return Response({
            'delivers_here': False,
            'message': 'No hay zonas de entrega configuradas',
        })
    
    # Por ahora, validación simple: si hay zonas activas, entregamos
    # TODO: Implementar validación geográfica real con polígonos
    
    # Buscar la zona más cercana (simulado)
    # En producción, deberías tener coordenadas de centro para cada zona
    # o usar polígonos geográficos con PostGIS
    
    # Para este ejemplo, usamos la primera zona activa
    zona = zonas.first()
    
    # Validación básica por ciudad (extraer de la dirección)
    ciudad_lower = formatted_address.lower()
    
    # Lista de ciudades/zonas que cubrimos (ejemplo)
    zonas_cobertura = [
        'buenos aires', 'capital federal', 'caba',
        'palermo', 'recoleta', 'belgrano', 'caballito',
        'villa crespo', 'almagro', 'flores'
    ]
    
    delivers = any(zona_nombre in ciudad_lower for zona_nombre in zonas_cobertura)
    
    if delivers:
        # Calcular distancia aproximada desde el centro (ejemplo: Obelisco)
        centro_lat = -34.6037
        centro_lng = -58.3816
        distance_km = haversine_distance(lat, lng, centro_lat, centro_lng)
        
        # Ajustar costo según distancia (opcional)
        base_cost = float(zona.costo_envio)
        if distance_km > 10:
            delivery_cost = base_cost * 1.5  # 50% más caro si está lejos
        else:
            delivery_cost = base_cost
        
        # Estimar tiempo según distancia
        if distance_km < 5:
            estimated_time = "30-45 minutos"
        elif distance_km < 10:
            estimated_time = "45-60 minutos"
        elif distance_km < 15:
            estimated_time = "60-90 minutos"
        else:
            estimated_time = "90-120 minutos"
        
        return Response({
            'delivers_here': True,
            'zone_name': zona.nombre,
            'delivery_cost': round(delivery_cost, 2),
            'estimated_time': estimated_time,
            'free_shipping_from': float(zona.envio_gratis_desde),
            'distance_km': round(distance_km, 2),
            'message': f'✓ Hacemos entregas en {zona.nombre}',
        })
    else:
        return Response({
            'delivers_here': False,
            'message': 'Lo sentimos, aún no hacemos entregas en esta zona',
            'suggestion': 'Por favor, verifica que la dirección esté en Capital Federal o zonas cercanas',
        })


@api_view(['GET'])
def get_delivery_zones(request):
    """
    Retorna todas las zonas de entrega activas.
    """
    zonas = ZonaEntrega.objects.filter(is_active=True)
    
    data = [{
        'id': zona.id,
        'nombre': zona.nombre,
        'descripcion': zona.descripcion,
        'costo_envio': float(zona.costo_envio),
        'envio_gratis_desde': float(zona.envio_gratis_desde),
    } for zona in zonas]
    
    return Response(data)
