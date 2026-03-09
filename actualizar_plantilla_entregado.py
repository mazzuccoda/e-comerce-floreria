"""
Script para actualizar la plantilla de notificación de pedido entregado
con el nuevo mensaje de agradecimiento y link de Google review
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
django.setup()

from notificaciones.models import PlantillaNotificacion, TipoNotificacion, CanalNotificacion


def leer_template_email():
    """Lee el template HTML del email"""
    template_path = os.path.join(
        os.path.dirname(__file__),
        'templates',
        'notifications',
        'pedido_entregado_email.html'
    )
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()


def actualizar_plantillas():
    """Actualiza las plantillas de pedido entregado en la base de datos"""
    
    # Actualizar plantilla de EMAIL
    print("📧 Actualizando plantilla de EMAIL para pedido entregado...")
    plantilla_email, created = PlantillaNotificacion.objects.get_or_create(
        tipo=TipoNotificacion.PEDIDO_ENTREGADO,
        canal=CanalNotificacion.EMAIL,
        defaults={
            'asunto': '¡Tu pedido #{pedido_id} ha sido entregado! - Florería Cristina',
            'mensaje': leer_template_email(),
            'activa': True
        }
    )
    
    if not created:
        plantilla_email.asunto = '¡Tu pedido #{pedido_id} ha sido entregado! - Florería Cristina'
        plantilla_email.mensaje = leer_template_email()
        plantilla_email.activa = True
        plantilla_email.save()
        print("✅ Plantilla de EMAIL actualizada")
    else:
        print("✅ Plantilla de EMAIL creada")
    
    # Actualizar plantilla de WHATSAPP
    print("\n📱 Actualizando plantilla de WHATSAPP para pedido entregado...")
    
    whatsapp_mensaje = """¡Tu pedido ha sido entregado! ✅

Hola {{ nombre }},

Te informamos que tu pedido #{{ pedido_id }} ha sido entregado exitosamente.

💐 *¡Muchas gracias por elegirnos!*

En Florería Cristina nos esforzamos cada día para brindarte el mejor servicio y las flores más frescas. Tu confianza es nuestro mayor regalo.

⭐ *¿Nos ayudas con tu opinión?*
Tu experiencia es muy importante para nosotros. Si estás satisfecho con nuestro servicio, nos encantaría que compartas tu opinión en Google:

👉 https://g.page/r/CdV9BtKF_KgNEBM/review

¡Esperamos verte pronto! 🌸"""
    
    plantilla_whatsapp, created = PlantillaNotificacion.objects.get_or_create(
        tipo=TipoNotificacion.PEDIDO_ENTREGADO,
        canal=CanalNotificacion.WHATSAPP,
        defaults={
            'asunto': 'Pedido Entregado',
            'mensaje': whatsapp_mensaje,
            'activa': True
        }
    )
    
    if not created:
        plantilla_whatsapp.asunto = 'Pedido Entregado'
        plantilla_whatsapp.mensaje = whatsapp_mensaje
        plantilla_whatsapp.activa = True
        plantilla_whatsapp.save()
        print("✅ Plantilla de WHATSAPP actualizada")
    else:
        print("✅ Plantilla de WHATSAPP creada")
    
    print("\n🎉 ¡Plantillas actualizadas exitosamente!")
    print("\nAhora cuando marques un pedido como 'Entregado', se enviará:")
    print("- 📧 Email con el nuevo mensaje de agradecimiento y link de Google review")
    print("- 📱 WhatsApp con el nuevo mensaje de agradecimiento y link de Google review")


if __name__ == '__main__':
    actualizar_plantillas()
