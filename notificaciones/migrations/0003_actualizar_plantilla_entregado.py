# Generated migration to update pedido_entregado templates

from django.db import migrations
import os


def leer_template_email():
    """Lee el template HTML del email"""
    # Obtener la ruta del directorio raíz del proyecto
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    template_path = os.path.join(base_dir, 'templates', 'notifications', 'pedido_entregado_email.html')
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        # Si no encuentra el archivo, devolver un template básico
        return """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Pedido Entregado</title>
</head>
<body>
    <h1>¡Tu Pedido Ha Sido Entregado!</h1>
    <p>Hola {{ nombre }},</p>
    <p>Tu pedido #{{ pedido_id }} ha sido entregado exitosamente.</p>
    <p><strong>¡Muchas gracias por elegirnos!</strong> 💐</p>
    <p>En Florería Cristina nos esforzamos cada día para brindarte el mejor servicio y las flores más frescas. Tu confianza es nuestro mayor regalo.</p>
    <h3>⭐ ¿Nos ayudas con tu opinión?</h3>
    <p>Tu experiencia es muy importante para nosotros. Si estás satisfecho con nuestro servicio, nos encantaría que compartas tu opinión en Google.</p>
    <p><a href="https://g.page/r/CdV9BtKF_KgNEBM/review" target="_blank">⭐ Valorar en Google</a></p>
    <p>¡Esperamos verte pronto! 🌸</p>
</body>
</html>"""


def actualizar_plantillas(apps, schema_editor):
    """Actualiza las plantillas de pedido entregado"""
    PlantillaNotificacion = apps.get_model('notificaciones', 'PlantillaNotificacion')
    
    # Mensaje de WhatsApp actualizado
    whatsapp_mensaje = """¡Tu pedido ha sido entregado! ✅

Hola {{ nombre }},

Te informamos que tu pedido #{{ pedido_id }} ha sido entregado exitosamente.

💐 *¡Muchas gracias por elegirnos!*

En Florería Cristina nos esforzamos cada día para brindarte el mejor servicio y las flores más frescas. Tu confianza es nuestro mayor regalo.

⭐ *¿Nos ayudas con tu opinión?*
Tu experiencia es muy importante para nosotros. Si estás satisfecho con nuestro servicio, nos encantaría que compartas tu opinión en Google:

👉 https://g.page/r/CdV9BtKF_KgNEBM/review

¡Esperamos verte pronto! 🌸"""
    
    # Actualizar plantilla de EMAIL
    try:
        plantilla_email = PlantillaNotificacion.objects.get(
            tipo='pedido_entregado',
            canal='email'
        )
        plantilla_email.asunto = '¡Tu pedido #{pedido_id} ha sido entregado! - Florería Cristina'
        plantilla_email.mensaje = leer_template_email()
        plantilla_email.activa = True
        plantilla_email.save()
        print("✅ Plantilla de EMAIL actualizada")
    except PlantillaNotificacion.DoesNotExist:
        PlantillaNotificacion.objects.create(
            tipo='pedido_entregado',
            canal='email',
            asunto='¡Tu pedido #{pedido_id} ha sido entregado! - Florería Cristina',
            mensaje=leer_template_email(),
            activa=True
        )
        print("✅ Plantilla de EMAIL creada")
    
    # Actualizar plantilla de WHATSAPP
    try:
        plantilla_whatsapp = PlantillaNotificacion.objects.get(
            tipo='pedido_entregado',
            canal='whatsapp'
        )
        plantilla_whatsapp.asunto = 'Pedido Entregado'
        plantilla_whatsapp.mensaje = whatsapp_mensaje
        plantilla_whatsapp.activa = True
        plantilla_whatsapp.save()
        print("✅ Plantilla de WHATSAPP actualizada")
    except PlantillaNotificacion.DoesNotExist:
        PlantillaNotificacion.objects.create(
            tipo='pedido_entregado',
            canal='whatsapp',
            asunto='Pedido Entregado',
            mensaje=whatsapp_mensaje,
            activa=True
        )
        print("✅ Plantilla de WHATSAPP creada")


def revertir_plantillas(apps, schema_editor):
    """Función de rollback (opcional)"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('notificaciones', '0002_alter_plantillanotificacion_tipo'),
    ]

    operations = [
        migrations.RunPython(actualizar_plantillas, revertir_plantillas),
    ]
