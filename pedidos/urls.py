from django.urls import path
from django.shortcuts import redirect
from .views import (
    CompraWizard, compra_resumen, seguimiento_pedido, crear_pedido, 
    procesar_pago, resumen_pago, pago_exitoso, mercadopago_webhook, 
    pago_fallido, pago_pendiente, mis_pedidos, detalle_pedido
)
from .forms import (
    SeleccionProductoForm, SeleccionAccesoriosForm,
    DedicatoriaForm, DatosEntregaForm, MetodoPagoForm
)

app_name = 'pedidos'

# Configuración del wizard
FORMS = [
    ("producto", SeleccionProductoForm),
    ("accesorios", SeleccionAccesoriosForm),
    ("dedicatoria", DedicatoriaForm),
    ("entrega", DatosEntregaForm),
    ("pago", MetodoPagoForm)
]

TEMPLATES = {
    "producto": "pedidos/compra_producto.html",
    "accesorios": "pedidos/compra_accesorios.html",
    "dedicatoria": "pedidos/compra_dedicatoria.html",
    "entrega": "pedidos/compra_entrega.html",
    "pago": "pedidos/compra_pago.html"
}

urlpatterns = [
    # Wizard de compra
    path('compra/', CompraWizard.as_view(
        form_list=FORMS,
        template_name='pedidos/compra_step_base.html'
    ), name='compra'),
    
    # Ruta antigua (redirige al wizard)
    path('crear/', lambda request: redirect('pedidos:compra'), name='crear_pedido'),
    
    # Nuevas rutas para el flujo de pago
    path('resumen/<int:pedido_id>/', resumen_pago, name='resumen_pago'),
    path('procesar-pago/<int:pedido_id>/', procesar_pago, name='procesar_pago'),
    path('mercadopago/webhook/', mercadopago_webhook, name='mercadopago_webhook'),
    path('pago-fallido/', pago_fallido, name='pago_fallido'),
    path('pago-pendiente/', pago_pendiente, name='pago_pendiente'),
    
    # Otras rutas existentes
    path('pago-exitoso/<int:pedido_id>/', pago_exitoso, name='pago_exitoso'),
    path('confirmacion-exitosa/<int:pedido_id>/', procesar_pago, name='pago_confirmado'),
    path('compra-resumen/<int:pedido_id>/', compra_resumen, name='compra_resumen'),
    path('seguimiento/', seguimiento_pedido, name='seguimiento_pedido'),

    # Rutas para el historial de pedidos del usuario
    path('mis-pedidos/', mis_pedidos, name='mis_pedidos'),
    path('detalle/<int:pedido_id>/', detalle_pedido, name='detalle_pedido'),
]
