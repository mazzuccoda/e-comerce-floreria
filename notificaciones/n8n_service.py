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
            
            # Preparar datos del pedido
            data = {
                'pedido_id': pedido.id,
                'numero_pedido': pedido.numero_pedido,
                'nombre_destinatario': pedido.nombre_destinatario,
                'telefono_destinatario': pedido.telefono_destinatario,
                'direccion': pedido.direccion,
                'fecha_entrega': fecha_entrega_str,
                'franja_horaria': pedido.get_franja_horaria_display(),
                'estado': pedido.estado,
                'total': str(pedido.total),
                'dedicatoria': pedido.dedicatoria or '',
                'items': [
                    {
                        'producto_nombre': item.producto.nombre,
                        'cantidad': item.cantidad,
                        'precio': str(item.precio)
                    }
                    for item in pedido.items.all()
                ]
            }
            
            # Determinar webhook según tipo
            # El path debe coincidir EXACTAMENTE con el configurado en n8n
            # Según la Production URL de n8n: /webhook/pedido-confirmado
            webhook_path = {
                'confirmado': '/webhook/pedido-confirmado',
                'estado': '/webhook/pedido-estado'
            }.get(tipo, '/webhook/pedido-confirmado')
            
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
