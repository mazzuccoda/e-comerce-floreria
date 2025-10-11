from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .api_views import (
    CheckoutView,
    PedidoDetailView,
    PedidoListView,
    MetodoEnvioListView,
    ValidateStockView,
    StockStatusView,
    CheckoutSummaryView
)
from .simple_checkout import simple_checkout, test_cart
from .payment_views import (
    CreatePaymentView,
    MercadoPagoWebhookView,
    PaymentSuccessView,
    PaymentFailureView,
    PaymentPendingView
)

app_name = 'pedidos-api'

urlpatterns = [
    # Checkout
    path('checkout/', csrf_exempt(CheckoutView.as_view()), name='checkout'),
    path('simple-checkout/', simple_checkout, name='simple-checkout'),
    path('test-cart/', test_cart, name='test-cart'),
    path('checkout/summary/', CheckoutSummaryView.as_view(), name='checkout-summary'),
    path('validate-stock/', ValidateStockView.as_view(), name='validate-stock'),
    path('stock-status/', StockStatusView.as_view(), name='stock-status'),
    path('metodos-envio/', MetodoEnvioListView.as_view(), name='metodos-envio'),
    
    # Pedidos
    path('<int:pedido_id>/', PedidoDetailView.as_view(), name='pedido-detail'),
    path('mis-pedidos/', PedidoListView.as_view(), name='mis-pedidos'),
    
    # Pagos
    path('<int:pedido_id>/payment/', CreatePaymentView.as_view(), name='create-payment'),
    path('webhook/mercadopago/', MercadoPagoWebhookView.as_view(), name='mp-webhook'),
    path('<int:pedido_id>/payment/success/', PaymentSuccessView.as_view(), name='payment-success'),
    path('<int:pedido_id>/payment/failure/', PaymentFailureView.as_view(), name='payment-failure'),
    path('<int:pedido_id>/payment/pending/', PaymentPendingView.as_view(), name='payment-pending'),
]
