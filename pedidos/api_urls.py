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
    
    # Zonas de entrega
    path('validate-zone/', validate_delivery_zone, name='validate-zone'),
    path('delivery-zones/', get_delivery_zones, name='delivery-zones'),
]
