"""
Cotización de envío sin navegador: resuelve una dirección a coordenadas,
mide la distancia hasta la tienda y aplica las zonas y reglas configuradas.
"""
import hashlib
import logging
from decimal import Decimal
from math import asin, cos, radians, sin, sqrt

import requests
from django.conf import settings
from django.core.cache import cache

from catalogo.models import Producto

from .models import ShippingConfig, ShippingPricingRule, ShippingZone

logger = logging.getLogger(__name__)

SHIPPING_METHODS = ('express', 'programado')

# La distancia en línea recta subestima el recorrido real por calle
ROAD_DISTANCE_FACTOR = 1.3

GEOCODE_REGION = 'ar'
GEOCODE_CONTEXT = 'Tucumán, Argentina'
GEOCODE_TIMEOUT = 8

PICKUP_HOURS = '9:00 a 20:00 hs'

# Cada cotización cuesta dos llamadas pagas a Google (geocoding + distancia)
GEOCODE_CACHE_SECONDS = 24 * 60 * 60


class GeocodingError(Exception):
    """La dirección no pudo resolverse a coordenadas."""


def haversine_km(lat1, lng1, lat2, lng2):
    lng1, lat1, lng2, lat2 = map(radians, [lng1, lat1, lng2, lat2])
    dlng = lng2 - lng1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


def _google_api_key():
    return getattr(settings, 'GOOGLE_MAPS_API_KEY', '') or ''


def _geocode_google(address, api_key):
    response = requests.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        params={'address': address, 'region': GEOCODE_REGION, 'key': api_key},
        timeout=GEOCODE_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get('status') != 'OK' or not payload.get('results'):
        raise GeocodingError(payload.get('status', 'ZERO_RESULTS'))

    result = payload['results'][0]
    location = result['geometry']['location']
    return {
        'lat': location['lat'],
        'lng': location['lng'],
        'resolved_address': result.get('formatted_address', address),
        'source': 'google_geocoding',
    }


def _geocode_nominatim(address):
    response = requests.get(
        'https://nominatim.openstreetmap.org/search',
        params={
            'q': address,
            'format': 'json',
            'countrycodes': 'ar',
            'limit': 1,
        },
        headers={'User-Agent': 'floreriacristina.com.ar shipping quote'},
        timeout=GEOCODE_TIMEOUT,
    )
    response.raise_for_status()
    results = response.json()

    if not results:
        raise GeocodingError('ZERO_RESULTS')

    return {
        'lat': float(results[0]['lat']),
        'lng': float(results[0]['lon']),
        'resolved_address': results[0].get('display_name', address),
        'source': 'nominatim',
    }


def _cache_key(prefix, *partes):
    firma = hashlib.sha256('|'.join(str(parte) for parte in partes).encode()).hexdigest()[:32]
    return f'envio:{prefix}:{firma}'


def geocode_address(address):
    """Resuelve una dirección de Tucumán a coordenadas."""
    query = address if GEOCODE_CONTEXT.lower() in address.lower() else f'{address}, {GEOCODE_CONTEXT}'
    clave = _cache_key('geocode', query.strip().lower())
    cacheado = cache.get(clave)
    if cacheado:
        return cacheado

    api_key = _google_api_key()

    if api_key:
        try:
            location = _geocode_google(query, api_key)
            cache.set(clave, location, GEOCODE_CACHE_SECONDS)
            return location
        except (requests.RequestException, GeocodingError, KeyError, ValueError) as exc:
            logger.warning('Geocoding con Google falló para %r: %s', address, exc)

    location = _geocode_nominatim(query)
    cache.set(clave, location, GEOCODE_CACHE_SECONDS)
    return location


def _driving_distance_google(config, lat, lng, api_key):
    response = requests.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        params={
            'origins': f'{config.store_lat},{config.store_lng}',
            'destinations': f'{lat},{lng}',
            'mode': 'driving',
            'key': api_key,
        },
        timeout=GEOCODE_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()
    element = payload['rows'][0]['elements'][0]

    if element.get('status') != 'OK':
        raise GeocodingError(element.get('status', 'NOT_FOUND'))

    return element['distance']['value'] / 1000


