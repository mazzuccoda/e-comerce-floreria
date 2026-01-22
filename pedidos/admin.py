from django.contrib import admin
from .models import Pedido, PedidoItem, CarritoAbandonado
from .notificaciones import enviar_whatsapp_actualizacion_estado

# Importar modelos de shipping solo si existen (para evitar errores antes de migrar)
try:
    from .models import ShippingConfig, ShippingZone, ShippingPricingRule
    SHIPPING_MODELS_AVAILABLE = True
except ImportError:
    SHIPPING_MODELS_AVAILABLE = False


class PedidoItemInline(admin.TabularInline):
    model = PedidoItem
    raw_id_fields = ['producto']
    extra = 0
    readonly_fields = ('producto', 'cantidad')




@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_destinatario', 'fecha_entrega', 'tipo_envio', 'estado', 'creado', 'medio_pago')
    list_filter = ('estado', 'tipo_envio', 'fecha_entrega', 'medio_pago')
    list_editable = ('estado',)
    search_fields = ('id', 'nombre_destinatario', 'cliente__username', 'cliente__email')
    date_hierarchy = 'creado'
    inlines = [PedidoItemInline]
    readonly_fields = ('creado', 'actualizado', 'cliente', 'dedicatoria', 'firmado_como', 'nombre_destinatario', 'direccion', 'telefono_destinatario', 'fecha_entrega', 'franja_horaria', 'tipo_envio', 'instrucciones', 'regalo_anonimo', 'medio_pago')
    exclude = ('metodo_envio',)  # Ocultar el campo legacy

    def save_model(self, request, obj, form, change):
        # Guardar el estado original antes de guardar los cambios
        if obj.pk:
            original_obj = Pedido.objects.get(pk=obj.pk)
            original_estado = original_obj.estado
        else:
            original_estado = None

        super().save_model(request, obj, form, change)

        # Si el estado ha cambiado, enviar notificación
        if original_estado != obj.estado:
            enviar_whatsapp_actualizacion_estado(obj)

    def has_add_permission(self, request):
        return False # No permitir crear pedidos desde el admin


# ============================================
# ADMIN PARA SISTEMA DE ZONAS DE ENVÍO
# ============================================

# Solo registrar si los modelos están disponibles
if SHIPPING_MODELS_AVAILABLE:
    @admin.register(ShippingConfig)
    class ShippingConfigAdmin(admin.ModelAdmin):
        list_display = ('store_name', 'store_address', 'max_distance_express_km', 'max_distance_programado_km', 'updated_at')
        readonly_fields = ('created_at', 'updated_at')
        fieldsets = (
            ('Información del Negocio', {
                'fields': ('store_name', 'store_address')
            }),
            ('Ubicación GPS', {
                'fields': ('store_lat', 'store_lng'),
                'description': 'Coordenadas GPS de tu tienda. Puedes obtenerlas desde Google Maps.'
            }),
            ('Distancias Máximas', {
                'fields': ('max_distance_express_km', 'max_distance_programado_km'),
                'description': 'Distancia máxima de cobertura para cada método de envío (en kilómetros).'
            }),
            ('Configuración Técnica', {
                'fields': ('use_distance_matrix', 'created_at', 'updated_at'),
                'classes': ('collapse',)
            }),
        )
        
        def has_add_permission(self, request):
            # Solo permitir una configuración
            return not ShippingConfig.objects.exists()
        
        def has_delete_permission(self, request, obj=None):
            # No permitir eliminar la configuración
            return False


    @admin.register(ShippingZone)
    class ShippingZoneAdmin(admin.ModelAdmin):
        list_display = ('shipping_method', 'zone_name', 'min_distance_km', 'max_distance_km', 'base_price', 'price_per_km', 'zone_order', 'is_active')
        list_filter = ('shipping_method', 'is_active')
        list_editable = ('base_price', 'price_per_km', 'is_active')
        search_fields = ('zone_name',)
        ordering = ('shipping_method', 'zone_order')
        
        fieldsets = (
            ('Información de la Zona', {
                'fields': ('shipping_method', 'zone_name', 'zone_order')
            }),
            ('Rango de Distancia (km)', {
                'fields': ('min_distance_km', 'max_distance_km'),
                'description': 'Define el rango de distancia para esta zona. Ejemplo: 0-5 km, 5-10 km, etc.'
            }),
            ('Precios', {
                'fields': ('base_price', 'price_per_km'),
                'description': 'Precio base + precio adicional por km (opcional). Si price_per_km = 0, solo se cobra el precio base.'
            }),
            ('Estado', {
                'fields': ('is_active',)
            }),
        )
        
        def get_readonly_fields(self, request, obj=None):
            if obj:  # Editando
                return ('created_at', 'updated_at')
            return ()


    @admin.register(ShippingPricingRule)
    class ShippingPricingRuleAdmin(admin.ModelAdmin):
        list_display = ('shipping_method', 'rule_type', 'free_shipping_threshold', 'minimum_charge', 'is_active')
        list_filter = ('shipping_method', 'rule_type', 'is_active')
        list_editable = ('is_active',)
        
        fieldsets = (
            ('Configuración de la Regla', {
                'fields': ('shipping_method', 'rule_type')
            }),
            ('Envío Gratis', {
                'fields': ('free_shipping_threshold',),
                'description': 'Monto mínimo de compra para obtener envío gratis. Dejar en blanco para desactivar.'
            }),
            ('Cargo Mínimo', {
                'fields': ('minimum_charge',),
                'description': 'Cargo mínimo de envío (opcional).'
            }),
            ('Estado', {
                'fields': ('is_active',)
            }),
        )


@admin.register(CarritoAbandonado)
class CarritoAbandonadoAdmin(admin.ModelAdmin):
    list_display = ('id', 'telefono', 'nombre', 'total', 'creado', 'recordatorio_enviado', 'recuperado', 'estado_display')
    list_filter = ('recordatorio_enviado', 'recuperado', 'creado')
    search_fields = ('telefono', 'nombre', 'email')
    readonly_fields = ('creado', 'recordatorio_enviado_at', 'recuperado_at', 'items_display')
    date_hierarchy = 'creado'
    ordering = ('-creado',)
    
    fieldsets = (
        ('Información del Cliente', {
            'fields': ('telefono', 'nombre', 'email', 'session_id')
        }),
        ('Carrito', {
            'fields': ('items_display', 'total')
        }),
        ('Estado', {
            'fields': ('recordatorio_enviado', 'recordatorio_enviado_at', 'recuperado', 'recuperado_at', 'pedido_recuperado')
        }),
        ('Fechas', {
            'fields': ('creado',)
        }),
    )
    
    def items_display(self, obj):
        """Mostrar items del carrito de forma legible"""
        if not obj.items:
            return "Sin items"
        
        items_html = "<ul>"
        for item in obj.items:
            nombre = item.get('nombre', 'Producto')
            cantidad = item.get('cantidad', 1)
            precio = item.get('precio', '0')
            items_html += f"<li>{nombre} x{cantidad} - ${precio}</li>"
        items_html += "</ul>"
        
        from django.utils.html import format_html
        return format_html(items_html)
    
    items_display.short_description = 'Items del Carrito'
    
    def estado_display(self, obj):
        """Mostrar estado visual con colores"""
        if obj.recuperado:
            return "✅ Recuperado"
        elif obj.recordatorio_enviado:
            return "📨 Recordatorio enviado"
        else:
            return "⏳ Pendiente"
    
    estado_display.short_description = 'Estado'
    
    def has_add_permission(self, request):
        # No permitir crear carritos manualmente
        return False


