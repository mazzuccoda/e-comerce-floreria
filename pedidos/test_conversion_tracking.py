"""Tests del tracking de compras server-side (GA4 + Meta CAPI). El HTTP siempre está mockeado."""
import hashlib
import json
from datetime import timedelta
from io import StringIO
from unittest.mock import MagicMock, patch

import requests
from django.core.management import call_command
from django.db import transaction
from django.test import TestCase, override_settings
from django.utils import timezone

from catalogo.models import Categoria, Producto

from .models import MetodoEnvio, Pedido, PedidoItem
from .services import conversion_tracking
from .services.conversion_tracking import (
    build_ga4_payload,
    build_meta_payload,
    normalize_phone_ar,
    schedule_purchase_tracking,
    track_order_purchase,
)

GA4_URL = 'https://www.google-analytics.com/mp/collect'

CREDENCIALES = dict(
    GA4_MEASUREMENT_ID='G-TEST123',
    GA4_API_SECRET='secreto-ga',
    FACEBOOK_PIXEL_ID='2362234944085088',
    META_CAPI_ACCESS_TOKEN='token-meta',
    META_GRAPH_API_VERSION='v21.0',
    META_CAPI_TEST_EVENT_CODE='',
)


def respuesta(status):
    mock = MagicMock()
    mock.status_code = status
    return mock


def respuesta_ok(url, **kwargs):
    return respuesta(204 if url == GA4_URL else 200)


class TrackingBase(TestCase):
    def setUp(self):
        categoria = Categoria.objects.create(nombre='Ramos de flores', slug='ramos-de-flores')
        self.producto = Producto.objects.create(
            nombre='Mix único 🌻', categoria=categoria, precio=45000, sku='10001', stock=50,
        )
        self.metodo_envio = MetodoEnvio.objects.create(nombre='Envío', costo=0)
        patcher = patch('pedidos.services.conversion_tracking.requests.post', side_effect=respuesta_ok)
        self.post = patcher.start()
        self.addCleanup(patcher.stop)
        # Las notificaciones del pedido no son parte de estos tests.
        notif = patch('notificaciones.services.notificacion_service.enviar_notificacion_pedido', return_value=None)
        notif.start()
        self.addCleanup(notif.stop)

    # -- helpers -----------------------------------------------------------

    def crear_pedido(self, medio_pago='transferencia', confirmar=True, **extra):
        pedido = Pedido.objects.create(
            nombre_comprador='Ana',
            email_comprador='  Ana@Example.com ',
            telefono_comprador='381 15 477-8577',
            nombre_destinatario='Beto',
            telefono_destinatario='3814000000',
            direccion='Av. Aconquija 1500',
            fecha_entrega=timezone.localdate(),
            franja_horaria='mañana',
            dedicatoria='',
            medio_pago=medio_pago,
            total=52000,
            costo_envio=7000,
            **extra,
        )
        PedidoItem.objects.create(pedido=pedido, producto=self.producto, cantidad=1, precio=45000)
        if confirmar:
            pedido.confirmar_pedido()
        return pedido

    def checkout(self, medio_pago='transferencia', **extra):
        payload = {
            'nombre_comprador': 'Ana',
            'email_comprador': 'ana@example.com',
            'telefono_comprador': '3814778577',
            'nombre_destinatario': 'Beto',
            'telefono_destinatario': '3814000000',
            'direccion': 'Av. Aconquija 1500',
            'fecha_entrega': timezone.localdate().isoformat(),
            'franja_horaria': 'mañana',
            'metodo_envio_id': self.metodo_envio.id,
            'metodo_envio': 'express',
            'costo_envio': 7000,
            'medio_pago': medio_pago,
            'items': [{'producto_id': self.producto.id, 'cantidad': 1}],
            'tracking': {
                'ga_client_id': '123.456',
                'ga_session_id': '1790000000',
                'fbp': 'fb.1.1790000000000.111',
                'fbc': 'fb.1.1790000000000.abc',
                'event_source_url': 'https://floreriacristina.com.ar/es/checkout/multistep',
                'otra_cosa': 'se descarta',
            },
            **extra,
        }
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                '/api/pedidos/checkout-with-items/',
                data=json.dumps(payload),
                content_type='application/json',
                HTTP_X_FORWARDED_FOR='200.1.2.3, 10.0.0.1',
                HTTP_USER_AGENT='Mozilla/5.0 test',
            )
        self.assertEqual(response.status_code, 200, response.content)
        return Pedido.objects.get(pk=response.json()['pedido_id'])

    def urls_enviadas(self):
        return [call.args[0] for call in self.post.call_args_list]

    def envios_ga4(self):
        return [c for c in self.post.call_args_list if c.args[0] == GA4_URL]

    def envios_meta(self):
        return [c for c in self.post.call_args_list if 'graph.facebook.com' in c.args[0]]

    def webhook_mp(self, pedido, status):
        resultado = {'success': True, 'external_reference': str(pedido.id), 'status': status}
        with patch('pedidos.payment_views.MercadoPagoService') as servicio:
            servicio.return_value.process_webhook_notification.return_value = resultado
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    '/api/pedidos/webhook/mercadopago/', data='{}', content_type='application/json'
                )
        self.assertEqual(response.status_code, 200)


