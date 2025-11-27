from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404, redirect
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.conf import settings
import json
import logging
import os

from .models import Pedido
from .mercadopago_service import MercadoPagoService
from .serializers import PedidoReadSerializer

logger = logging.getLogger(__name__)


class CreatePaymentView(APIView):
    """
    Vista para crear preferencia de pago con Mercado Pago
    """
    permission_classes = [AllowAny]
    
    def post(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Verificar que el pedido esté en estado correcto
            if pedido.estado_pago != 'pendiente':
                return Response({
                    'error': 'El pedido ya ha sido procesado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear preferencia en Mercado Pago
            mp_service = MercadoPagoService()
            preference_result = mp_service.create_preference(pedido, request)
            
            if preference_result['success']:
                return Response({
                    'success': True,
                    'preference_id': preference_result['preference_id'],
                    'init_point': preference_result['init_point'],
                    'sandbox_init_point': preference_result.get('sandbox_init_point'),
                    'pedido': PedidoReadSerializer(pedido).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': preference_result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class MercadoPagoWebhookView(APIView):
    """
    Vista para recibir webhooks de Mercado Pago
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Log de la notificación recibida
            logger.info(f"Webhook received: {request.body}")
            
            # Parsear datos del webhook
            try:
                notification_data = json.loads(request.body)
            except json.JSONDecodeError:
                notification_data = request.data
            
            # Procesar notificación
            mp_service = MercadoPagoService()
            result = mp_service.process_webhook_notification(notification_data)
            
            if result['success']:
                # Buscar el pedido correspondiente
                external_reference = result.get('external_reference')
                
                if external_reference:
                    try:
                        pedido = Pedido.objects.get(id=int(external_reference))
                        
                        # Actualizar estado del pedido según el pago
                        payment_status = result.get('status')
                        
                        with transaction.atomic():
                            if payment_status == 'approved':
                                pedido.estado_pago = 'approved'
                                pedido.confirmado = True
                                logger.info(f"Pedido {pedido.id} aprobado")
                                
                            elif payment_status == 'rejected':
                                pedido.estado_pago = 'rejected'
                                # Restaurar stock si el pago fue rechazado
                                for item in pedido.items.all():
                                    item.producto.stock += item.cantidad
                                    item.producto.save()
                                logger.info(f"Pedido {pedido.id} rechazado, stock restaurado")
                                
                            elif payment_status in ['pending', 'in_process']:
                                pedido.estado_pago = 'pendiente'
                                logger.info(f"Pedido {pedido.id} pendiente")
                            
                            pedido.save()
                        
                        return HttpResponse("OK", status=200)
                        
                    except Pedido.DoesNotExist:
                        logger.error(f"Pedido no encontrado: {external_reference}")
                        return HttpResponse("Pedido no encontrado", status=404)
                    
                    except ValueError:
                        logger.error(f"External reference inválido: {external_reference}")
                        return HttpResponse("Reference inválido", status=400)
            
            return HttpResponse("OK", status=200)
            
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return HttpResponse("Error interno", status=500)


class PaymentSuccessView(APIView):
    """
    Vista para manejar el retorno exitoso de Mercado Pago
    Redirige al frontend con los parámetros del pago
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Obtener parámetros de MP
            payment_id = request.GET.get('payment_id')
            status_mp = request.GET.get('status')
            merchant_order_id = request.GET.get('merchant_order_id')
            
            logger.info(f"✅ Pago exitoso para pedido #{pedido_id}")
            logger.info(f"💳 Payment ID: {payment_id}, Status: {status_mp}")
            
            # Si hay payment_id, actualizar estado del pedido
            if payment_id:
                mp_service = MercadoPagoService()
                payment_result = mp_service.get_payment_info(payment_id)
                
                if payment_result['success']:
                    payment_info = payment_result['payment']
                    # Actualizar estado del pedido según el estado del pago
                    if payment_info.get('status') == 'approved':
                        pedido.estado_pago = 'aprobado'
                        pedido.save()
                        logger.info(f"✅ Pedido #{pedido_id} marcado como aprobado")
            
            # Redirigir al frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=success&payment_id={payment_id or ''}"
            
            logger.info(f"🔄 Redirigiendo a: {redirect_url}")
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"❌ Error in payment success: {str(e)}")
            # En caso de error, redirigir al frontend con error
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            return redirect(f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=error")


class PaymentFailureView(APIView):
    """
    Vista para manejar el retorno fallido de Mercado Pago
    Redirige al frontend con el estado de fallo
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            logger.warning(f"⚠️ Pago fallido para pedido #{pedido_id}")
            
            # Redirigir al frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=failure"
            
            logger.info(f"🔄 Redirigiendo a: {redirect_url}")
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"❌ Error in payment failure: {str(e)}")
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            return redirect(f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=error")


class PaymentPendingView(APIView):
    """
    Vista para manejar el retorno pendiente de Mercado Pago
    Redirige al frontend con el estado pendiente
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            logger.info(f"⏳ Pago pendiente para pedido #{pedido_id}")
            
            # Redirigir al frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=pending"
            
            logger.info(f"🔄 Redirigiendo a: {redirect_url}")
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"❌ Error in payment pending: {str(e)}")
            frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
            return redirect(f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=error")


# ==============================================================================
# PAYPAL PAYMENT VIEWS
# ==============================================================================

class CreatePayPalPaymentView(APIView):
    """
    Vista para crear pago con PayPal (en USD)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, pedido_id):
        try:
            from .paypal_service import PayPalService
            
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Verificar que el pedido esté en estado correcto
            if pedido.estado_pago != 'pendiente':
                return Response({
                    'error': 'El pedido ya ha sido procesado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear pago en PayPal
            paypal_service = PayPalService()
            payment_result = paypal_service.create_payment(pedido, request)
            
            if payment_result['success']:
                logger.info(f"✅ Pago PayPal creado para pedido #{pedido_id}")
                return Response({
                    'success': True,
                    'payment_id': payment_result['payment_id'],
                    'approval_url': payment_result['approval_url'],
                    'conversion_info': payment_result['conversion_info'],
                    'pedido': PedidoReadSerializer(pedido).data
                }, status=status.HTTP_200_OK)
            else:
                logger.error(f"❌ Error creando pago PayPal: {payment_result.get('error')}")
                return Response({
                    'error': payment_result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"❌ Error creating PayPal payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayPalSuccessView(APIView):
    """
    Vista para manejar el retorno exitoso de PayPal
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            from .paypal_service import PayPalService
            
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Obtener parámetros de PayPal
            payment_id = request.GET.get('paymentId')
            payer_id = request.GET.get('PayerID')
            
            logger.info(f"✅ Retorno exitoso de PayPal para pedido #{pedido_id}")
            logger.info(f"💳 Payment ID: {payment_id}, Payer ID: {payer_id}")
            
            if payment_id and payer_id:
                # Ejecutar el pago
                paypal_service = PayPalService()
                execute_result = paypal_service.execute_payment(payment_id, payer_id)
                
                if execute_result['success']:
                    # Actualizar estado del pedido
                    with transaction.atomic():
                        pedido.estado_pago = 'aprobado'
                        pedido.confirmado = True
                        pedido.save()
                        logger.info(f"✅ Pedido #{pedido_id} marcado como aprobado (PayPal)")
                else:
                    logger.error(f"❌ Error ejecutando pago PayPal: {execute_result.get('error')}")
            
            # Redirigir al frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
            redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=success&payment_id={payment_id or ''}&provider=paypal"
            
            logger.info(f"🔄 Redirigiendo a: {redirect_url}")
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"❌ Error in PayPal success: {str(e)}")
            import traceback
            traceback.print_exc()
            frontend_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
            return redirect(f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=error")


class PayPalCancelView(APIView):
    """
    Vista para manejar la cancelación de PayPal
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            logger.warning(f"⚠️ Pago PayPal cancelado para pedido #{pedido_id}")
            
            # Redirigir a la página de éxito con parámetro de cancelación (igual que MercadoPago)
            frontend_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
            redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=cancelled&provider=paypal"
            
            logger.info(f"🔄 Redirigiendo a: {redirect_url}")
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"❌ Error in PayPal cancel: {str(e)}")
            frontend_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
            return redirect(f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=error&provider=paypal")
