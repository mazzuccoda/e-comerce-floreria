"""
URL configuration for floreria_cristina project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pedidos.simple_views import simple_checkout, simple_cart_test, simple_mis_pedidos, simple_pedido_detalle, simple_create_payment
from django.views.generic import TemplateView

# API URL patterns
api_urlpatterns = [
        path('catalogo/', include('catalogo.api_urls', namespace='catalogo-api')),
        path('carrito/', include('carrito.api_urls', namespace='carrito-api')),
        path('usuarios/', include('usuarios.api_urls')),
        path('pedidos/', include('pedidos.api_urls', namespace='pedidos-api')),
        path('notificaciones/', include('notificaciones.urls', namespace='notificaciones-api')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Admin Simple (solo superusuarios)
    path('admin-simple/', include('admin_simple.urls', namespace='admin_simple')),

    # Core (páginas estáticas, etc.)
    path('', include('core.urls', namespace='core')),

    # Apps principales con sus vistas de plantillas

    # Simple checkout endpoints (sin CSRF)
    path('direct-checkout/', simple_checkout, name='simple-checkout'),
    path('test-cart/', simple_cart_test, name='simple-cart-test'),
    path('api/pedidos/simple/mis-pedidos/', simple_mis_pedidos, name='simple-mis-pedidos'),
    path('api/pedidos/simple/<int:pedido_id>/', simple_pedido_detalle, name='simple-pedido-detalle'),
    path('api/pedidos/simple/<int:pedido_id>/payment/', simple_create_payment, name='simple-create-payment'),

    # API URLs
    path('api/', include(api_urlpatterns)),

    # Authentication (allauth)
    path('accounts/', include('allauth.urls')),
    path('accounts/', include('allauth.socialaccount.urls')),
    

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

    # Development fallbacks: expose cart endpoints without /api prefix
    # Esto permite que llamadas legacy a /carrito/simple funcionen en dev
    urlpatterns += [
        path('carrito/', include(('carrito.api_urls', 'carrito'), namespace='carrito-api-direct')),
    ]
else:
    # In production (Railway), also serve media files
    # Note: For large-scale production, use a CDN or cloud storage (S3, Cloudinary, etc.)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
