import os
from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def enviar_whatsapp(to, body):
    """
    Envía un mensaje de WhatsApp usando la API de Twilio.

    Args:
        to (str): El número de teléfono del destinatario en formato E.164 (ej: 'whatsapp:+5493815123456').
        body (str): El cuerpo del mensaje a enviar.

    Returns:
        bool: True si el mensaje se envió con éxito, False en caso contrario.
    """
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_WHATSAPP_NUMBER]):
        logger.warning("Credenciales de Twilio no configuradas. Omitiendo envío de WhatsApp.")
        return False

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            from_=f'whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}',
            body=body,
            to=to
        )
        
        logger.info(f"Mensaje de WhatsApp enviado a {to}. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar WhatsApp a {to}: {e}", exc_info=True)
        return False

def enviar_whatsapp_confirmacion_pedido(pedido):
    """
    Construye y envía un mensaje de confirmación de pedido por WhatsApp.
    """
    # Asumimos que el teléfono del comprador está en el objeto Pedido
    # y que está en un formato que podemos convertir a E.164
    # Esta lógica puede necesitar ajustes según cómo se guarde el número.
    if not pedido.telefono_comprador:
        logger.warning(f"Pedido {pedido.id} no tiene teléfono de comprador. No se puede enviar WhatsApp.")
        return

    # Formato E.164 para Argentina: +549 seguido del código de área y número
    # Se debe asegurar que el número guardado no tenga prefijos como '15'
    numero_destino = f"whatsapp:+549{pedido.telefono_comprador}"
    
    mensaje = (
        f"¡Hola {pedido.nombre_comprador}! 👋\n\n"
        f"Gracias por tu compra en Florería Cristina. Hemos recibido tu pedido *#{pedido.id}* y ya lo estamos preparando.\n\n"
        f"*Resumen de la entrega:*\n"
        f"Destinatario: {pedido.nombre_destinatario}\n"
        f"Fecha de Entrega: {pedido.fecha_entrega.strftime('%d/%m/%Y')}\n"
        f"Franja Horaria: {pedido.get_franja_horaria_entrega_display()}\n\n"
        f"Puedes seguir el estado de tu pedido aquí:\n"
        # Aquí deberíamos tener la URL completa, necesitaremos construirla
        # TODO: Construir la URL de seguimiento de forma dinámica
        f"[Link de seguimiento]"
    )

    enviar_whatsapp(numero_destino, mensaje)

def enviar_whatsapp_actualizacion_estado(pedido):
    """
    Notifica al comprador sobre un cambio en el estado de su pedido.
    """
    if not pedido.telefono_comprador:
        return

    numero_destino = f"whatsapp:+549{pedido.telefono_comprador}"
    estado_actual = pedido.get_estado_display()

    mensaje = (
        f"¡Actualización de tu pedido *#{pedido.id}*!\n\n"
        f"El estado de tu pedido ha cambiado a: *{estado_actual}*.\n\n"
        f"Florería Cristina."
    )

    enviar_whatsapp(numero_destino, mensaje)