@override_settings(**CREDENCIALES)
class ReglaDeCompraTests(TrackingBase):
    def test_1_transferencia_confirmada_envia_a_ga4_y_meta_con_pago_pendiente(self):
        pedido = self.checkout('transferencia')
        self.assertEqual(pedido.estado_pago, 'pendiente')
        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 1)
        pedido.refresh_from_db()
        self.assertIsNotNone(pedido.ga_purchase_sent_at)
        self.assertIsNotNone(pedido.meta_purchase_sent_at)
        self.assertIsNotNone(pedido.conversion_at)

    def test_2_efectivo_con_retiro_envia(self):
        pedido = self.checkout('efectivo', metodo_envio='retiro')
        self.assertEqual(pedido.medio_pago, 'efectivo')
        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 1)

    def test_3_mercadopago_solo_envia_al_aprobarse_y_una_vez(self):
        pedido = self.checkout('mercadopago')
        self.assertEqual(self.post.call_count, 0)

        self.webhook_mp(pedido, 'approved')
        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 1)

        self.webhook_mp(pedido, 'approved')
        self.assertEqual(self.post.call_count, 2)

    def test_4_mercadopago_abandonado_no_envia(self):
        self.checkout('mercadopago')
        call_command('reenviar_conversiones', stdout=StringIO())
        self.assertEqual(self.post.call_count, 0)

    def test_retorno_de_mercadopago_aprobado_envia_y_redirige_con_estado_verificado(self):
        pedido = self.checkout('mercadopago')
        with patch('pedidos.payment_views.MercadoPagoService') as servicio:
            servicio.return_value.get_payment_info.return_value = {'success': True, 'payment': {'status': 'approved'}}
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.get(f'/api/pedidos/{pedido.id}/payment/success/?payment_id=99')
        self.assertIn('payment=success', response['Location'])
        self.assertEqual(self.post.call_count, 2)

        # El webhook que llega después no duplica la compra.
        self.webhook_mp(pedido, 'approved')
        self.assertEqual(self.post.call_count, 2)

    def test_retorno_de_mercadopago_pendiente_no_dice_success(self):
        pedido = self.checkout('mercadopago')
        with patch('pedidos.payment_views.MercadoPagoService') as servicio:
            servicio.return_value.get_payment_info.return_value = {'success': True, 'payment': {'status': 'in_process'}}
            response = self.client.get(f'/api/pedidos/{pedido.id}/payment/success/?payment_id=99')
        self.assertIn('payment=pending', response['Location'])
        self.assertEqual(self.post.call_count, 0)

    def test_5_paypal_exitoso_envia_una_vez(self):
        pedido = self.checkout('paypal')
        with patch('pedidos.paypal_service.PayPalService') as servicio:
            servicio.return_value.execute_payment.return_value = {'success': True}
            for _ in range(2):
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.get(
                        f'/api/pedidos/{pedido.id}/payment/paypal/success/?paymentId=PAY-1&PayerID=P1'
                    )
                self.assertIn('payment=success', response['Location'])
        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 1)

    def test_5_paypal_fallido_no_envia_y_redirige_con_error(self):
        pedido = self.checkout('paypal')
        with patch('pedidos.paypal_service.PayPalService') as servicio:
            servicio.return_value.execute_payment.return_value = {'success': False, 'error': 'x'}
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.get(
                    f'/api/pedidos/{pedido.id}/payment/paypal/success/?paymentId=PAY-1&PayerID=P1'
                )
        self.assertIn('payment=error', response['Location'])
        self.assertEqual(self.post.call_count, 0)

    def test_6_webhook_rechazado_repetido_restaura_stock_una_vez(self):
        pedido = self.checkout('mercadopago')
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 49)

        self.webhook_mp(pedido, 'rejected')
        self.webhook_mp(pedido, 'rejected')
        self.producto.refresh_from_db()
        pedido.refresh_from_db()
        self.assertEqual(self.producto.stock, 50)
        self.assertFalse(pedido.confirmado)
        self.assertEqual(pedido.estado_pago, 'rejected')
        self.assertEqual(self.post.call_count, 0)

    def test_aprobado_despues_de_un_rechazo_vuelve_a_descontar_stock(self):
        pedido = self.checkout('mercadopago')
        self.webhook_mp(pedido, 'rejected')
        self.webhook_mp(pedido, 'approved')
        self.producto.refresh_from_db()
        pedido.refresh_from_db()
        self.assertEqual(self.producto.stock, 49)
        self.assertTrue(pedido.confirmado)
        self.assertEqual(self.post.call_count, 2)

    def test_11_pedido_cancelado_o_no_confirmado_no_envia(self):
        no_confirmado = self.crear_pedido(confirmar=False)
        cancelado = self.crear_pedido()
        cancelado.cancelar_pedido()
        track_order_purchase(no_confirmado.id)
        track_order_purchase(cancelado.id)
        self.assertEqual(self.post.call_count, 0)


