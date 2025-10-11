from rest_framework import serializers
from .models import Producto, Categoria, TipoFlor, Ocasion, ZonaEntrega, ProductoImagen

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'is_primary', 'orden']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen', 'slug', 'is_active']

class TipoFlorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoFlor
        fields = ['id', 'nombre', 'descripcion', 'is_active']

class OcasionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ocasion
        fields = ['id', 'nombre', 'descripcion', 'is_active']

class ZonaEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZonaEntrega
        fields = ['id', 'nombre', 'descripcion', 'costo_envio', 'envio_gratis_desde', 'is_active']

class ProductoSerializer(serializers.ModelSerializer):
    imagen_principal = serializers.SerializerMethodField()
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    tipo_flor = TipoFlorSerializer(read_only=True)
    ocasiones = OcasionSerializer(many=True, read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'slug',
            'descripcion',
            'descripcion_corta',
            'categoria',
            'tipo',
            'tipo_flor',
            'ocasiones',
            'precio',
            'precio_descuento',
            'porcentaje_descuento',
            'sku',
            'stock',
            'is_active',
            'is_featured',
            'envio_gratis',
            'es_adicional',
            'imagen_principal',
            'imagenes',
            'created_at',
            'updated_at',
        ]

    def get_imagen_principal(self, obj):
        url = getattr(obj, 'get_primary_image_url', None)
        if callable(url):
            url = url()
        else:
            url = obj.get_primary_image_url if hasattr(obj, 'get_primary_image_url') else None

        if not url:
            return '/images/no-image.jpg'

        # Si la URL es relativa de Django (/media/...), retornar como está y dejar que el frontend la consuma vía rewrite
        if isinstance(url, str) and (url.startswith('/media/') or url.startswith('/images/')):
            return url

        return url
