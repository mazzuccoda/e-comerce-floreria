from django.contrib import admin
from .models import Pedido, PedidoItem
from .notificaciones import enviar_whatsapp_actualizacion_estado


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
    readonly_fields = ('creado', 'actualizado', 'cliente', 'dedicatoria', 'nombre_destinatario', 'direccion', 'telefono_destinatario', 'fecha_entrega', 'franja_horaria', 'tipo_envio', 'instrucciones', 'regalo_anonimo', 'medio_pago')
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


