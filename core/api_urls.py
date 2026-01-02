from django.urls import path

from . import api_views

app_name = 'core-api'

urlpatterns = [
    path('site-settings/', api_views.site_settings, name='site-settings'),
]
