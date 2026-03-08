"""
Script para crear plantillas de notificación predeterminadas para la florería
"""

import os
import django

# Configurar entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from notificaciones.models import PlantillaNotificacion, TipoNotificacion, CanalNotificacion


def read_template_file(filename):
    """Lee el contenido de un archivo de plantilla"""
    base_path = os.path.join('templates', 'notifications')
    file_path = os.path.join(base_path, filename)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Archivo no encontrado: {file_path}")
        return ""


def create_notification_templates():
    """Crea plantillas de notificación predeterminadas"""
    
    # Plantillas para pedidos confirmados
    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
        canal=CanalNotificacion.EMAIL,
        defaults={
            'asunto': '¡Tu pedido #{pedido_id} ha sido confirmado! - Florería Cristina',
            'mensaje': read_template_file('pedido_confirmado_email.html'),
            'activa': True
        }
    )
    
    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
        canal=CanalNotificacion.WHATSAPP,
        defaults={
            'asunto': 'Pedido Confirmado',
            'mensaje': read_template_file('pedido_confirmado_texto.txt'),
            'activa': True
        }
    )
    
    # Plantillas para pedidos enviados
    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_ENVIADO,
        canal=CanalNotificacion.EMAIL,
        defaults={
            'asunto': '¡Tu pedido #{pedido_id} está en camino! - Florería Cristina',
            'mensaje': read_template_file('pedido_enviado_email.html'),
            'activa': True
        }
    )
    
    # Plantilla predeterminada WhatsApp para pedidos enviados
    whatsapp_enviado = """¡Tu pedido está en camino! 🚚

Hola {{ nombre }},

Tu pedido #{{ pedido_id }} está siendo entregado en estos momentos. Estado actual: {{ estado }}.

Para cualquier consulta sobre la entrega, contáctanos al (123) 456-7890.

Florería Cristina"""

    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_ENVIADO,
        canal=CanalNotificacion.WHATSAPP,
        defaults={
            'asunto': 'Pedido en Camino',
            'mensaje': whatsapp_enviado,
            'activa': True
        }
    )
    
    # Plantillas para pedidos entregados
    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_ENTREGADO,
        canal=CanalNotificacion.EMAIL,
        defaults={
            'asunto': '¡Tu pedido #{pedido_id} ha sido entregado! - Florería Cristina',
            'mensaje': read_template_file('pedido_entregado_email.html'),
            'activa': True
        }
    )
    
    # Plantilla predeterminada WhatsApp para pedidos entregados
    whatsapp_entregado = """¡Tu pedido ha sido entregado! ✅

Hola {{ nombre }},

Te informamos que tu pedido #{{ pedido_id }} ha sido entregado exitosamente.

💐 *¡Muchas gracias por elegirnos!*

En Florería Cristina nos esforzamos cada día para brindarte el mejor servicio y las flores más frescas. Tu confianza es nuestro mayor regalo.

⭐ *¿Nos ayudas con tu opinión?*
Tu experiencia es muy importante para nosotros. Si estás satisfecho con nuestro servicio, nos encantaría que compartas tu opinión en Google:

👉 https://g.page/r/CdV9BtKF_KgNEBM/review

¡Esperamos verte pronto! 🌸"""

    PlantillaNotificacion.objects.update_or_create(
        tipo=TipoNotificacion.PEDIDO_ENTREGADO,
        canal=CanalNotificacion.WHATSAPP,
        defaults={
            'asunto': 'Pedido Entregado',
            'mensaje': whatsapp_entregado,
            'activa': True
        }
    )
    
    print("Plantillas de notificación creadas o actualizadas exitosamente.")


if __name__ == "__main__":
    create_notification_templates()
    print("Proceso completado.")
