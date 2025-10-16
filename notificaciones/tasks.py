"""
Tareas de Celery para notificaciones asíncronas
"""

from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def enviar_notificacion_async(self, notificacion_id):
    """
    Tarea asíncrona para enviar notificaciones
    """
    try:
        from .models import Notificacion
        from .services import notificacion_service
        
        notificacion = Notificacion.objects.get(id=notificacion_id)
        
        if not notificacion.puede_reintentar():
            logger.warning(f"Notificación {notificacion_id} no puede reintentarse")
            return False
        
        success = notificacion_service.enviar_notificacion(notificacion)
        
        if not success and notificacion.puede_reintentar():
            # Reintentar en 5 minutos
            raise self.retry(countdown=300)
        
        return success
        
    except Notificacion.DoesNotExist:
        logger.error(f"Notificación {notificacion_id} no encontrada")
        return False
    except Exception as exc:
        logger.error(f"Error enviando notificación {notificacion_id}: {str(exc)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=exc)
        return False


@shared_task
def procesar_notificaciones_pendientes():
    """
    Tarea periódica para procesar notificaciones pendientes
    """
    from .models import Notificacion, EstadoNotificacion
    
    notificaciones_pendientes = Notificacion.objects.filter(
        estado__in=[EstadoNotificacion.PENDIENTE, EstadoNotificacion.FALLIDA]
    ).filter(
        intentos__lt=3
    )[:50]  # Procesar máximo 50 por vez
    
    count = 0
    for notificacion in notificaciones_pendientes:
        enviar_notificacion_async.delay(notificacion.id)
        count += 1
    
    logger.info(f"Programadas {count} notificaciones para envío")
    return count


@shared_task
def limpiar_notificaciones_antiguas():
    """
    Tarea para limpiar notificaciones antiguas (más de 30 días)
    """
    from .models import Notificacion
    from datetime import timedelta
    
    fecha_limite = timezone.now() - timedelta(days=30)
    
    eliminadas = Notificacion.objects.filter(
        created_at__lt=fecha_limite,
        estado__in=['enviada', 'fallida']
    ).delete()
    
    logger.info(f"Eliminadas {eliminadas[0]} notificaciones antiguas")
    return eliminadas[0]


@shared_task
def notificar_pedido_confirmado(pedido_id, usuario_id):
    """
    Tarea para notificar confirmación de pedido
    """
    try:
        from .services import notificacion_service
        from .models import TipoNotificacion
        from pedidos.models import Pedido
        
        usuario = User.objects.get(id=usuario_id)
        pedido = Pedido.objects.get(id=pedido_id)
        
        # Formatear tipo de envío para mostrar
        tipo_envio_display = 'No especificado'
        if pedido.tipo_envio == 'retiro':
            tipo_envio_display = '🏪 Retiro en tienda'
        elif pedido.tipo_envio == 'express':
            tipo_envio_display = '⚡ Envío Express (2-4 horas)'
        elif pedido.tipo_envio == 'programado':
            tipo_envio_display = f'📅 Envío Programado ({pedido.get_franja_horaria_display()})'
        
        contexto = {
            'pedido_id': pedido.id,
            'total': pedido.get_total_price(),
            'fecha': pedido.created_at.strftime('%d/%m/%Y'),
            'items_count': pedido.items.count(),
            'tipo_envio': tipo_envio_display
        }
        
        notificaciones = notificacion_service.enviar_notificacion_pedido(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.PEDIDO_CONFIRMADO,
            pedido_id=pedido_id,
            contexto_adicional=contexto
        )
        
        # Enviar notificaciones de forma asíncrona
        for notif in notificaciones:
            enviar_notificacion_async.delay(notif.id)
        
        logger.info(f"Notificaciones de pedido {pedido_id} programadas")
        return len(notificaciones)
        
    except Exception as e:
        logger.error(f"Error notificando pedido {pedido_id}: {str(e)}")
        return False


@shared_task
def notificar_registro_usuario(usuario_id):
    """
    Tarea para notificar registro de nuevo usuario
    """
    try:
        from .services import notificacion_service
        
        usuario = User.objects.get(id=usuario_id)
        
        notificaciones = notificacion_service.enviar_notificacion_registro(usuario)
        
        # Enviar notificaciones de forma asíncrona
        for notif in notificaciones:
            enviar_notificacion_async.delay(notif.id)
        
        logger.info(f"Notificaciones de registro para {usuario.username} programadas")
        return len(notificaciones)
        
    except Exception as e:
        logger.error(f"Error notificando registro de usuario {usuario_id}: {str(e)}")
        return False


@shared_task
def notificar_stock_bajo(producto_id, stock_actual):
    """
    Tarea para notificar stock bajo de productos
    """
    try:
        from .services import notificacion_service
        from .models import TipoNotificacion, CanalNotificacion
        from catalogo.models import Producto
        from django.contrib.auth.models import User
        
        producto = Producto.objects.get(id=producto_id)
        
        # Notificar a administradores
        admins = User.objects.filter(is_staff=True, is_active=True)
        
        contexto = {
            'producto_nombre': producto.nombre,
            'stock_actual': stock_actual,
            'producto_id': producto_id,
            'fecha': timezone.now().strftime('%d/%m/%Y %H:%M')
        }
        
        notificaciones_creadas = 0
        
        for admin in admins:
            try:
                notif = notificacion_service.crear_notificacion(
                    usuario=admin,
                    tipo=TipoNotificacion.STOCK_BAJO,
                    canal=CanalNotificacion.EMAIL,
                    destinatario=admin.email,
                    contexto=contexto,
                    producto_id=producto_id
                )
                
                enviar_notificacion_async.delay(notif.id)
                notificaciones_creadas += 1
                
            except Exception as e:
                logger.error(f"Error creando notificación stock bajo para {admin.username}: {str(e)}")
        
        logger.info(f"Notificaciones de stock bajo para producto {producto_id} programadas")
        return notificaciones_creadas
        
    except Exception as e:
        logger.error(f"Error notificando stock bajo producto {producto_id}: {str(e)}")
        return False
