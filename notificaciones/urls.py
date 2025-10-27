"""
URLs para el módulo de notificaciones
"""
from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    path('test-whatsapp/', views.test_whatsapp, name='test_whatsapp'),
]
