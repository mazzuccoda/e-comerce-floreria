"""
Servicios para envío de notificaciones por WhatsApp y Email
"""

import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template import Template, Context
from django.utils import timezone
from .models import (
    Notificacion, PlantillaNotificacion, TipoNotificacion, 
    CanalNotificacion, EstadoNotificacion
)

logger = logging.getLogger(__name__)


class NotificacionService:
    """Servicio base para notificaciones"""
    
    def __init__(self):
        self.twilio_client = None
        self._init_twilio()
    
    def _init_twilio(self):
        """Inicializa el cliente de Twilio"""
        try:
            from twilio.rest import Client
            account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
            auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
            
            if account_sid and auth_token:
                self.twilio_client = Client(account_sid, auth_token)
                logger.info("Cliente Twilio inicializado correctamente")
            else:
                logger.warning("Credenciales de Twilio no configuradas")
        except ImportError:
            logger.error("Twilio no está instalado. Instalar con: pip install twilio")
        except Exception as e:
            logger.error(f"Error inicializando Twilio: {str(e)}")
    
    def crear_notificacion(
        self,
        usuario,
        tipo: str,
        canal: str,
        destinatario: str,
        contexto: Dict[str, Any] = None,
        pedido_id: Optional[int] = None,
        producto_id: Optional[int] = None,
        metadatos: Dict[str, Any] = None
    ) -> Notificacion:
        """
        Crea una nueva notificación
        """
        contexto = contexto or {}
        metadatos = metadatos or {}
        
        try:
            # Obtener plantilla
            plantilla = PlantillaNotificacion.objects.get(
                tipo=tipo,
                canal=canal,
                activa=True
            )
        except PlantillaNotificacion.DoesNotExist:
            logger.error(f"No se encontró plantilla para {tipo} - {canal}")
            raise ValueError(f"No existe plantilla para {tipo} en canal {canal}")
        
        # Renderizar mensaje y asunto
        asunto_renderizado = self._renderizar_template(plantilla.asunto, contexto)
        mensaje_renderizado = self._renderizar_template(plantilla.mensaje, contexto)
        
        # Crear notificación
        notificacion = Notificacion.objects.create(
            usuario=usuario,
            tipo=tipo,
            canal=canal,
            destinatario=destinatario,
            asunto=asunto_renderizado,
            mensaje=mensaje_renderizado,
            pedido_id=pedido_id,
            producto_id=producto_id,
            metadatos=metadatos
        )
        
        logger.info(f"Notificación creada: {notificacion.id}")
        return notificacion
    
    def _renderizar_template(self, template_string: str, contexto: Dict[str, Any]) -> str:
        """Renderiza una plantilla con el contexto dado usando format()"""
        try:
            # Usar format() de Python para reemplazar {variable}
            return template_string.format(**contexto)
        except KeyError as e:
            logger.warning(f"Variable faltante en template: {str(e)}")
            # Intentar con las variables disponibles
            try:
                return template_string.format_map(contexto)
            except Exception:
                return template_string
        except Exception as e:
            logger.error(f"Error renderizando template: {str(e)}")
            return template_string
    
    def enviar_notificacion(self, notificacion: Notificacion) -> bool:
        """
        Envía una notificación según su canal
        """
        logger.info(f"🔄 Iniciando envío de notificación {notificacion.id}, canal: {notificacion.canal}")
        
        if not notificacion.puede_reintentar():
            logger.warning(f"Notificación {notificacion.id} no puede reintentarse")
            return False
        
        notificacion.intentos += 1
        notificacion.estado = EstadoNotificacion.REINTENTANDO
        notificacion.save()
        logger.info(f"📝 Notificación {notificacion.id} actualizada, intentos: {notificacion.intentos}")
        
        try:
            if notificacion.canal == CanalNotificacion.EMAIL:
                logger.info(f"📧 Enviando email a {notificacion.destinatario}...")
                return self._enviar_email(notificacion)
            elif notificacion.canal == CanalNotificacion.WHATSAPP:
                return self._enviar_whatsapp(notificacion)
            elif notificacion.canal == CanalNotificacion.SMS:
                return self._enviar_sms(notificacion)
            else:
                raise ValueError(f"Canal no soportado: {notificacion.canal}")
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error enviando notificación {notificacion.id}: {error_msg}")
            notificacion.marcar_como_fallida(error_msg)
            return False
    
    def _enviar_email(self, notificacion: Notificacion) -> bool:
        """Envía notificación por email"""
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@floreriacristina.com')
            logger.info(f"📮 Preparando email desde {from_email} hacia {notificacion.destinatario}")
            logger.info(f"📋 Asunto: {notificacion.asunto}")
            logger.info(f"📧 Backend EMAIL: {getattr(settings, 'EMAIL_BACKEND', 'NO CONFIGURADO')}")
            logger.info(f"🔧 EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'NO CONFIGURADO')}")
            
            # Agregar timeout para evitar bloqueos
            import socket
            original_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(10)  # 10 segundos máximo
            
            try:
                send_mail(
                    subject=notificacion.asunto,
                    message=notificacion.mensaje,
                    from_email=from_email,
                    recipient_list=[notificacion.destinatario],
                    fail_silently=False
                )
                
                notificacion.marcar_como_enviada()
                logger.info(f"✅ Email enviado exitosamente a {notificacion.destinatario}")
                return True
            finally:
                socket.setdefaulttimeout(original_timeout)
            
        except socket.timeout:
            error_msg = "Timeout conectando al servidor SMTP (Railway puede estar bloqueando el puerto 587)"
            logger.error(f"⏱️ {error_msg}")
            notificacion.marcar_como_fallida(error_msg)
            return False
        except Exception as e:
            logger.error(f"❌ Error enviando email: {str(e)}", exc_info=True)
            raise
    
    def _enviar_whatsapp(self, notificacion: Notificacion) -> bool:
        """Envía notificación por WhatsApp"""
        if not self.twilio_client:
            raise Exception("Cliente Twilio no inicializado")
        
        try:
            whatsapp_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
            if not whatsapp_number:
                raise Exception("Número de WhatsApp no configurado")
            
            # Formatear número de destino
            to_number = self._formatear_numero_whatsapp(notificacion.destinatario)
            
            message = self.twilio_client.messages.create(
                body=notificacion.mensaje,
                from_=f'whatsapp:{whatsapp_number}',
                to=f'whatsapp:{to_number}'
            )
            
            notificacion.metadatos['twilio_sid'] = message.sid
            notificacion.marcar_como_enviada()
            logger.info(f"WhatsApp enviado a {to_number}, SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando WhatsApp: {str(e)}")
            raise
    
    def _enviar_sms(self, notificacion: Notificacion) -> bool:
        """Envía notificación por SMS"""
        if not self.twilio_client:
            raise Exception("Cliente Twilio no inicializado")
        
        try:
            sms_number = getattr(settings, 'TWILIO_SMS_NUMBER', None)
            if not sms_number:
                raise Exception("Número de SMS no configurado")
            
            message = self.twilio_client.messages.create(
                body=notificacion.mensaje,
                from_=sms_number,
                to=notificacion.destinatario
            )
            
            notificacion.metadatos['twilio_sid'] = message.sid
            notificacion.marcar_como_enviada()
            logger.info(f"SMS enviado a {notificacion.destinatario}, SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando SMS: {str(e)}")
            raise
    
    def _formatear_numero_whatsapp(self, numero: str) -> str:
        """Formatea número para WhatsApp"""
        # Remover espacios y caracteres especiales
        numero_limpio = ''.join(filter(str.isdigit, numero))
        
        # Si no empieza con código de país, asumir Argentina (+54)
        if not numero_limpio.startswith('54') and len(numero_limpio) == 10:
            numero_limpio = '54' + numero_limpio
        
        return '+' + numero_limpio
    
    def enviar_notificacion_pedido(
        self,
        usuario,
        tipo_notificacion: str,
        pedido_id: int,
        contexto_adicional: Dict[str, Any] = None
    ):
        """
        Envía notificaciones relacionadas con pedidos
        """
        contexto = {
            'nombre': usuario.first_name or usuario.username,
            'pedido_id': pedido_id,
            **(contexto_adicional or {})
        }
        
        # Verificar configuración del usuario
        config = getattr(usuario, 'config_notificaciones', None)
        if config and not config.pedidos_habilitado:
            logger.info(f"Usuario {usuario.username} tiene notificaciones de pedidos deshabilitadas")
            return
        
        notificaciones_creadas = []
        
        # Email
        if not config or config.email_habilitado:
            try:
                notif_email = self.crear_notificacion(
                    usuario=usuario,
                    tipo=tipo_notificacion,
                    canal=CanalNotificacion.EMAIL,
                    destinatario=usuario.email,
                    contexto=contexto,
                    pedido_id=pedido_id
                )
                notificaciones_creadas.append(notif_email)
            except Exception as e:
                logger.error(f"Error creando notificación email: {str(e)}")
        
        # WhatsApp
        if (not config or config.whatsapp_habilitado) and hasattr(usuario, 'perfil') and usuario.perfil.telefono:
            try:
                notif_whatsapp = self.crear_notificacion(
                    usuario=usuario,
                    tipo=tipo_notificacion,
                    canal=CanalNotificacion.WHATSAPP,
                    destinatario=usuario.perfil.telefono,
                    contexto=contexto,
                    pedido_id=pedido_id
                )
                notificaciones_creadas.append(notif_whatsapp)
            except Exception as e:
                logger.error(f"Error creando notificación WhatsApp: {str(e)}")
        
        # Enviar todas las notificaciones
        for notificacion in notificaciones_creadas:
            try:
                self.enviar_notificacion(notificacion)
            except Exception as e:
                logger.error(f"Error enviando notificación {notificacion.id}: {str(e)}")
        
        return notificaciones_creadas
    
    def enviar_notificacion_registro(self, usuario):
        """Envía notificación de bienvenida al registrarse"""
        contexto = {
            'nombre': usuario.first_name or usuario.username,
            'email': usuario.email,
            'fecha': timezone.now().strftime('%d/%m/%Y')
        }
        
        return self.enviar_notificacion_pedido(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.REGISTRO_USUARIO,
            pedido_id=None,
            contexto_adicional=contexto
        )


# Instancia global del servicio
notificacion_service = NotificacionService()
