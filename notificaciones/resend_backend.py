"""
Backend personalizado para Resend
https://resend.com/docs/send-with-python
"""
import logging
import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):
    """
    Backend de email usando Resend API
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'RESEND_API_KEY', '')
        self.api_url = 'https://api.resend.com/emails'
    
    def send_messages(self, email_messages):
        """
        Enviar mensajes de email usando Resend API
        """
        if not self.api_key:
            logger.error("❌ RESEND_API_KEY no configurada")
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY no configurada")
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f"❌ Error enviando email via Resend: {e}")
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, message):
        """
        Enviar un mensaje individual
        """
        # Preparar payload para Resend
        payload = {
            'from': message.from_email or settings.DEFAULT_FROM_EMAIL,
            'to': message.to,
            'subject': message.subject,
        }
        
        # Agregar CC y BCC si existen
        if message.cc:
            payload['cc'] = message.cc
        if message.bcc:
            payload['bcc'] = message.bcc
        
        # Agregar cuerpo del mensaje
        if message.content_subtype == 'html':
            payload['html'] = message.body
        else:
            payload['text'] = message.body
        
        # Si hay alternativas (texto plano + HTML)
        for alt_content, alt_type in message.alternatives:
            if alt_type == 'text/html':
                payload['html'] = alt_content
        
        # Headers
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }
        
        # Enviar request
        try:
            logger.info(f"📧 Enviando email a {message.to} via Resend")
            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Email enviado exitosamente via Resend a {message.to}")
                return True
            else:
                logger.error(f"❌ Error Resend ({response.status_code}): {response.text}")
                if not self.fail_silently:
                    raise Exception(f"Resend API error: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error de conexión con Resend: {e}")
            if not self.fail_silently:
                raise
            return False
