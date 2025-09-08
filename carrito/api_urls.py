from django.urls import path
from . import api_views, simple_views

app_name = 'carrito'

urlpatterns = [
    # API endpoints simples (sin middleware problemático)
    path('simple/', simple_views.simple_get_cart, name='simple-cart'),
    path('simple/add/', simple_views.simple_add_to_cart, name='simple-add-to-cart'),
    
    # API endpoints originales
    path('', api_views.CartDetailView.as_view(), name='cart-detail'),
    path('add/', api_views.AddToCartView.as_view(), name='add-to-cart'),
    path('update/', api_views.UpdateCartItemView.as_view(), name='update-cart-item'),
    path('remove/', api_views.RemoveFromCartView.as_view(), name='remove-from-cart'),
    path('clear/', api_views.ClearCartView.as_view(), name='clear-cart'),
    path('summary/', api_views.CartSummaryView.as_view(), name='cart-summary'),
]
