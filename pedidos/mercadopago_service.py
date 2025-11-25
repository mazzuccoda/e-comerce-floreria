import mercadopago
from django.conf import settings
from django.urls import reverse
from decimal import Decimal
import logging
import os

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """
    Servicio para integración con Mercado Pago
    """
    
    def __init__(self):
        access_token = settings.MERCADOPAGO['ACCESS_TOKEN']
        # Log para debugging (solo mostrar primeros y últimos caracteres)
        if access_token:
            token_preview = f"{access_token[:15]}...{access_token[-10:]}" if len(access_token) > 25 else "TOKEN_TOO_SHORT"
            logger.info(f"🔑 Inicializando MercadoPago SDK con token: {token_preview}")
            logger.info(f"🔑 Token length: {len(access_token)}")
            logger.info(f"🔑 Token type: {'TEST' if access_token.startswith('TEST-') else 'PRODUCTION' if access_token.startswith('APP_USR-') else 'UNKNOWN'}")
        else:
            logger.error("❌ ACCESS_TOKEN is None or empty!")
        
        self.sdk = mercadopago.SDK(access_token)
    
    def create_preference(self, pedido, request):
        """
        Crear preferencia de pago en Mercado Pago
        """
        try:
            # URLs de retorno - usar la URL del frontend en Railway
            base_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
            
            # Items del pedido
            items = []
            for item in pedido.items.all():
                # Obtener la URL completa de la imagen
                picture_url = None
                try:
                    image_url = item.producto.get_primary_image_url
                    # Solo incluir si no es un placeholder y si es una URL completa
                    if image_url and not image_url.startswith('https://via.placeholder.com'):
                        # Si la imagen ya es una URL completa (Cloudinary), usarla directamente
                        if image_url.startswith('http'):
                            picture_url = image_url
                        else:
                            # Si es una ruta relativa, construir URL completa
                            backend_url = os.getenv('BACKEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
                            picture_url = f"{backend_url}{image_url}"
                except Exception as e:
                    print(f"⚠️ No se pudo obtener imagen para producto {item.producto.id}: {e}")
                
                items.append({
                    "id": str(item.producto.id),
                    "title": item.producto.nombre[:100],  # MercadoPago limita a 256 caracteres
                    "description": (item.producto.descripcion_corta or item.producto.descripcion)[:100],
                    "picture_url": picture_url,
                    "category_id": "flowers",
                    "quantity": item.cantidad,
                    "currency_id": "ARS",
                    "unit_price": float(item.precio)
                })
            
            # Agregar costo de envío como item separado
            shipping_cost = 0
            shipping_name = ""
            
            # Debug: Log del tipo de envío
            logger.info(f"🚚 DEBUG - Pedido #{pedido.id}")
            logger.info(f"🚚 DEBUG - tipo_envio: '{pedido.tipo_envio}' (type: {type(pedido.tipo_envio)})")
            logger.info(f"🚚 DEBUG - tipo_envio repr: {repr(pedido.tipo_envio)}")
            logger.info(f"🚚 DEBUG - metodo_envio: {pedido.metodo_envio}")
            
            # Normalizar tipo_envio (eliminar espacios y convertir a minúsculas)
            tipo_envio_normalizado = str(pedido.tipo_envio).strip().lower() if pedido.tipo_envio else None
            logger.info(f"🚚 DEBUG - tipo_envio_normalizado: '{tipo_envio_normalizado}'")
            
            # Determinar costo de envío según tipo_envio
            if tipo_envio_normalizado == 'express':
                shipping_cost = 10000  # $10.000
                shipping_name = "Envío Express (2-4 horas)"
                logger.info(f"✅ Detectado envío EXPRESS: ${shipping_cost}")
            elif tipo_envio_normalizado == 'programado':
                shipping_cost = 5000  # $5.000
                shipping_name = "Envío Programado"
                logger.info(f"✅ Detectado envío PROGRAMADO: ${shipping_cost}")
            elif tipo_envio_normalizado == 'retiro':
                shipping_cost = 0
                shipping_name = "Retiro en tienda"
                logger.info(f"✅ Detectado RETIRO en tienda: ${shipping_cost}")
            # Fallback: si usa metodo_envio legacy
            elif pedido.metodo_envio and pedido.metodo_envio.costo > 0:
                shipping_cost = float(pedido.metodo_envio.costo)
                shipping_name = pedido.metodo_envio.nombre
                logger.info(f"✅ Usando método de envío legacy: ${shipping_cost}")
            else:
                logger.warning(f"⚠️ No se pudo determinar costo de envío. tipo_envio='{tipo_envio_normalizado}', metodo_envio={pedido.metodo_envio}")
            
            # Agregar item de envío si tiene costo
            if shipping_cost > 0:
                items.append({
                    "id": "shipping",
                    "title": f"Envío - {shipping_name}",
                    "description": "Costo de envío",
                    "category_id": "shipping",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(shipping_cost)
                })
                logger.info(f"📦 Agregando costo de envío: ${shipping_cost} ({shipping_name})")
            
            # Datos del comprador
            payer = {
                "name": pedido.nombre_comprador,
                "email": pedido.email_comprador,
                "phone": {
                    "number": pedido.telefono_comprador
                }
            }
            
            # Solo agregar dirección si hay código postal
            if pedido.codigo_postal:
                payer["address"] = {
                    "street_name": pedido.direccion,
                    "zip_code": pedido.codigo_postal
                }
            
            # URLs de retorno - DEBEN pasar por el backend primero
            from django.conf import settings
            backend_url = os.getenv('BACKEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            
            logger.info(f"🌐 Backend URL para MercadoPago: {backend_url}")
            
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
                    "success": f"{backend_url}/api/pedidos/{pedido.id}/payment/success/",
                    "failure": f"{backend_url}/api/pedidos/{pedido.id}/payment/failure/",
                    "pending": f"{backend_url}/api/pedidos/{pedido.id}/payment/pending/"
                },
                "auto_return": "approved",
                "external_reference": str(pedido.id),
                "statement_descriptor": "FLORERIA CRISTINA",
                "notification_url": f"{backend_url}/api/pedidos/webhook/mercadopago/"
            }
            
            # Crear preferencia
            logger.info(f"📤 Enviando preferencia a MercadoPago para pedido #{pedido.id}")
            logger.info(f"📦 Items count: {len(items)}")
            logger.info(f"💰 Total amount: {sum(item['unit_price'] * item['quantity'] for item in items)}")
            
            preference_response = self.sdk.preference().create(preference_data)
            
            logger.info(f"📥 MercadoPago Response Status: {preference_response.get('status')}")
            if preference_response.get("status") != 201:
                logger.error(f"❌ MercadoPago Error Response: {preference_response}")
            
            if preference_response["status"] == 201:
                print(f"✅ Preferencia creada exitosamente")
                return {
                    'success': True,
                    'preference_id': preference_response["response"]["id"],
                    'init_point': preference_response["response"]["init_point"],
                    'sandbox_init_point': preference_response["response"]["sandbox_init_point"]
                }
            else:
                print(f"❌ Error creating MP preference: {preference_response}")
                logger.error(f"Error creating MP preference: {preference_response}")
                error_message = preference_response.get('response', {}).get('message', 'Error al crear preferencia de pago')
                return {
                    'success': False,
                    'error': error_message
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
    
    def create_qr_for_transfer(self, pedido):
        """
        Crear QR dinámico de Mercado Pago para transferencia bancaria
        OPCIONAL: Solo se usa si el método de pago es 'transferencia'
        """
        try:
            logger.info(f"🔄 Generando QR de transferencia para pedido #{pedido.id}")
            
            # Crear preferencia específica para transferencia
            preference_data = {
                "items": [{
                    "id": str(pedido.id),
                    "title": f"Pedido #{pedido.numero_pedido}",
                    "description": f"Pago de pedido de Florería Cristina",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(pedido.total)
                }],
                "payment_methods": {
                    # Solo permitir transferencia bancaria
                    "excluded_payment_types": [
                        {"id": "credit_card"},
                        {"id": "debit_card"},
                        {"id": "ticket"}
                    ],
                    "excluded_payment_methods": [],
                    "installments": 1
                },
                "back_urls": {
                    "success": f"{os.getenv('BACKEND_URL')}/api/pedidos/{pedido.id}/payment/success/",
                    "failure": f"{os.getenv('BACKEND_URL')}/api/pedidos/{pedido.id}/payment/failure/",
                    "pending": f"{os.getenv('BACKEND_URL')}/api/pedidos/{pedido.id}/payment/pending/"
                },
                "auto_return": "approved",
                "external_reference": str(pedido.id),
                "statement_descriptor": "FLORERIA CRISTINA",
                "notification_url": f"{os.getenv('BACKEND_URL')}/api/pedidos/webhook/mercadopago/",
                "metadata": {
                    "pedido_id": str(pedido.id),
                    "tipo_pago": "transferencia_qr"
                }
            }
            
            # Crear preferencia
            preference_response = self.sdk.preference().create(preference_data)
            
            if preference_response["status"] == 201:
                preference_id = preference_response["response"]["id"]
                
                # Generar QR usando la API de QR de Mercado Pago
                # El QR se puede generar desde el init_point
                qr_data = {
                    "preference_id": preference_id,
                    "init_point": preference_response["response"]["init_point"],
                    "qr_code_url": f"https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id={preference_id}"
                }
                
                logger.info(f"✅ QR de transferencia generado para pedido #{pedido.id}")
                
                return {
                    'success': True,
                    'preference_id': preference_id,
                    'qr_data': qr_data,
                    'init_point': preference_response["response"]["init_point"]
                }
            else:
                logger.error(f"❌ Error al generar QR: {preference_response}")
                return {
                    'success': False,
                    'error': 'No se pudo generar el QR de pago'
                }
                
        except Exception as e:
            logger.error(f"Exception in create_qr_for_transfer: {str(e)}")
            return {
                'success': False,
                'error': f'Error al generar QR: {str(e)}'
            }
