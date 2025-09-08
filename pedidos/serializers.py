from rest_framework import serializers
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from .models import Pedido, PedidoItem, MetodoEnvio
from catalogo.models import Producto
from carrito.cart import Cart


class MetodoEnvioSerializer(serializers.ModelSerializer):
    """Serializer para métodos de envío"""
    class Meta:
        model = MetodoEnvio
        fields = ['id', 'nombre', 'costo']


class PedidoItemReadSerializer(serializers.ModelSerializer):
    """Serializer para leer items de pedido"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_imagen = serializers.SerializerMethodField()
    
    class Meta:
        model = PedidoItem
        fields = ['id', 'producto', 'producto_nombre', 'producto_imagen', 'cantidad', 'precio']
    
    def get_producto_imagen(self, obj):
        return obj.producto.get_primary_image_url


class PedidoReadSerializer(serializers.ModelSerializer):
    """Serializer para leer pedidos completos"""
    items = PedidoItemReadSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    estado_pago_display = serializers.CharField(source='get_estado_pago_display', read_only=True)
    medio_pago_display = serializers.CharField(source='get_medio_pago_display', read_only=True)
    metodo_envio_nombre = serializers.CharField(source='metodo_envio.nombre', read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'nombre_comprador', 'email_comprador', 'telefono_comprador',
            'nombre_destinatario', 'direccion', 'ciudad', 'codigo_postal',
            'telefono_destinatario', 'fecha_entrega', 'franja_horaria',
            'dedicatoria', 'instrucciones', 'metodo_envio', 'metodo_envio_nombre',
            'estado', 'estado_display', 'estado_pago', 'estado_pago_display',
            'medio_pago', 'medio_pago_display', 'total', 'creado', 'items'
        ]


class CheckoutSerializer(serializers.Serializer):
    """Serializer para el proceso de checkout completo"""
    
    # Datos del comprador
    nombre_comprador = serializers.CharField(max_length=100)
    email_comprador = serializers.EmailField()
    telefono_comprador = serializers.CharField(max_length=20)
    
    # Datos del destinatario
    nombre_destinatario = serializers.CharField(max_length=100)
    telefono_destinatario = serializers.CharField(max_length=30)
    direccion = serializers.CharField(max_length=255)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    codigo_postal = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # Datos de entrega
    fecha_entrega = serializers.DateField()
    franja_horaria = serializers.ChoiceField(choices=[('mañana', 'Mañana (9-12)'), ('tarde', 'Tarde (16-20)')])
    metodo_envio_id = serializers.IntegerField()
    
    # Datos adicionales
    dedicatoria = serializers.CharField(required=False, allow_blank=True)
    instrucciones = serializers.CharField(max_length=200, required=False, allow_blank=True)
    regalo_anonimo = serializers.BooleanField(default=False)
    medio_pago = serializers.ChoiceField(
        choices=[
            ('mercadopago', 'Mercado Pago'),
            ('paypal', 'PayPal'),
            ('transferencia', 'Transferencia Bancaria'),
        ],
        default='mercadopago'
    )
    
    def validate_fecha_entrega(self, value):
        """Validar que la fecha de entrega sea futura"""
        if value <= date.today():
            raise serializers.ValidationError("La fecha de entrega debe ser posterior a hoy")
        
        # No permitir entregas los domingos
        if value.weekday() == 6:  # 6 = domingo
            raise serializers.ValidationError("No realizamos entregas los domingos")
        
        # Validar que no sea más de 30 días en el futuro
        max_date = date.today() + timedelta(days=30)
        if value > max_date:
            raise serializers.ValidationError("La fecha de entrega no puede ser más de 30 días en el futuro")
        
        return value
    
    def validate_metodo_envio_id(self, value):
        """Validar que el método de envío existe y está activo"""
        try:
            metodo = MetodoEnvio.objects.get(id=value, activo=True)
            return value
        except MetodoEnvio.DoesNotExist:
            raise serializers.ValidationError("Método de envío no válido")
    
    def create(self, validated_data):
        """Crear pedido desde el carrito"""
        request = self.context['request']
        cart = Cart(request)
        
        if cart.is_empty:
            raise serializers.ValidationError("El carrito está vacío")
        
        # Obtener método de envío
        metodo_envio = MetodoEnvio.objects.get(id=validated_data.pop('metodo_envio_id'))
        
        # Crear el pedido
        pedido_data = validated_data.copy()
        pedido_data['metodo_envio'] = metodo_envio
        
        # Asignar usuario si está autenticado
        if request.user.is_authenticated:
            pedido_data['cliente'] = request.user
        else:
            pedido_data['anonimo'] = True
        
        pedido = Pedido.objects.create(**pedido_data)
        
        # Crear items del pedido desde el carrito
        total_productos = Decimal('0.00')
        for item in cart:
            producto = item['producto']
            cantidad = item['quantity']
            precio_unitario = item['price']
            
            # Verificar stock disponible
            if producto.stock < cantidad:
                pedido.delete()  # Eliminar pedido si no hay stock
                raise serializers.ValidationError(
                    f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
                )
            
            # Crear item del pedido
            PedidoItem.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio=precio_unitario
            )
            
            total_productos += precio_unitario * cantidad
            
            # Reducir stock
            producto.stock -= cantidad
            producto.save()
        
        # Calcular total final (productos + envío)
        pedido.total = total_productos + metodo_envio.costo
        pedido.save()
        
        # Limpiar carrito después de crear el pedido
        cart.clear()
        
        return pedido


class ValidateStockSerializer(serializers.Serializer):
    """Serializer para validar stock antes del checkout"""
    
    def validate(self, attrs):
        request = self.context['request']
        cart = Cart(request)
        
        if cart.is_empty:
            raise serializers.ValidationError("El carrito está vacío")
        
        stock_errors = []
        for item in cart:
            producto = item['producto']
            cantidad = item['quantity']
            
            if not producto.is_active:
                stock_errors.append(f"{producto.nombre} ya no está disponible")
            elif producto.stock < cantidad:
                stock_errors.append(
                    f"Stock insuficiente para {producto.nombre}. "
                    f"Solicitado: {cantidad}, Disponible: {producto.stock}"
                )
        
        if stock_errors:
            raise serializers.ValidationError(stock_errors)
        
        return attrs
