"""URLs públicas para agentes de compra.

Se declaran con y sin barra final para que una integración externa no quede
atrapada en una redirección al usar POST.
"""
from django.urls import path

from pedidos.shipping_quote_views import quote_shipping

from .public_api import buscar_productos, info_tienda

app_name = 'publico'

urlpatterns = [
    path('productos', buscar_productos, name='productos'),
    path('productos/', buscar_productos),
    path('tienda', info_tienda, name='tienda'),
    path('tienda/', info_tienda),
    path('envio/cotizar', quote_shipping, name='envio-cotizar'),
    path('envio/cotizar/', quote_shipping),
]
