"""
Backend personalizado de email usando SendGrid API
"""

import logging
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger(__name__)


class SendGridAPIBackend(BaseEmailBackend):
    """
    Backend de email que usa la API de SendGrid en lugar de SMTP
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        if not self.api_key:
            logger.error("SENDGRID_API_KEY no configurada")
            if not fail_silently:
                raise ValueError("SENDGRID_API_KEY no configurada")
        
        self.client = SendGridAPIClient(self.api_key)
        logger.info("✅ SendGrid API Backend inicializado")
    
    def send_messages(self, email_messages):
        """
        Envía una lista de mensajes de email usando SendGrid API
        """
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f"❌ Error enviando email: {str(e)}")
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, message):
        """
        Envía un mensaje individual usando SendGrid API
        """
        try:
            # Preparar email
            from_email = Email(message.from_email)
            to_email = To(message.to[0])  # SendGrid API envía a un destinatario a la vez
            subject = message.subject
            content = Content("text/plain", message.body)
            
            mail = Mail(from_email, to_email, subject, content)
            
            logger.info(f"📤 Enviando email vía SendGrid API...")
            logger.info(f"   📮 Desde: {from_email.email}")
            logger.info(f"   📬 Para: {to_email.email}")
            logger.info(f"   📋 Asunto: {subject}")
            
            # Enviar usando API
            response = self.client.send(mail)
            
            logger.info(f"✅ Email enviado exitosamente vía SendGrid API")
            logger.info(f"   📊 Status Code: {response.status_code}")
            logger.info(f"   📝 Message ID: {response.headers.get('X-Message-Id', 'N/A')}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error enviando email vía SendGrid API: {str(e)}")
            logger.error(f"   Tipo: {type(e).__name__}")
            
            if hasattr(e, 'body'):
                logger.error(f"   Body: {e.body}")
            
            raise
