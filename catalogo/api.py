from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from .models import Producto, Categoria, TipoFlor, Ocasion, ZonaEntrega, HeroSlide
from .serializers import (
    ProductoSerializer, CategoriaSerializer, TipoFlorSerializer, 
    OcasionSerializer, ZonaEntregaSerializer, HeroSlideSerializer
)
from core.translation_service import translation_service
import requests
import logging

logger = logging.getLogger(__name__)


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
    
    @action(detail=False, methods=['post', 'get'], permission_classes=[AllowAny])
    def sync_to_social(self, request):
        """
        Endpoint para sincronizar productos con redes sociales vía n8n
        
        GET: Obtiene productos marcados para publicar en redes
        POST: Envía productos a n8n para publicación
        
        Query params:
        - limit: Número máximo de productos (default: 10)
        - force: Incluir productos ya publicados recientemente (default: false)
        """
        try:
            # Parámetros
            limit = int(request.query_params.get('limit', 10))
            force = request.query_params.get('force', 'false').lower() == 'true'
            
            # Filtrar productos marcados para redes sociales
            queryset = Producto.objects.filter(
                is_active=True,
                publicar_en_redes=True,
                stock__gt=0
            ).prefetch_related('imagenes', 'categoria', 'tipo_flor', 'ocasiones')
            
            # Si no es force, excluir productos publicados en las últimas 24 horas
            if not force:
                from datetime import timedelta
                hace_24h = timezone.now() - timedelta(hours=24)
                queryset = queryset.filter(
                    Q(fecha_ultima_publicacion__isnull=True) | Q(fecha_ultima_publicacion__lt=hace_24h)
                )
            
            # Ordenar por fecha de última publicación (los más antiguos primero)
            queryset = queryset.order_by('fecha_ultima_publicacion', '-created_at')[:limit]
            
            productos_list = list(queryset)
            
            if not productos_list:
                return Response({
                    'success': False,
                    'message': 'No hay productos disponibles para publicar en redes sociales',
                    'productos_count': 0
                }, status=status.HTTP_200_OK)
            
            # Preparar datos para n8n
            productos_data = []
            for producto in productos_list:
                productos_data.append({
                    'id': producto.id,
                    'sku': producto.sku,
                    'nombre': producto.nombre,
                    'slug': producto.slug,
                    'descripcion': producto.descripcion,
                    'descripcion_corta': producto.descripcion_corta,
                    'precio': str(producto.precio),
                    'precio_descuento': str(producto.precio_descuento) if producto.precio_descuento else None,
                    'porcentaje_descuento': producto.porcentaje_descuento,
                    'stock': producto.stock,
                    'categoria': producto.categoria.nombre if producto.categoria else None,
                    'tipo_flor': producto.tipo_flor.nombre if producto.tipo_flor else None,
                    'envio_gratis': producto.envio_gratis,
                    'imagenes': [
                        {
                            'url': img.imagen.url,
                            'is_primary': img.is_primary
                        }
                        for img in producto.imagenes.all()
                    ],
                    'url': f"https://www.floreriacristina.com.ar/productos/{producto.slug}"
                })
            
            # Si es GET, solo devolver los productos
            if request.method == 'GET':
                return Response({
                    'success': True,
                    'productos_count': len(productos_data),
                    'productos': productos_data
                })
            
            # Si es POST, enviar a n8n
            n8n_base_url = getattr(settings, 'N8N_BASE_URL', None)
            n8n_api_key = getattr(settings, 'N8N_API_KEY', None)
            
            if not n8n_base_url or not n8n_api_key:
                logger.warning('⚠️ N8N_BASE_URL o N8N_API_KEY no configurados')
                return Response({
                    'success': False,
                    'error': 'n8n no configurado',
                    'productos_count': len(productos_data),
                    'productos': productos_data
                }, status=status.HTTP_200_OK)
            
            # Enviar a n8n
            webhook_url = f"{n8n_base_url}/webhook/sync-catalog"
            
            logger.info(f"📤 Enviando {len(productos_data)} productos a n8n")
            
            response = requests.post(
                webhook_url,
                json={'productos': productos_data},
                headers={
                    'X-API-Key': n8n_api_key,
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Actualizar fecha de última publicación
                for producto in productos_list:
                    producto.fecha_ultima_publicacion = timezone.now()
                    producto.save(update_fields=['fecha_ultima_publicacion'])
                
                logger.info(f"✅ {len(productos_data)} productos sincronizados con n8n")
                
                return Response({
                    'success': True,
                    'message': f'{len(productos_data)} productos sincronizados con redes sociales',
                    'productos_count': len(productos_data),
                    'productos': productos_data
                })
            else:
                logger.error(f"❌ Error en n8n: {response.status_code} - {response.text}")
                return Response({
                    'success': False,
                    'error': 'Error al sincronizar con n8n',
                    'status_code': response.status_code,
                    'productos_count': len(productos_data)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except Exception as e:
            logger.error(f"❌ Error en sync_to_social: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    
    def list(self, request, *args, **kwargs):
        """Listar slides con traducción según parámetro lang"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Obtener idioma de los query params
        target_lang = request.query_params.get('lang', 'es')
        
        # Traducir cada slide
        if target_lang != 'es':
            for slide in data:
                if slide.get('titulo'):
                    slide['titulo'] = translation_service.translate_text(slide['titulo'], target_lang, source_lang='es')
                if slide.get('subtitulo'):
                    slide['subtitulo'] = translation_service.translate_text(slide['subtitulo'], target_lang, source_lang='es')
                if slide.get('texto_boton'):
                    slide['texto_boton'] = translation_service.translate_text(slide['texto_boton'], target_lang, source_lang='es')
        
        return Response(data)
