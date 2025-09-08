from django.contrib import admin
from .models import PlantillaNotificacion, Notificacion, ConfiguracionNotificacion


@admin.register(PlantillaNotificacion)
class PlantillaNotificacionAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'canal', 'asunto', 'activa', 'created_at']
    list_filter = ['tipo', 'canal', 'activa']
    search_fields = ['asunto', 'mensaje']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('tipo', 'canal', 'activa')
        }),
        ('Contenido', {
            'fields': ('asunto', 'mensaje'),
            'description': 'Puedes usar variables como: {nombre}, {pedido_id}, {total}, {fecha}, {email}'
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'tipo', 'canal', 'destinatario', 'estado', 'intentos', 'created_at']
    list_filter = ['tipo', 'canal', 'estado', 'created_at']
    search_fields = ['usuario__username', 'usuario__email', 'destinatario', 'asunto']
    readonly_fields = ['created_at', 'updated_at', 'fecha_envio']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'tipo', 'canal', 'destinatario')
        }),
        ('Contenido', {
            'fields': ('asunto', 'mensaje')
        }),
        ('Estado', {
            'fields': ('estado', 'intentos', 'max_intentos', 'fecha_envio', 'error_mensaje')
        }),
        ('Metadatos', {
            'fields': ('pedido_id', 'producto_id', 'metadatos'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['reenviar_notificaciones']
    
    def reenviar_notificaciones(self, request, queryset):
        """Acción para reenviar notificaciones fallidas"""
        from .services import notificacion_service
        
        count = 0
        for notificacion in queryset.filter(estado__in=['fallida', 'pendiente']):
            if notificacion.puede_reintentar():
                try:
                    notificacion_service.enviar_notificacion(notificacion)
                    count += 1
                except Exception:
                    pass
        
        self.message_user(request, f'{count} notificaciones reenviadas exitosamente.')
    
    reenviar_notificaciones.short_description = "Reenviar notificaciones seleccionadas"


@admin.register(ConfiguracionNotificacion)
class ConfiguracionNotificacionAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'email_habilitado', 'whatsapp_habilitado', 'pedidos_habilitado', 'promociones_habilitado']
    list_filter = ['email_habilitado', 'whatsapp_habilitado', 'pedidos_habilitado', 'promociones_habilitado']
    search_fields = ['usuario__username', 'usuario__email']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('usuario',)
        }),
        ('Canales de Notificación', {
            'fields': ('email_habilitado', 'whatsapp_habilitado', 'sms_habilitado')
        }),
        ('Tipos de Notificaciones', {
            'fields': ('pedidos_habilitado', 'promociones_habilitado', 'stock_habilitado')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