@override_settings(**CREDENCIALES)
class FallasTests(TrackingBase):
    def test_7_error_de_ga4_no_rompe_el_checkout_y_meta_se_registra(self):
        def post(url, **kwargs):
            if url == GA4_URL:
                raise requests.Timeout()
            return respuesta(200)

        self.post.side_effect = post
        pedido = self.checkout('transferencia')
        pedido.refresh_from_db()
        self.assertIsNone(pedido.ga_purchase_sent_at)
        self.assertIsNotNone(pedido.meta_purchase_sent_at)

    def test_8_error_de_meta_no_rompe_el_checkout_y_ga4_se_registra(self):
        self.post.side_effect = lambda url, **kwargs: respuesta(204 if url == GA4_URL else 400)
        pedido = self.checkout('transferencia')
        pedido.refresh_from_db()
        self.assertIsNotNone(pedido.ga_purchase_sent_at)
        self.assertIsNone(pedido.meta_purchase_sent_at)

    def test_9_llamadas_superpuestas_envian_una_vez_por_destino(self):
        pedido = self.crear_pedido()
        reentradas = []

        def post(url, **kwargs):
            # Mientras un envío está en curso, otro proceso intenta lo mismo.
            if not reentradas:
                reentradas.append(url)
                track_order_purchase(pedido.id)
            return respuesta_ok(url)

        self.post.side_effect = post
        track_order_purchase(pedido.id)
        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 1)

    def test_10_checkout_que_falla_antes_del_commit_no_envia(self):
        pedido = self.crear_pedido()
        with self.captureOnCommitCallbacks(execute=True):
            try:
                with transaction.atomic():
                    schedule_purchase_tracking(pedido.id)
                    raise RuntimeError('falla antes del commit')
            except RuntimeError:
                pass
        self.assertEqual(self.post.call_count, 0)

    def test_checkout_de_producto_inexistente_no_envia(self):
        with self.assertRaises(AssertionError):  # el checkout responde 400
            self.checkout('transferencia', items=[{'producto_id': 999999, 'cantidad': 1}])
        self.assertEqual(self.post.call_count, 0)

    def test_sin_credenciales_no_envia_ni_marca(self):
        with override_settings(GA4_API_SECRET='', META_CAPI_ACCESS_TOKEN=''):
            pedido = self.checkout('transferencia')
        pedido.refresh_from_db()
        self.assertEqual(self.post.call_count, 0)
        self.assertIsNone(pedido.ga_purchase_sent_at)
        self.assertIsNone(pedido.meta_purchase_sent_at)
        self.assertIsNotNone(pedido.conversion_at)

        # Cuando se cargan las credenciales, el cron lo envía.
        call_command('reenviar_conversiones', stdout=StringIO())
        self.assertEqual(self.post.call_count, 2)


