from rest_framework import serializers
from catalogo.serializers import ProductoSerializer
from catalogo.models import Producto
from .models import Carrito, CarritoItem


class ProductoCarritoSerializer(serializers.ModelSerializer):
    """Serializer simplificado para productos en el carrito"""
    precio_final = serializers.SerializerMethodField()
    imagen_principal = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'slug', 'precio', 'precio_final', 'imagen_principal', 'stock']
    
    def get_precio_final(self, obj):
        return obj.get_precio_final
    
    def get_imagen_principal(self, obj):
        return obj.get_primary_image_url


class CartItemSerializer(serializers.Serializer):
    """Serializer para un item individual dentro del carrito."""
    producto = ProductoCarritoSerializer(read_only=True)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_id = serializers.IntegerField(read_only=True, required=False)


class CartSerializer(serializers.Serializer):
    """Serializer para el objeto completo del carrito."""
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    is_empty = serializers.BooleanField(read_only=True)


class AddToCartSerializer(serializers.Serializer):
    """Serializer para validar los datos al añadir productos al carrito."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate_product_id(self, value):
        try:
            producto = Producto.objects.get(id=value, is_active=True)
            if producto.stock <= 0:
                raise serializers.ValidationError("Producto sin stock disponible")
            return value
        except Producto.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado")


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer para actualizar la cantidad de un item del carrito."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=0)
    
    def validate_product_id(self, value):
        try:
            Producto.objects.get(id=value, is_active=True)
            return value
        except Producto.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado")


class RemoveFromCartSerializer(serializers.Serializer):
    """Serializer para eliminar un producto del carrito."""
    product_id = serializers.IntegerField()
    
    def validate_product_id(self, value):
        try:
            Producto.objects.get(id=value)
            return value
        except Producto.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado")
