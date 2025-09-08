from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen, TipoFlor, Ocasion, ZonaEntrega


class ProductoImagenSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ProductoImagen."""
    class Meta:
        model = ProductoImagen
        fields = ['imagen', 'is_primary']


class TipoFlorSerializer(serializers.ModelSerializer):
    """Serializer para el modelo TipoFlor."""
    class Meta:
        model = TipoFlor
        fields = ['id', 'nombre', 'descripcion', 'is_active']


class OcasionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Ocasion."""
    class Meta:
        model = Ocasion
        fields = ['id', 'nombre', 'descripcion', 'is_active']


class ZonaEntregaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ZonaEntrega."""
    class Meta:
        model = ZonaEntrega
        fields = ['id', 'nombre', 'descripcion', 'costo_envio', 'envio_gratis_desde', 'is_active']


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Categoria."""
    class Meta:
        model = Categoria
        fields = ['nombre', 'slug', 'descripcion', 'imagen']


class ProductoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Producto."""
    # Para mostrar el nombre de la categoría en lugar de su ID.
    categoria = CategoriaSerializer(read_only=True)
    
    # Para anidar la lista de imágenes dentro del producto.
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    
    # Para incluir los nuevos campos relacionados
    tipo_flor = TipoFlorSerializer(read_only=True)
    ocasiones = OcasionSerializer(many=True, read_only=True)
    
    # Para incluir propiedades del modelo en la API.
    precio_final = serializers.DecimalField(
        source='get_precio_final', 
        read_only=True, 
        max_digits=10, 
        decimal_places=2
    )
    precio_formateado = serializers.CharField(read_only=True)
    imagen_principal = serializers.CharField(source='get_primary_image_url', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'slug',
            'descripcion',
            'descripcion_corta',
            'categoria',
            'tipo_flor',
            'ocasiones',
            'precio',
            'precio_descuento',
            'porcentaje_descuento',
            'precio_final',
            'precio_formateado',
            'stock',
            'is_featured',
            'envio_gratis',
            'es_adicional',
            'imagen_principal',
            'imagenes',
        ]
