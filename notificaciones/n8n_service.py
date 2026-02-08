"""
Servicio de notificaciones vía n8n + Twilio WhatsApp
Autor: Florería Cristina
Fecha: Octubre 2025
"""

import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class N8NService:
    """Servicio para enviar notificaciones vía n8n + Twilio WhatsApp"""
    
    def __init__(self):
        self.base_url = getattr(settings, 'N8N_WEBHOOK_URL', 'http://n8n:5678')
        self.api_key = getattr(settings, 'N8N_API_KEY', '')
        self.enabled = getattr(settings, 'N8N_ENABLED', True)
    
    def enviar_notificacion_pedido(self, pedido, tipo='confirmado'):
        """
        Envía notificación de pedido vía n8n
        
        Args:
            pedido: Instancia de Pedido
            tipo: 'confirmado' o 'estado'
        
        Returns:
            bool: True si se envió exitosamente
        """
        if not self.enabled:
            logger.info("n8n deshabilitado, notificación no enviada")
            return False
        
        if not self.api_key:
            logger.warning("N8N_API_KEY no configurado, notificación no enviada")
            return False
        
        try:
            # Preparar fecha_entrega (puede ser date o string)
            from datetime import date
            if isinstance(pedido.fecha_entrega, date):
                fecha_entrega_str = pedido.fecha_entrega.strftime('%d/%m/%Y')
            else:
                fecha_entrega_str = str(pedido.fecha_entrega)

            # Preparar datos del pedido (payload estructurado para que n8n renderice el mensaje)
            # WhatsApp solo al COMPRADOR (nunca al destinatario)
            # Prioridad: telefono_comprador > perfil.telefono
            telefono_cliente = ''
            
            # 1. Leer telefono_comprador directamente
            if pedido.telefono_comprador:
                telefono_cliente = str(pedido.telefono_comprador).strip()
                logger.info(f"✅ Usando telefono_comprador: '{telefono_cliente}'")
            
            # 2. Si está vacío y es usuario registrado, buscar en perfil
            elif pedido.cliente:
                try:
                    if hasattr(pedido.cliente, 'perfil') and pedido.cliente.perfil.telefono:
                        telefono_cliente = str(pedido.cliente.perfil.telefono).strip()
                        logger.info(f"✅ Usando perfil.telefono: '{telefono_cliente}'")
                except Exception as e:
                    logger.warning(f"⚠️ Error accediendo a perfil: {e}")
            
            # Si no hay teléfono del comprador, no enviar WhatsApp
            if not telefono_cliente:
                logger.warning(f"⚠️ Pedido #{pedido.numero_pedido}: no se encontró teléfono del comprador. WhatsApp no enviado.")
                return False
            
            # NORMALIZAR TELÉFONO para formato internacional (soporta Argentina, España, etc.)
            from pedidos.utils import normalizar_telefono_whatsapp
            telefono_normalizado = normalizar_telefono_whatsapp(telefono_cliente)
            
            if not telefono_normalizado:
                logger.error(f"❌ No se pudo normalizar el teléfono '{telefono_cliente}'. WhatsApp no enviado.")
                return False
            
            logger.info(f"📞 Teléfono normalizado para WhatsApp: '{telefono_cliente}' → '{telefono_normalizado}'")

            nombre_cliente = getattr(pedido, 'nombre_comprador', None) or ''
            if not nombre_cliente and getattr(pedido, 'cliente', None):
                cliente = pedido.cliente
                nombre_cliente = (
                    getattr(cliente, 'first_name', '')
                    or getattr(cliente, 'username', '')
                    or 'Cliente'
                )
            if not nombre_cliente:
                nombre_cliente = 'Cliente'

            direccion = getattr(pedido, 'direccion', '')
            ciudad = getattr(pedido, 'ciudad', '')
            if ciudad:
                direccion = f"{direccion}, {ciudad}"

            data = {
                'event': 'order_status_changed',
                'status': pedido.estado,
                'status_label': pedido.get_estado_display(),
                'order': {
                    'id': pedido.id,
                    'number': pedido.numero_pedido,
                    'total': str(pedido.total),
                    'shipping_cost': str(getattr(pedido, 'costo_envio', 0) or 0),
                    'currency': 'ARS',
                },
                'customer': {
                    'name': nombre_cliente,
                    'phone': telefono_normalizado,
                },
                'delivery': {
                    'date': fecha_entrega_str,
                    'slot': pedido.get_franja_horaria_display(),
                    'address': direccion,
                    'recipient': pedido.nombre_destinatario,
                },
                'items': [
                    {
                        'name': item.producto.nombre,
                        'qty': item.cantidad,
                        'unit_price': str(item.precio),
                    }
                    for item in pedido.items.all()
                ],
                'meta': {
                    'source': 'django',
                },
            }

            # Usar un único webhook para estados: /webhook/pedido-estado
            webhook_path = '/webhook/pedido-estado'
            
            # Enviar a n8n
            logger.info(f"📤 Enviando notificación n8n para pedido #{pedido.numero_pedido} (tipo: {tipo})")
            
            response = requests.post(
                f"{self.base_url}{webhook_path}",
                json=data,
                headers={
                    'X-API-Key': self.api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Notificación WhatsApp enviada para pedido #{pedido.numero_pedido}")
                return True
            else:
                logger.error(f"❌ Error n8n: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Timeout al enviar notificación para pedido #{pedido.numero_pedido}")
            return False
        except requests.exceptions.ConnectionError:
            logger.error(f"🔌 Error de conexión con n8n. ¿Está corriendo el servicio?")
            return False
        except Exception as e:
            logger.error(f"❌ Error enviando notificación n8n: {str(e)}")
            return False
    
    def enviar_recuperacion_password(self, telefono, nombre_usuario, token, frontend_url):
        """
        Envía mensaje de WhatsApp para recuperación de contraseña vía n8n + Evolution API
        
        Args:
            telefono: Número de teléfono del usuario (normalizado)
            nombre_usuario: Nombre del usuario
            token: Token de recuperación
            frontend_url: URL del frontend para construir el link
        
        Returns:
            bool: True si se envió exitosamente
        """
        if not self.enabled:
            logger.info("n8n deshabilitado, notificación no enviada")
            return False
        
        if not self.api_key:
            logger.warning("N8N_API_KEY no configurado, notificación no enviada")
            return False
        
        try:
            # Normalizar teléfono
            from pedidos.utils import normalizar_telefono_whatsapp
            telefono_normalizado = normalizar_telefono_whatsapp(telefono)
            
            if not telefono_normalizado:
                logger.error(f"❌ No se pudo normalizar el teléfono '{telefono}'")
                return False
            
            # Construir URL de reset
            reset_url = f"{frontend_url}/reset-password/{token}"
            
            # Preparar datos para n8n
            data = {
                'event': 'password_reset',
                'customer': {
                    'name': nombre_usuario,
                    'phone': telefono_normalizado,
                },
                'reset': {
                    'url': reset_url,
                    'token': token,
                },
                'meta': {
                    'source': 'django',
                    'type': 'password_recovery',
                },
            }
            
            # Webhook específico para recuperación de contraseña
            webhook_path = '/webhook/password-reset'
            
            logger.info(f"📤 Enviando WhatsApp de recuperación de contraseña a {telefono_normalizado}")
            logger.debug(f"🔍 Payload completo: {data}")
            logger.debug(f"🔍 URL: {self.base_url}{webhook_path}")
            
            response = requests.post(
                f"{self.base_url}{webhook_path}",
                json=data,
                headers={
                    'X-API-Key': self.api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            logger.debug(f"🔍 Response status: {response.status_code}")
            logger.debug(f"🔍 Response body: {response.text}")
            
            if response.status_code == 200:
                logger.info(f"✅ WhatsApp de recuperación enviado a {telefono_normalizado}")
                return True
            else:
                logger.error(f"❌ Error n8n: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Timeout al enviar WhatsApp de recuperación")
            return False
        except requests.exceptions.ConnectionError:
            logger.error(f"🔌 Error de conexión con n8n")
            return False
        except Exception as e:
            logger.error(f"❌ Error enviando WhatsApp de recuperación: {str(e)}")
            return False


# Instancia global del servicio
n8n_service = N8NService()
