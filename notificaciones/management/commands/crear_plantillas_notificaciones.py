"""
Comando para crear plantillas de notificaciones por defecto
"""

from django.core.management.base import BaseCommand
from notificaciones.models import PlantillaNotificacion, TipoNotificacion, CanalNotificacion


class Command(BaseCommand):
    help = 'Crea plantillas de notificaciones por defecto'

    def handle(self, *args, **options):
        plantillas = [
            # Plantillas de Email
            {
                'tipo': TipoNotificacion.PEDIDO_CONFIRMADO,
                'canal': CanalNotificacion.EMAIL,
                'asunto': '✅ Pedido Confirmado #{pedido_id} - Florería Cristina',
                'mensaje': '''¡Hola {nombre}!

Tu pedido #{pedido_id} ha sido confirmado exitosamente.

📋 Detalles del pedido:
• Número de pedido: #{pedido_id}
• Total: ${total}
• Fecha: {fecha}
• Cantidad de productos: {items_count}

📦 ¿Qué sigue?
Te notificaremos cuando tu pedido esté en camino. Mientras tanto, puedes revisar el estado de tu pedido en tu cuenta.

💐 ¡Gracias por elegir Florería Cristina!

Saludos,
El equipo de Florería Cristina
🌸 Hacemos que cada momento sea especial 🌸'''
            },
            {
                'tipo': TipoNotificacion.PEDIDO_ENVIADO,
                'canal': CanalNotificacion.EMAIL,
                'asunto': '🚚 Tu pedido #{pedido_id} está en camino - Florería Cristina',
                'mensaje': '''¡Hola {nombre}!

¡Buenas noticias! Tu pedido #{pedido_id} ya está en camino.

📦 Estado: {estado}
📅 Fecha de envío: {fecha}

Recibirás tu pedido pronto. Te notificaremos cuando sea entregado.

¡Gracias por tu paciencia!

Saludos,
El equipo de Florería Cristina'''
            },
            {
                'tipo': TipoNotificacion.PEDIDO_ENTREGADO,
                'canal': CanalNotificacion.EMAIL,
                'asunto': '🎉 Pedido #{pedido_id} entregado - Florería Cristina',
                'mensaje': '''¡Hola {nombre}!

¡Tu pedido #{pedido_id} ha sido entregado exitosamente!

📅 Fecha de entrega: {fecha}

Esperamos que disfrutes tu compra. Si tienes alguna pregunta o comentario, no dudes en contactarnos.

💐 ¡Gracias por elegir Florería Cristina!

Saludos,
El equipo de Florería Cristina'''
            },
            {
                'tipo': TipoNotificacion.REGISTRO_USUARIO,
                'canal': CanalNotificacion.EMAIL,
                'asunto': '🌸 ¡Bienvenido a Florería Cristina!',
                'mensaje': '''¡Hola {nombre}!

¡Bienvenido a Florería Cristina! 🌸

Gracias por registrarte en nuestra tienda online. Ahora puedes:
• Explorar nuestro catálogo completo de flores
• Realizar pedidos de forma rápida y segura
• Seguir el estado de tus pedidos
• Recibir ofertas especiales

📧 Tu email registrado: {email}
📅 Fecha de registro: {fecha}

¡Esperamos que encuentres las flores perfectas para cada ocasión especial!

Saludos,
El equipo de Florería Cristina
🌸 Hacemos que cada momento sea especial 🌸'''
            },
            {
                'tipo': TipoNotificacion.STOCK_BAJO,
                'canal': CanalNotificacion.EMAIL,
                'asunto': '⚠️ Stock Bajo - {producto_nombre}',
                'mensaje': '''Alerta de Stock Bajo

Producto: {producto_nombre}
Stock actual: {stock_actual} unidades
Fecha: {fecha}

Se recomienda reabastecer este producto pronto.

Sistema de Florería Cristina'''
            },

            # Plantillas de WhatsApp
            {
                'tipo': TipoNotificacion.PEDIDO_CONFIRMADO,
                'canal': CanalNotificacion.WHATSAPP,
                'asunto': '',
                'mensaje': '''🌸 *Florería Cristina*

¡Hola {nombre}! ✅

Tu pedido #{pedido_id} ha sido *confirmado*.

💰 Total: ${total}
📅 Fecha: {fecha}
🚚 Envío: {tipo_envio}

Te notificaremos cuando esté en camino.

¡Gracias por elegirnos! 💐'''
            },
            {
                'tipo': TipoNotificacion.PEDIDO_ENVIADO,
                'canal': CanalNotificacion.WHATSAPP,
                'asunto': '',
                'mensaje': '''🌸 *Florería Cristina*

¡Hola {nombre}! 🚚

Tu pedido #{pedido_id} está *en camino*.

📦 Estado: {estado}
📅 Enviado: {fecha}

¡Pronto lo recibirás! 💐'''
            },
            {
                'tipo': TipoNotificacion.PEDIDO_ENTREGADO,
                'canal': CanalNotificacion.WHATSAPP,
                'asunto': '',
                'mensaje': '''🌸 *Florería Cristina*

¡Hola {nombre}! 🎉

Tu pedido #{pedido_id} ha sido *entregado*.

📅 Entregado: {fecha}

¡Esperamos que lo disfrutes! 💐

Gracias por elegirnos 🌸'''
            },
            {
                'tipo': TipoNotificacion.REGISTRO_USUARIO,
                'canal': CanalNotificacion.WHATSAPP,
                'asunto': '',
                'mensaje': '''🌸 *¡Bienvenido a Florería Cristina!*

¡Hola {nombre}! 👋

Gracias por registrarte con nosotros.

📧 Email: {email}
📅 Registro: {fecha}

¡Explora nuestras flores y haz tu primer pedido! 💐

*Hacemos que cada momento sea especial* 🌸'''
            }
        ]

        created_count = 0
        updated_count = 0

        for plantilla_data in plantillas:
            plantilla, created = PlantillaNotificacion.objects.get_or_create(
                tipo=plantilla_data['tipo'],
                canal=plantilla_data['canal'],
                defaults={
                    'asunto': plantilla_data['asunto'],
                    'mensaje': plantilla_data['mensaje'],
                    'activa': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Creada: {plantilla.get_tipo_display()} - {plantilla.get_canal_display()}'
                    )
                )
            else:
                # Actualizar mensaje si es diferente
                if plantilla.mensaje != plantilla_data['mensaje'] or plantilla.asunto != plantilla_data['asunto']:
                    plantilla.mensaje = plantilla_data['mensaje']
                    plantilla.asunto = plantilla_data['asunto']
                    plantilla.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'🔄 Actualizada: {plantilla.get_tipo_display()} - {plantilla.get_canal_display()}'
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n📊 Resumen:'
                f'\n• Plantillas creadas: {created_count}'
                f'\n• Plantillas actualizadas: {updated_count}'
                f'\n• Total plantillas: {PlantillaNotificacion.objects.count()}'
            )
        )
