"""
URLs para el módulo de notificaciones
"""
from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    path('', views.test_whatsapp, name='test_whatsapp'),
]