@override_settings(**CREDENCIALES)
class PayloadTests(TrackingBase):
    def test_12_payload_de_meta(self):
        pedido = self.checkout('transferencia')
        body = self.envios_meta()[0].kwargs['json']
        evento = body['data'][0]
        user_data = evento['user_data']

        self.assertEqual(evento['event_id'], f'order_{pedido.numero_pedido}')
        self.assertEqual(evento['custom_data']['content_ids'], ['10001'])
        self.assertEqual(evento['custom_data']['order_id'], pedido.numero_pedido)
        self.assertEqual(user_data['em'], [hashlib.sha256(b'ana@example.com').hexdigest()])
        self.assertEqual(user_data['ph'], [hashlib.sha256(b'5493814778577').hexdigest()])
        self.assertEqual(user_data['fbp'], 'fb.1.1790000000000.111')
        self.assertEqual(user_data['client_ip_address'], '200.1.2.3')
        self.assertEqual(user_data['client_user_agent'], 'Mozilla/5.0 test')
        texto = json.dumps(body)
        self.assertNotIn('ana@example.com', texto)
        self.assertNotIn('3814778577', texto)
        self.assertNotIn('test_event_code', body)
        self.assertEqual(self.envios_meta()[0].kwargs['timeout'], 3)

    def test_12_meta_incluye_test_event_code_solo_si_existe(self):
        pedido = self.crear_pedido()
        pedido.conversion_at = timezone.now()
        with override_settings(META_CAPI_TEST_EVENT_CODE='TEST72465'):
            self.assertEqual(build_meta_payload(pedido)['test_event_code'], 'TEST72465')

    def test_13_payload_de_ga4(self):
        pedido = self.checkout('transferencia')
        llamada = self.envios_ga4()[0]
        body = llamada.kwargs['json']
        params = body['events'][0]['params']

        self.assertEqual(body['client_id'], '123.456')
        self.assertEqual(body['events'][0]['name'], 'purchase')
        self.assertEqual(params['transaction_id'], pedido.numero_pedido)
        self.assertEqual(params['session_id'], '1790000000')
        self.assertEqual(params['items'][0]['item_id'], str(self.producto.id))
        self.assertEqual(params['items'][0]['item_name'], 'Mix único')
        self.assertEqual(params['shipping'], 7000.0)
        self.assertEqual(params['payment_type'], 'transferencia')
        self.assertEqual(llamada.kwargs['params']['measurement_id'], 'G-TEST123')
        self.assertEqual(body['timestamp_micros'], int(pedido.conversion_at.timestamp() * 1_000_000))

    def test_ga4_sin_client_id_usa_uno_sintetico(self):
        pedido = self.crear_pedido()
        pedido.conversion_at = timezone.now()
        payload, sintetico = build_ga4_payload(pedido)
        self.assertTrue(sintetico)
        self.assertEqual(payload['client_id'], f'srv.{pedido.id}')

    def test_tracking_context_filtra_claves(self):
        pedido = self.checkout('transferencia')
        self.assertNotIn('otra_cosa', pedido.tracking_context)
        self.assertEqual(pedido.tracking_context['ga_client_id'], '123.456')

    def test_normalizacion_de_telefonos_argentinos(self):
        for entrada in ('381 15 477-8577', '+54 9 381 477-8577', '0381 4778577', '3814778577', '543814778577'):
            self.assertEqual(normalize_phone_ar(entrada), '5493814778577', entrada)
        self.assertEqual(normalize_phone_ar('11 15 1234-5678'), '5491112345678')
        self.assertIsNone(normalize_phone_ar('123'))
        self.assertIsNone(normalize_phone_ar(''))


