"""Cotización de envío a partir de una dirección, sin depender del navegador."""
import logging

import requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ShippingConfig
from .shipping_service import (
    SHIPPING_METHODS,
    GeocodingError,
    distance_from_store_km,
    geocode_address,
    pickup_option,
    quote_method,
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def quote_shipping(request):
    """
    POST /api/pedidos/shipping/quote/

    Body: {"address": "Av. Aconquija 1234, Yerba Buena"}  o  {"lat": -26.81, "lng": -65.30}
    También se aceptan los nombres en español: "direccion", "latitud", "longitud".
    Opcionales: "shipping_method" ("express" | "programado"), "order_amount", "cart_items"

    Devuelve la distancia hasta la tienda y el costo de cada método disponible,
    más el retiro en tienda.
    """
    address = (request.data.get('address') or request.data.get('direccion') or '').strip()
    lat = request.data.get('lat', request.data.get('latitud'))
    lng = request.data.get('lng', request.data.get('longitud'))
    requested_method = request.data.get('shipping_method')
    order_amount = request.data.get('order_amount', 0)
    cart_items = request.data.get('cart_items') or []

    if requested_method and requested_method not in SHIPPING_METHODS:
        return Response(
            {'error': f'shipping_method inválido. Use uno de: {", ".join(SHIPPING_METHODS)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    config = ShippingConfig.get_config()
    if not config:
        return Response(
            {'error': 'No hay configuración de envíos disponible'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if lat is not None and lng is not None:
        try:
            location = {
                'lat': float(lat),
                'lng': float(lng),
                'resolved_address': address or None,
                'source': 'coordenadas',
            }
        except (TypeError, ValueError):
            return Response({'error': 'Coordenadas inválidas'}, status=status.HTTP_400_BAD_REQUEST)
    elif address:
        try:
            location = geocode_address(address)
        except GeocodingError:
            return Response(
                {
                    'error': 'No pudimos ubicar esa dirección',
                    'address': address,
                    'pickup': pickup_option(config),
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except requests.RequestException as exc:
            logger.error('Geocoding no disponible: %s', exc)
            return Response(
                {'error': 'El servicio de direcciones no está disponible en este momento'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
    else:
        return Response(
            {'error': 'Indicá una dirección ("address" o "direccion") o coordenadas ("lat" y "lng")'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    distance_km, distance_source = distance_from_store_km(config, location['lat'], location['lng'])

    methods = [requested_method] if requested_method else list(SHIPPING_METHODS)
    options = [
        quote_method(method, distance_km, order_amount=order_amount, cart_items=cart_items)
        for method in methods
    ]
    options.append(pickup_option(config))

    return Response({
        'address': {
            'query': address or None,
            'resolved': location.get('resolved_address'),
            'lat': location['lat'],
            'lng': location['lng'],
            'source': location['source'],
        },
        'distance_km': distance_km,
        'distance_source': distance_source,
        'delivers_here': any(option.get('available') and option['shipping_method'] != 'retiro' for option in options),
        'options': options,
        'store': {
            'name': config.store_name,
            'address': config.store_address,
            'lat': float(config.store_lat),
            'lng': float(config.store_lng),
        },
    })
