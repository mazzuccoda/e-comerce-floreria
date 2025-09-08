import mercadopago
from django.conf import settings
from django.urls import reverse
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """
    Servicio para integración con Mercado Pago
    """
    
    def __init__(self):
        self.sdk = mercadopago.SDK(settings.MERCADOPAGO['ACCESS_TOKEN'])
    
    def create_preference(self, pedido, request):
        """
        Crear preferencia de pago en Mercado Pago
        """
        try:
            # URLs de retorno
            base_url = request.build_absolute_uri('/')[:-1]
            
            # Items del pedido
            items = []
            for item in pedido.items.all():
                items.append({
                    "id": str(item.producto.id),
                    "title": item.producto.nombre,
                    "description": item.producto.descripcion_corta or item.producto.descripcion[:100],
                    "picture_url": item.producto.get_primary_image_url,
                    "category_id": "flowers",
                    "quantity": item.cantidad,
                    "currency_id": "ARS",
                    "unit_price": float(item.precio)
                })
            
            # Agregar costo de envío como item separado
            if pedido.metodo_envio and pedido.metodo_envio.costo > 0:
                items.append({
                    "id": "shipping",
                    "title": f"Envío - {pedido.metodo_envio.nombre}",
                    "description": "Costo de envío",
                    "category_id": "shipping",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(pedido.metodo_envio.costo)
                })
            
            # Datos del comprador
            payer = {
                "name": pedido.nombre_comprador,
                "email": pedido.email_comprador,
                "phone": {
                    "number": pedido.telefono_comprador
                },
                "address": {
                    "street_name": pedido.direccion,
                    "zip_code": pedido.codigo_postal or ""
                }
            }
            
            # Configuración de la preferencia
            preference_data = {
                "items": items,
                "payer": payer,
                "payment_methods": {
                    "excluded_payment_methods": [],
                    "excluded_payment_types": [],
                    "installments": 12
                },
                "back_urls": {
                    "success": f"{base_url}/checkout/success/{pedido.id}/",
                    "failure": f"{base_url}/checkout/failure/{pedido.id}/",
                    "pending": f"{base_url}/checkout/pending/{pedido.id}/"
                },
                "auto_return": "approved",
                "external_reference": str(pedido.id),
                "notification_url": f"{base_url}/api/pedidos/webhook/mercadopago/",
                "statement_descriptor": "FLORERIA CRISTINA",
                "expires": True,
                "expiration_date_from": None,
                "expiration_date_to": None
            }
            
            # Crear preferencia
            preference_response = self.sdk.preference().create(preference_data)
            
            if preference_response["status"] == 201:
                return {
                    'success': True,
                    'preference_id': preference_response["response"]["id"],
                    'init_point': preference_response["response"]["init_point"],
                    'sandbox_init_point': preference_response["response"]["sandbox_init_point"]
                }
            else:
                logger.error(f"Error creating MP preference: {preference_response}")
                return {
                    'success': False,
                    'error': 'Error al crear preferencia de pago'
                }
                
        except Exception as e:
            logger.error(f"Exception in create_preference: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
    
    def get_payment_info(self, payment_id):
        """
        Obtener información de un pago específico
        """
        try:
            payment_response = self.sdk.payment().get(payment_id)
            
            if payment_response["status"] == 200:
                return {
                    'success': True,
                    'payment': payment_response["response"]
                }
            else:
                return {
                    'success': False,
                    'error': 'Pago no encontrado'
                }
                
        except Exception as e:
            logger.error(f"Exception in get_payment_info: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
    
    def process_webhook_notification(self, notification_data):
        """
        Procesar notificación webhook de Mercado Pago
        """
        try:
            notification_type = notification_data.get('type')
            
            if notification_type == 'payment':
                payment_id = notification_data.get('data', {}).get('id')
                
                if payment_id:
                    payment_info = self.get_payment_info(payment_id)
                    
                    if payment_info['success']:
                        payment = payment_info['payment']
                        
                        return {
                            'success': True,
                            'payment_id': payment_id,
                            'status': payment.get('status'),
                            'external_reference': payment.get('external_reference'),
                            'transaction_amount': payment.get('transaction_amount'),
                            'payment_method_id': payment.get('payment_method_id'),
                            'payment_type_id': payment.get('payment_type_id')
                        }
            
            return {
                'success': False,
                'error': 'Notificación no válida'
            }
            
        except Exception as e:
            logger.error(f"Exception in process_webhook_notification: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
