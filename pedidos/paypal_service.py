"""
Servicio para integración con PayPal
Maneja creación y ejecución de pagos en USD
"""
import paypalrestsdk
from django.conf import settings
from decimal import Decimal
import logging
import os

from .currency_service import CurrencyService

logger = logging.getLogger(__name__)


class PayPalService:
    """
    Servicio para integración con PayPal
    Similar a MercadoPagoService pero para pagos en USD
    """
    
    def __init__(self):
        # Configurar SDK de PayPal
        paypal_config = {
            "mode": settings.PAYPAL['MODE'],  # 'sandbox' o 'live'
            "client_id": settings.PAYPAL['CLIENT_ID'],
            "client_secret": settings.PAYPAL['CLIENT_SECRET']
        }
        
        paypalrestsdk.configure(paypal_config)
        
        # Log de configuración (sin exponer credenciales completas)
        client_id_preview = settings.PAYPAL['CLIENT_ID'][:15] + "..." if settings.PAYPAL['CLIENT_ID'] else "NONE"
        logger.info(f"🔑 PayPal SDK inicializado")
        logger.info(f"🔑 Modo: {settings.PAYPAL['MODE']}")
        logger.info(f"🔑 Client ID: {client_id_preview}")
        
        # Inicializar servicio de conversión
        self.currency_service = CurrencyService()
    
    def create_payment(self, pedido, request):
        """
        Crear pago en PayPal (en USD)
        
        Args:
            pedido: Objeto Pedido de Django
            request: Request HTTP
            
        Returns:
            dict: {
                'success': bool,
                'payment_id': str,
                'approval_url': str,
                'conversion_info': dict
            }
        """
        try:
            # URLs de retorno
            backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
            
            logger.info(f"💳 Creando pago PayPal para pedido #{pedido.id}")
            
            # Items del pedido (convertir a USD)
            items = []
            total_ars = Decimal('0.00')
            
            for item in pedido.items.all():
                # Convertir precio a USD
                conversion = self.currency_service.convert_ars_to_usd(item.precio)
                price_usd = conversion['amount_usd']
                
                items.append({
                    "name": item.producto.nombre[:127],  # PayPal limita a 127 caracteres
                    "sku": str(item.producto.id),
                    "price": str(price_usd),
                    "currency": "USD",
                    "quantity": item.cantidad
                })
                
                total_ars += item.precio * item.cantidad
                logger.info(f"  📦 {item.producto.nombre} x{item.cantidad}: ${item.precio} ARS → ${price_usd} USD")
            
            # Agregar costo de envío como item
            shipping_cost_ars = Decimal('0.00')
            shipping_name = ""
            
            # Determinar costo de envío
            tipo_envio_normalizado = str(pedido.tipo_envio).strip().lower() if pedido.tipo_envio else None
            
            if tipo_envio_normalizado == 'express':
                shipping_cost_ars = Decimal('10000')
                shipping_name = "Envío Express (2-4 horas)"
            elif tipo_envio_normalizado == 'programado':
                shipping_cost_ars = Decimal('5000')
                shipping_name = "Envío Programado"
            elif tipo_envio_normalizado == 'retiro':
                shipping_cost_ars = Decimal('0')
                shipping_name = "Retiro en tienda"
            elif pedido.metodo_envio and pedido.metodo_envio.costo > 0:
                shipping_cost_ars = Decimal(str(pedido.metodo_envio.costo))
                shipping_name = pedido.metodo_envio.nombre
            
            # Agregar envío si tiene costo
            if shipping_cost_ars > 0:
                shipping_conversion = self.currency_service.convert_ars_to_usd(shipping_cost_ars)
                shipping_usd = shipping_conversion['amount_usd']
                
                items.append({
                    "name": f"Envío - {shipping_name}",
                    "sku": "shipping",
                    "price": str(shipping_usd),
                    "currency": "USD",
                    "quantity": 1
                })
                
                total_ars += shipping_cost_ars
                logger.info(f"  🚚 {shipping_name}: ${shipping_cost_ars} ARS → ${shipping_usd} USD")
            
            # Calcular total en USD
            total_usd = sum(Decimal(item['price']) * item['quantity'] for item in items)
            total_usd = total_usd.quantize(Decimal('0.01'))  # Redondear a 2 decimales
            
            # Validar monto mínimo de PayPal ($0.01 USD)
            if total_usd < Decimal('0.01'):
                logger.error(f"❌ Monto muy bajo: ${total_usd} USD")
                return {
                    'success': False,
                    'error': 'El monto es demasiado bajo para procesar con PayPal (mínimo $0.01 USD)'
                }
            
            # Obtener información de conversión
            conversion_info = self.currency_service.get_conversion_info()
            
            logger.info(f"💰 Total: ${total_ars} ARS → ${total_usd} USD")
            logger.info(f"💱 Tasa efectiva: ${conversion_info['effective_rate']} ARS/USD")
            
            # Crear objeto de pago PayPal
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": f"{backend_url}/api/pedidos/{pedido.id}/payment/paypal/success/",
                    "cancel_url": f"{backend_url}/api/pedidos/{pedido.id}/payment/paypal/cancel/"
                },
                "transactions": [{
                    "item_list": {
                        "items": items
                    },
                    "amount": {
                        "total": str(total_usd),
                        "currency": "USD"
                    },
                    "description": f"Pedido #{pedido.numero_pedido} - Florería Cristina"
                }]
            })
            
            # Crear el pago
            logger.info("📤 Enviando solicitud a PayPal...")
            
            if payment.create():
                logger.info(f"✅ Pago PayPal creado exitosamente: {payment.id}")
                
                # Obtener URL de aprobación
                approval_url = None
                for link in payment.links:
                    if link.rel == "approval_url":
                        approval_url = link.href
                        logger.info(f"🔗 URL de aprobación: {approval_url}")
                        break
                
                if not approval_url:
                    logger.error("❌ No se encontró URL de aprobación")
                    return {
                        'success': False,
                        'error': 'No se pudo obtener URL de aprobación de PayPal'
                    }
                
                return {
                    'success': True,
                    'payment_id': payment.id,
                    'approval_url': approval_url,
                    'conversion_info': {
                        'total_ars': float(total_ars),
                        'total_usd': float(total_usd),
                        'official_rate': float(conversion_info['official_rate']),
                        'exchange_rate': float(conversion_info['official_rate']),
                        'effective_rate': float(conversion_info['effective_rate']),
                        'margin_percentage': float(conversion_info['margin_percentage'])
                    }
                }
            else:
                logger.error(f"❌ Error creando pago PayPal: {payment.error}")
                error_message = payment.error.get('message', 'Error desconocido') if hasattr(payment, 'error') else 'Error al crear pago'
                return {
                    'success': False,
                    'error': error_message
                }
                
        except Exception as e:
            logger.error(f"❌ Exception in create_payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
    
    def execute_payment(self, payment_id, payer_id):
        """
        Ejecutar pago después de la aprobación del usuario
        
        Args:
            payment_id (str): ID del pago de PayPal
            payer_id (str): ID del pagador
            
        Returns:
            dict: {
                'success': bool,
                'payment': Payment object o None,
                'error': str (si hay error)
            }
        """
        try:
            logger.info(f"⚡ Ejecutando pago PayPal: {payment_id}")
            
            payment = paypalrestsdk.Payment.find(payment_id)
            
            if payment.execute({"payer_id": payer_id}):
                logger.info(f"✅ Pago ejecutado exitosamente: {payment_id}")
                logger.info(f"💳 Estado: {payment.state}")
                
                return {
                    'success': True,
                    'payment': payment,
                    'state': payment.state
                }
            else:
                logger.error(f"❌ Error ejecutando pago: {payment.error}")
                error_message = payment.error.get('message', 'Error desconocido') if hasattr(payment, 'error') else 'Error al ejecutar pago'
                return {
                    'success': False,
                    'error': error_message
                }
                
        except Exception as e:
            logger.error(f"❌ Exception in execute_payment: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
    
    def get_payment_details(self, payment_id):
        """
        Obtener detalles de un pago
        
        Args:
            payment_id (str): ID del pago de PayPal
            
        Returns:
            dict: {
                'success': bool,
                'payment': Payment object o None,
                'error': str (si hay error)
            }
        """
        try:
            logger.info(f"🔍 Obteniendo detalles del pago: {payment_id}")
            
            payment = paypalrestsdk.Payment.find(payment_id)
            
            logger.info(f"✅ Pago encontrado: {payment.id} - Estado: {payment.state}")
            
            return {
                'success': True,
                'payment': payment,
                'state': payment.state
            }
            
        except Exception as e:
            logger.error(f"❌ Exception in get_payment_details: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
