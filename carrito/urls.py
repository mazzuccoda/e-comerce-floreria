from django.urls import path
from . import views

app_name = 'carrito'

urlpatterns = [
        path('', views.cart_detail, name='ver_carrito'),
    path('add/<int:product_id>/', views.cart_add, name='cart_add'),
    path('remove/<int:product_id>/', views.cart_remove, name='cart_remove'),
]
