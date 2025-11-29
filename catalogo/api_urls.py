from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api

# Creamos un router y registramos nuestros viewsets.
# El router se encarga de generar automáticamente las URLs para las vistas.
router = DefaultRouter()
router.register(r'productos', api.ProductoViewSet, basename='producto-api')
router.register(r'categorias', api.CategoriaViewSet, basename='categoria-api')
router.register(r'tipos-flor', api.TipoFlorViewSet, basename='tipoflor-api')
router.register(r'ocasiones', api.OcasionViewSet, basename='ocasion-api')
router.register(r'zonas', api.ZonaEntregaViewSet, basename='zonaentrega-api')
router.register(r'hero-slides', api.HeroSlideViewSet, basename='heroslide-api')

app_name = 'catalogo-api'

# Las URLs de la API son determinadas automáticamente por el router.
urlpatterns = [
    path('', include(router.urls)),
]
