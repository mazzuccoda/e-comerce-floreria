"""
Señales para integrar notificaciones automáticamente
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import ConfiguracionNotificacion
from .tasks import notificar_registro_usuario


@receiver(post_save, sender=User)
def crear_configuracion_notificacion(sender, instance, created, **kwargs):
    """
    Crea configuración de notificaciones por defecto para nuevos usuarios
    """
    if created:
        ConfiguracionNotificacion.objects.get_or_create(
            usuario=instance,
            defaults={
                'email_habilitado': True,
                'whatsapp_habilitado': True,
                'sms_habilitado': False,
                'pedidos_habilitado': True,
                'promociones_habilitado': True,
                'stock_habilitado': False,
            }
        )
        
        # Enviar notificación de bienvenida (asíncrono)
        notificar_registro_usuario.delay(instance.id)


# Señal para notificaciones de pedidos
@receiver(post_save, sender='pedidos.Pedido')
def notificar_cambio_estado_pedido(sender, instance, created, **kwargs):
    """
    Notifica cambios en el estado de los pedidos
    """
    from .tasks import notificar_pedido_confirmado
    from .models import TipoNotificacion
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Determinar usuario (cliente registrado o invitado)
    usuario = instance.cliente if instance.cliente else None
    
    if created and instance.confirmado:
        # Pedido recién confirmado
        if usuario:
            notificar_pedido_confirmado.delay(instance.id, usuario.id)
        else:
            logger.info(f"Pedido {instance.id} es de usuario invitado, no se envían notificaciones automáticas")
    
    elif not created and usuario:
        # Pedido actualizado - verificar cambio de estado
        try:
            # Obtener el estado anterior desde la base de datos
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT estado FROM pedidos_pedido WHERE id = %s",
                    [instance.id]
                )
                result = cursor.fetchone()
                if result:
                    estado_anterior = result[0]
                    
                    if estado_anterior != instance.estado:
                        # El estado cambió, enviar notificación correspondiente
                        tipo_notificacion = None
                        
                        if instance.estado == 'en_camino':
                            tipo_notificacion = TipoNotificacion.PEDIDO_ENVIADO
                        elif instance.estado == 'entregado':
                            tipo_notificacion = TipoNotificacion.PEDIDO_ENTREGADO
                        elif instance.estado == 'cancelado':
                            tipo_notificacion = TipoNotificacion.PEDIDO_CANCELADO
                        
                        if tipo_notificacion:
                            from .services import notificacion_service
                            
                            # Formatear tipo de envío para mostrar
                            tipo_envio_display = 'No especificado'
                            if instance.tipo_envio == 'retiro':
                                tipo_envio_display = '🏪 Retiro en tienda'
                            elif instance.tipo_envio == 'express':
                                tipo_envio_display = '⚡ Envío Express (2-4 horas)'
                            elif instance.tipo_envio == 'programado':
                                tipo_envio_display = f'📅 Envío Programado ({instance.get_franja_horaria_display()})'
                            
                            contexto = {
                                'pedido_id': instance.id,
                                'estado': instance.get_estado_display(),
                                'fecha': instance.actualizado.strftime('%d/%m/%Y %H:%M'),
                                'total': instance.total,
                                'tipo_envio': tipo_envio_display
                            }
                            
                            notificacion_service.enviar_notificacion_pedido(
                                usuario=usuario,
                                tipo_notificacion=tipo_notificacion,
                                pedido_id=instance.id,
                                contexto_adicional=contexto
                            )
                            
                            logger.info(f"Notificación enviada para pedido {instance.id}: {tipo_notificacion}")
                        
        except Exception as e:
            logger.error(f"Error notificando cambio de estado pedido {instance.id}: {str(e)}")


# Señal para notificaciones de stock bajo
from catalogo.models import Producto


@receiver(post_save, sender=Producto)
def verificar_stock_bajo(sender, instance, **kwargs):
    """
    Verifica si el stock está bajo y envía notificación
    """
    from .tasks import notificar_stock_bajo
    
    # Umbral de stock bajo (configurable)
    UMBRAL_STOCK_BAJO = 5
    
    if instance.stock <= UMBRAL_STOCK_BAJO and instance.stock > 0:
        notificar_stock_bajo.delay(instance.id, instance.stock)
