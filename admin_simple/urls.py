from django.urls import path
from . import views
from .test_view import test_simple

app_name = 'admin_simple'

urlpatterns = [
    path('test/', test_simple, name='test'),
    path('', views.dashboard, name='dashboard'),
    
    # Productos
    path('productos/', views.productos_list, name='productos-list'),
    path('productos/<int:pk>/editar/', views.producto_edit, name='producto-edit'),
    path('productos/<int:pk>/toggle/', views.producto_toggle, name='producto-toggle'),
    path('productos/<int:pk>/update-field/', views.producto_update_field, name='producto-update-field'),
    
    # Pedidos
    path('pedidos/', views.pedidos_list, name='pedidos-list'),
    path('pedidos/<int:pk>/', views.pedido_detail, name='pedido-detail'),
    path('pedidos/<int:pk>/cambiar-estado/', views.pedido_cambiar_estado, name='pedido-cambiar-estado'),
    path('pedidos/<int:pk>/confirmar/', views.pedido_confirmar, name='pedido-confirmar'),
    path('pedidos/<int:pk>/cancelar/', views.pedido_cancelar, name='pedido-cancelar'),
    path('pedidos/<int:pk>/pdf/', views.pedido_pdf, name='pedido-pdf'),
]
