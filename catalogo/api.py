from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Producto, Categoria, TipoFlor, Ocasion, ZonaEntrega, HeroSlide
from .serializers import (
    ProductoSerializer, CategoriaSerializer, TipoFlorSerializer, 
    OcasionSerializer, ZonaEntregaSerializer, HeroSlideSerializer
)
from core.translation_service import translation_service


class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los productos.
    Se puede acceder a la lista en `/api/catalogo/productos/`
    y al detalle en `/api/catalogo/productos/<slug>/`.
    """
    queryset = Producto.objects.filter(is_active=True).prefetch_related(
        'imagenes', 'tipo_flor', 'ocasiones'
    )
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'  # Usar ID para las URLs (cambiado de 'slug' a 'id')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros por query params
        categoria = self.request.query_params.get('categoria')
        tipo_flor = self.request.query_params.get('tipo_flor')
        ocasion = self.request.query_params.get('ocasion')
        precio_min = self.request.query_params.get('precio_min')
        precio_max = self.request.query_params.get('precio_max')
        destacados = self.request.query_params.get('destacados')
        adicionales = self.request.query_params.get('adicionales')
        ordering = self.request.query_params.get('ordering')
        search = self.request.query_params.get('search')
        
        if categoria:
            queryset = queryset.filter(categoria__slug=categoria)
        
        if tipo_flor:
            queryset = queryset.filter(tipo_flor__id=tipo_flor)
        
        if ocasion:
            queryset = queryset.filter(ocasiones__id=ocasion)
        
        if precio_min:
            queryset = queryset.filter(precio__gte=precio_min)
        
        if precio_max:
            queryset = queryset.filter(precio__lte=precio_max)
        
        if destacados == 'true':
            queryset = queryset.filter(is_featured=True)
        
        if adicionales == 'true':
            queryset = queryset.filter(es_adicional=True)
        elif adicionales == 'false':
            queryset = queryset.filter(es_adicional=False)
        
        # Búsqueda por nombre o descripción
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(nombre__icontains=search) | 
                Q(descripcion__icontains=search) |
                Q(descripcion_corta__icontains=search)
            )
        
        # Ordenamiento
        if ordering == 'nombre':
            queryset = queryset.order_by('nombre')
        elif ordering == '-nombre':
            queryset = queryset.order_by('-nombre')
        elif ordering == 'precio':
            queryset = queryset.order_by('precio')
        elif ordering == '-precio':
            queryset = queryset.order_by('-precio')
        elif ordering == 'fecha':
            queryset = queryset.order_by('created_at')
        elif ordering == '-fecha':
            queryset = queryset.order_by('-created_at')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list para aplicar traducciones"""
        response = super().list(request, *args, **kwargs)
        
        # Detectar idioma solicitado
        lang = request.query_params.get('lang', 'es')
        
        # Traducir si no es español
        if lang != 'es' and response.data:
            if 'results' in response.data:
                # Paginado
                response.data['results'] = translation_service.translate_products(
                    response.data['results'], 
                    target_lang=lang
                )
            else:
                # Sin paginación
                response.data = translation_service.translate_products(
                    response.data, 
                    target_lang=lang
                )
        
        return response
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve para aplicar traducciones"""
        response = super().retrieve(request, *args, **kwargs)
        
        # Detectar idioma solicitado
        lang = request.query_params.get('lang', 'es')
        
        # Traducir si no es español
        if lang != 'es' and response.data:
            response.data = translation_service.translate_product(
                response.data, 
                target_lang=lang
            )
        
        return response
    
    @action(detail=False, methods=['get'])
    def recomendados(self, request):
        """Endpoint para obtener productos recomendados (destacados)"""
        productos = self.get_queryset().filter(is_featured=True, es_adicional=False)
        serializer = self.get_serializer(productos, many=True)
        data = serializer.data
        
        # Traducir si es necesario
        lang = request.query_params.get('lang', 'es')
        if lang != 'es':
            data = translation_service.translate_products(data, target_lang=lang)
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def adicionales(self, request):
        """Endpoint para obtener productos adicionales"""
        productos = self.get_queryset().filter(es_adicional=True)
        serializer = self.get_serializer(productos, many=True)
        data = serializer.data
        
        # Traducir si es necesario
        lang = request.query_params.get('lang', 'es')
        if lang != 'es':
            data = translation_service.translate_products(data, target_lang=lang)
        
        return Response(data)


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver las categorías.
    Se puede acceder a la lista en `/api/catalogo/categorias/`
    y al detalle en `/api/catalogo/categorias/<slug>/`.
    """
    queryset = Categoria.objects.filter(is_active=True)
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    def list(self, request, *args, **kwargs):
        """Override list para aplicar traducciones"""
        response = super().list(request, *args, **kwargs)
        lang = request.query_params.get('lang', 'es')
        
        if lang != 'es' and response.data:
            for item in response.data:
                if 'nombre' in item:
                    item['nombre'] = translation_service.translate_text(item['nombre'], lang)
                if 'descripcion' in item:
                    item['descripcion'] = translation_service.translate_text(item['descripcion'], lang)
        
        return response


class TipoFlorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los tipos de flores.
    Se puede acceder a la lista en `/api/catalogo/tipos-flor/`.
    """
    queryset = TipoFlor.objects.filter(is_active=True)
    serializer_class = TipoFlorSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Override list para aplicar traducciones"""
        response = super().list(request, *args, **kwargs)
        lang = request.query_params.get('lang', 'es')
        
        if lang != 'es' and response.data:
            for item in response.data:
                if 'nombre' in item:
                    item['nombre'] = translation_service.translate_text(item['nombre'], lang)
                if 'descripcion' in item:
                    item['descripcion'] = translation_service.translate_text(item['descripcion'], lang)
        
        return response


class OcasionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver las ocasiones.
    Se puede acceder a la lista en `/api/catalogo/ocasiones/`.
    """
    queryset = Ocasion.objects.filter(is_active=True)
    serializer_class = OcasionSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Override list para aplicar traducciones"""
        response = super().list(request, *args, **kwargs)
        lang = request.query_params.get('lang', 'es')
        
        if lang != 'es' and response.data:
            for item in response.data:
                if 'nombre' in item:
                    item['nombre'] = translation_service.translate_text(item['nombre'], lang)
                if 'descripcion' in item:
                    item['descripcion'] = translation_service.translate_text(item['descripcion'], lang)
        
        return response


class ZonaEntregaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver las zonas de entrega.
    Se puede acceder a la lista en `/api/catalogo/zonas/`.
    """
    queryset = ZonaEntrega.objects.filter(is_active=True)
    serializer_class = ZonaEntregaSerializer
    permission_classes = [AllowAny]


class HeroSlideViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los slides del Hero.
    Se puede acceder a la lista en `/api/catalogo/hero-slides/`.
    """
    queryset = HeroSlide.objects.filter(is_active=True).order_by('orden', 'created_at')
    serializer_class = HeroSlideSerializer
    permission_classes = [AllowAny]
