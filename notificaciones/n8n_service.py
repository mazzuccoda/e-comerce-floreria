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
            telefono_cliente = getattr(pedido, 'telefono_comprador', None) or ''
            if not telefono_cliente and getattr(pedido, 'cliente', None):
                # Usuario registrado: buscar en perfil
                if hasattr(pedido.cliente, 'perfil'):
                    telefono_cliente = getattr(pedido.cliente.perfil, 'telefono', '') or ''
            if not telefono_cliente:
                telefono_cliente = getattr(pedido, 'telefono_destinatario', '')
            
            logger.info(f"📞 Teléfono para WhatsApp: {telefono_cliente} (comprador: {getattr(pedido, 'telefono_comprador', 'N/A')}, destinatario: {getattr(pedido, 'telefono_destinatario', 'N/A')})")

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
                    'phone': telefono_cliente,
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


# Instancia global del servicio
n8n_service = N8NService()
