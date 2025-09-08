from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
import json
import logging

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
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Obtener parámetros de MP
            payment_id = request.GET.get('payment_id')
            status_mp = request.GET.get('status')
            merchant_order_id = request.GET.get('merchant_order_id')
            
            # Si hay payment_id, obtener información del pago
            payment_info = None
            if payment_id:
                mp_service = MercadoPagoService()
                payment_result = mp_service.get_payment_info(payment_id)
                
                if payment_result['success']:
                    payment_info = payment_result['payment']
            
            return Response({
                'success': True,
                'pedido': PedidoReadSerializer(pedido).data,
                'payment_id': payment_id,
                'status': status_mp,
                'merchant_order_id': merchant_order_id,
                'payment_info': payment_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in payment success: {str(e)}")
            return Response({
                'error': 'Error al procesar el pago exitoso'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentFailureView(APIView):
    """
    Vista para manejar el retorno fallido de Mercado Pago
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            return Response({
                'success': False,
                'pedido': PedidoReadSerializer(pedido).data,
                'message': 'El pago no pudo ser procesado'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in payment failure: {str(e)}")
            return Response({
                'error': 'Error al procesar el pago fallido'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentPendingView(APIView):
    """
    Vista para manejar el retorno pendiente de Mercado Pago
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            return Response({
                'success': True,
                'pedido': PedidoReadSerializer(pedido).data,
                'message': 'El pago está siendo procesado'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in payment pending: {str(e)}")
            return Response({
                'error': 'Error al procesar el pago pendiente'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