def distance_from_store_km(config, lat, lng):
    """Distancia hasta la tienda: por calle si hay API key, estimada si no."""
    api_key = _google_api_key()

    if api_key and config.use_distance_matrix:
        clave = _cache_key('distancia', config.store_lat, config.store_lng, round(lat, 5), round(lng, 5))
        cacheado = cache.get(clave)
        if cacheado is not None:
            return cacheado, 'google_distance_matrix'

        try:
            distance = _driving_distance_google(config, lat, lng, api_key)
            distance = round(distance, 2)
            cache.set(clave, distance, GEOCODE_CACHE_SECONDS)
            return distance, 'google_distance_matrix'
        except (requests.RequestException, GeocodingError, KeyError, IndexError, ValueError) as exc:
            logger.warning('Distance Matrix falló: %s', exc)

    straight = haversine_km(float(config.store_lat), float(config.store_lng), lat, lng)
    return round(straight * ROAD_DISTANCE_FACTOR, 2), 'estimada_linea_recta'


def find_zone(shipping_method, distance_km):
    return ShippingZone.objects.filter(
        shipping_method=shipping_method,
        min_distance_km__lte=distance_km,
        max_distance_km__gt=distance_km,
        is_active=True,
    ).first()


def all_items_have_free_shipping(cart_items):
    if not cart_items:
        return False

    for item in cart_items:
        producto_id = item.get('producto_id') or (item.get('producto') or {}).get('id')
        if not producto_id:
            return False

        producto = Producto.objects.filter(id=producto_id).first()
        if not producto or not producto.envio_gratis:
            return False

    return True


def free_shipping_threshold(shipping_method):
    rule = ShippingPricingRule.objects.filter(
        shipping_method=shipping_method,
        is_active=True,
    ).first()

    if rule and rule.free_shipping_threshold:
        return float(rule.free_shipping_threshold)

    return None


def quote_method(shipping_method, distance_km, order_amount=0, cart_items=None):
    """Cotiza un método de envío para una distancia ya conocida."""
    config = ShippingConfig.get_config()
    zone = find_zone(shipping_method, distance_km)
    threshold = free_shipping_threshold(shipping_method)

    if not zone:
        max_distance = None
        if config:
            max_distance = float(
                config.max_distance_express_km
                if shipping_method == 'express'
                else config.max_distance_programado_km
            )

        return {
            'shipping_method': shipping_method,
            'available': False,
            'reason': 'Fuera de la zona de cobertura',
            'max_distance_km': max_distance,
            'distance_km': distance_km,
        }

    shipping_cost = zone.calculate_price(distance_km)
    is_free = False
    free_reason = None

    if all_items_have_free_shipping(cart_items):
        is_free = True
        free_reason = 'Todos los productos del pedido tienen envío gratis'
    elif threshold is not None and float(order_amount or 0) >= threshold:
        is_free = True
        free_reason = f'El pedido supera el mínimo de envío gratis (${threshold:.0f})'

    if is_free:
        shipping_cost = 0

    return {
        'shipping_method': shipping_method,
        'available': True,
        'zone_id': zone.id,
        'zone_name': zone.zone_name,
        'distance_km': distance_km,
        'base_price': float(zone.base_price),
        'shipping_cost': shipping_cost,
        'currency': 'ARS',
        'is_free_shipping': is_free,
        'free_shipping_reason': free_reason,
        'free_shipping_threshold': threshold,
    }


def costo_envio_servidor(tipo_envio, direccion, ciudad='', order_amount=0, cart_items=None):
    """Costo de envío calculado acá, sin confiar en lo que mande el navegador.

    Devuelve None cuando no se puede resolver (sin configuración, sin dirección,
    geocodificación caída o fuera de zona): en esos casos el llamador decide.
    """
    if tipo_envio == 'retiro':
        return Decimal('0.00')

    if tipo_envio not in SHIPPING_METHODS:
        return None

    config = ShippingConfig.get_config()
    direccion = (direccion or '').strip()
    if not config or not direccion:
        return None

    consulta = f'{direccion}, {ciudad}'.strip(', ') if ciudad else direccion

    try:
        location = geocode_address(consulta)
        distancia, _ = distance_from_store_km(config, location['lat'], location['lng'])
        cotizacion = quote_method(
            tipo_envio,
            distancia,
            order_amount=order_amount,
            cart_items=cart_items,
        )
    except Exception as exc:  # el checkout no puede caerse porque Google no responda
        logger.warning('No se pudo cotizar el envío para %r: %s', consulta, exc)
        return None

    if not cotizacion.get('available'):
        return None

    return Decimal(str(cotizacion['shipping_cost']))


def pickup_option(config):
    return {
        'shipping_method': 'retiro',
        'available': True,
        'shipping_cost': 0,
        'currency': 'ARS',
        'pickup_address': config.store_address if config else None,
        'pickup_hours': PICKUP_HOURS,
    }
