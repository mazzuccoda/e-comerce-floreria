"""URLs públicas para agentes de compra.

Se declaran con y sin barra final para que una integración externa no quede
atrapada en una redirección al usar POST.
"""
from django.urls import path

from pedidos.agente_views import (
    confirmar_solicitud,
    crear_pedido_publico,
    disponibilidad_entrega,
    estado_solicitud,
    validar_pedido,
)
from pedidos.shipping_quote_views import quote_shipping

from .public_api import buscar_productos, info_tienda, precarrito, producto_por_sku

app_name = 'publico'

urlpatterns = [
    path('productos', buscar_productos, name='productos'),
    path('productos/', buscar_productos),
    path('tienda', info_tienda, name='tienda'),
    path('tienda/', info_tienda),
    path('carrito', precarrito, name='carrito'),
    path('carrito/', precarrito),
    path('envio/cotizar', quote_shipping, name='envio-cotizar'),
    path('envio/cotizar/', quote_shipping),
    path('entrega/disponibilidad', disponibilidad_entrega, name='entrega-disponibilidad'),
    path('entrega/disponibilidad/', disponibilidad_entrega),
    path('pedidos/validar', validar_pedido, name='pedidos-validar'),
    path('pedidos/validar/', validar_pedido),
    path('pedidos/solicitud/<str:token>/confirmar', confirmar_solicitud, name='pedidos-solicitud-confirmar'),
    path('pedidos/solicitud/<str:token>/confirmar/', confirmar_solicitud),
    path('pedidos/solicitud/<str:token>', estado_solicitud, name='pedidos-solicitud'),
    path('pedidos/solicitud/<str:token>/', estado_solicitud),
    path('pedidos', crear_pedido_publico, name='pedidos'),
    path('pedidos/', crear_pedido_publico),
    # Va al final: si no, captura /productos/<sku> antes que las rutas literales.
    path('productos/<str:sku>', producto_por_sku, name='producto'),
    path('productos/<str:sku>/', producto_por_sku),
]
