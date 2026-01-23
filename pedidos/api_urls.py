from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .api_views import (
    CheckoutView,
    PedidoDetailView,
    PedidoListView,
    MetodoEnvioListView,
    ValidateStockView,
    StockStatusView,
    CheckoutSummaryView,
    GenerateTransferQRView
)
from .simple_checkout import simple_checkout, test_cart
from .simple_views import simple_checkout_with_items
from .payment_views import (
    CreatePaymentView,
    MercadoPagoWebhookView,
    PaymentSuccessView,
    PaymentFailureView,
    PaymentPendingView,
    CreatePayPalPaymentView,
    PayPalSuccessView,
    PayPalCancelView
)
from .views_debug import test_mercadopago_view
from .views_zones import validate_delivery_zone, get_delivery_zones
from .shipping_views import (
    get_shipping_config,
    get_shipping_zones,
    calculate_shipping_cost,
    update_shipping_config,
    create_or_update_zone,
    init_shipping_data
)
from .carrito_abandonado_views import (
    registrar_carrito_abandonado,
    listar_carritos_pendientes,
    marcar_recordatorio_enviado,
    marcar_carrito_recuperado
)

app_name = 'pedidos-api'

urlpatterns = [
    # Debug - ELIMINAR EN PRODUCCIÓN
    path('test-mercadopago/', test_mercadopago_view, name='test-mercadopago'),
    
    # Checkout
    path('checkout/', csrf_exempt(CheckoutView.as_view()), name='checkout'),
    path('simple-checkout/', simple_checkout, name='simple-checkout'),
    path('checkout-with-items/', simple_checkout_with_items, name='checkout-with-items'),
    path('test-cart/', test_cart, name='test-cart'),
    path('checkout/summary/', CheckoutSummaryView.as_view(), name='checkout-summary'),
    path('validate-stock/', ValidateStockView.as_view(), name='validate-stock'),
    path('stock-status/', StockStatusView.as_view(), name='stock-status'),
    path('metodos-envio/', MetodoEnvioListView.as_view(), name='metodos-envio'),
    
    # Pedidos
    path('<int:pedido_id>/', PedidoDetailView.as_view(), name='pedido-detail'),
    path('mis-pedidos/', PedidoListView.as_view(), name='mis-pedidos'),
    
    # Pagos - MercadoPago
    path('<int:pedido_id>/payment/', CreatePaymentView.as_view(), name='create-payment'),
    path('webhook/mercadopago/', MercadoPagoWebhookView.as_view(), name='mp-webhook'),
    path('<int:pedido_id>/payment/success/', PaymentSuccessView.as_view(), name='payment-success'),
    path('<int:pedido_id>/payment/failure/', PaymentFailureView.as_view(), name='payment-failure'),
    path('<int:pedido_id>/payment/pending/', PaymentPendingView.as_view(), name='payment-pending'),
    
    # Pagos - PayPal
    path('<int:pedido_id>/payment/paypal/', CreatePayPalPaymentView.as_view(), name='create-paypal-payment'),
    path('<int:pedido_id>/payment/paypal/success/', PayPalSuccessView.as_view(), name='paypal-success'),
    path('<int:pedido_id>/payment/paypal/cancel/', PayPalCancelView.as_view(), name='paypal-cancel'),
    
    # QR de transferencia (OPCIONAL)
    path('<int:pedido_id>/generate-transfer-qr/', GenerateTransferQRView.as_view(), name='generate-transfer-qr'),
    
    # Zonas de entrega (legacy)
    path('validate-zone/', validate_delivery_zone, name='validate-zone'),
    path('delivery-zones/', get_delivery_zones, name='delivery-zones'),
    
    # Sistema de zonas con Distance Matrix
    path('shipping/config/', get_shipping_config, name='shipping-config'),
    path('shipping/zones/<str:method>/', get_shipping_zones, name='shipping-zones'),
    path('shipping/calculate/', calculate_shipping_cost, name='shipping-calculate'),
    path('shipping/config/update/', update_shipping_config, name='shipping-config-update'),
    path('shipping/zones/save/', create_or_update_zone, name='shipping-zone-save'),
    path('shipping/init/', init_shipping_data, name='shipping-init'),  # Endpoint temporal
    
    # Carritos abandonados
    path('carrito-abandonado/', registrar_carrito_abandonado, name='registrar-carrito-abandonado'),
    path('carritos-pendientes/', listar_carritos_pendientes, name='listar-carritos-pendientes'),
    path('carrito-abandonado/<int:carrito_id>/recordatorio-enviado/', marcar_recordatorio_enviado, name='marcar-recordatorio-enviado'),
    path('carrito-abandonado/<int:carrito_id>/recuperado/', marcar_carrito_recuperado, name='marcar-carrito-recuperado'),
]
