from django.urls import path
from . import views

app_name = 'admin_simple'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('productos/', views.productos_list, name='productos-list'),
    path('productos/<int:pk>/editar/', views.producto_edit, name='producto-edit'),
    path('productos/<int:pk>/toggle/', views.producto_toggle, name='producto-toggle'),
    path('productos/<int:pk>/update-field/', views.producto_update_field, name='producto-update-field'),
]
