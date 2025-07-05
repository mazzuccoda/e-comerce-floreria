from django.urls import path
from .views import CompraWizard, compra_resumen, seguimiento_pedido, crear_pedido, procesar_pago


app_name = 'pedidos'

urlpatterns = [
    path('crear/', crear_pedido, name='crear_pedido'),
    path('procesar-pago/', procesar_pago, name='procesar_pago'),
    # URL para iniciar la compra con un producto específico
    path('comprar/<int:producto_id>/', CompraWizard.as_view(), name='iniciar_compra_con_producto'),

    # URL para iniciar la compra sin producto pre-seleccionado (opcional)
    path('comprar/', CompraWizard.as_view(), name='iniciar_compra'),

    # URL para el resumen del pedido
    path('resumen/<int:pedido_id>/', compra_resumen, name='compra_resumen'),
    # Seguimiento de pedido
    path('seguimiento/', seguimiento_pedido, name='seguimiento_pedido'),
]
