from django.urls import path
from . import views

app_name = 'catalogo'

urlpatterns = [
    # Lista de productos
    path('productos/', views.product_list, name='productos'),
    
    # Detalle de un producto
    path('producto/<slug:slug>/', views.product_detail, name='detalle_producto'),
    
    # Categoría de productos
    path('categoria/<slug:slug>/', views.category_detail, name='categoria'),
    
    # Búsqueda de productos
    path('buscar/', views.search, name='buscar'),
]