@override_settings(**CREDENCIALES)
class ReenviarConversionesTests(TrackingBase):
    def test_14_reenvia_solo_destinos_pendientes_dentro_de_la_ventana(self):
        reciente = self.crear_pedido()
        Pedido.objects.filter(pk=reciente.pk).update(
            conversion_at=timezone.now() - timedelta(hours=2), meta_purchase_sent_at=timezone.now()
        )
        viejo = self.crear_pedido()
        Pedido.objects.filter(pk=viejo.pk).update(conversion_at=timezone.now() - timedelta(hours=80))
        Pedido.objects.filter(pk=viejo.pk).update(actualizado=timezone.now() - timedelta(hours=80))

        call_command('reenviar_conversiones', '--horas', '72', stdout=StringIO())

        self.assertEqual(len(self.envios_ga4()), 1)
        self.assertEqual(len(self.envios_meta()), 0)
        self.assertEqual(
            self.envios_ga4()[0].kwargs['json']['events'][0]['params']['transaction_id'], reciente.numero_pedido
        )

    def test_ga4_no_envia_conversiones_de_mas_de_72_horas(self):
        pedido = self.crear_pedido()
        Pedido.objects.filter(pk=pedido.pk).update(conversion_at=timezone.now() - timedelta(hours=100))
        track_order_purchase(pedido.id)
        self.assertEqual(len(self.envios_ga4()), 0)
        self.assertEqual(len(self.envios_meta()), 1)


class LogsTests(TrackingBase):
    def test_logs_no_incluyen_datos_personales(self):
        with override_settings(**CREDENCIALES):
            with self.assertLogs(conversion_tracking.logger, level='INFO') as logs:
                pedido = self.checkout('transferencia')
        salida = '\n'.join(logs.output)
        self.assertIn(f'TRACKING GA4  pedido={pedido.numero_pedido} sent', salida)
        self.assertIn(f'TRACKING META pedido={pedido.numero_pedido} sent', salida)
        for dato in ('ana@example.com', '3814778577', '200.1.2.3', 'token-meta', 'secreto-ga'):
            self.assertNotIn(dato, salida)

    def test_sin_configurar_loguea_skipped_not_configured(self):
        with override_settings(GA4_MEASUREMENT_ID='', GA4_API_SECRET='', META_CAPI_ACCESS_TOKEN=''):
            with self.assertLogs(conversion_tracking.logger, level='INFO') as logs:
                self.checkout('transferencia')
        self.assertTrue(any('skipped_not_configured' in linea for linea in logs.output))


@override_settings(**CREDENCIALES)
class ValidarGa4Tests(TrackingBase):
    def test_validar_ga4_usa_el_endpoint_debug_y_no_marca_el_pedido(self):
        pedido = self.crear_pedido()
        debug = respuesta(200)
        debug.json.return_value = {'validationMessages': []}
        self.post.side_effect = None
        self.post.return_value = debug
        salida = StringIO()
        call_command('reenviar_conversiones', '--validar-ga4', pedido.numero_pedido, stdout=salida)
        self.assertIn('aceptó', salida.getvalue())
        self.assertEqual(self.post.call_args.args[0], conversion_tracking.GA4_DEBUG_URL)
        pedido.refresh_from_db()
        self.assertIsNone(pedido.ga_purchase_sent_at)
