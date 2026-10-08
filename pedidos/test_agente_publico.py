"""Canal público de pedidos para agentes: la solicitud no es un pedido.

Nada sale a internet en estos tests: Google Maps, Turnstile, GA4 y Meta están
simulados.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from catalogo.models import Categoria, Producto
from core import horario

from .models import Pedido, ShippingConfig, ShippingZone, SolicitudPedidoAgente

TIENDA = {'lat': -26.8192895, 'lng': -65.3062371}
DESTINO = {
    'lat': -26.8200000,
    'lng': -65.3070000,
    'resolved_address': 'Av. Aconquija 1234, Yerba Buena',
    'source': 'test',
}

URL_VALIDAR = '/api/publico/pedidos/validar'
URL_CREAR = '/api/publico/pedidos'


def crear_config():
    ShippingConfig.objects.create(
        store_name='Florería Cristina',
        store_address='Solano Vera 480',
        store_lat=Decimal(str(TIENDA['lat'])),
        store_lng=Decimal(str(TIENDA['lng'])),
        max_distance_express_km=Decimal('5'),
        max_distance_programado_km=Decimal('11'),
        use_distance_matrix=False,
    )
    ShippingZone.objects.create(
        shipping_method='express',
        zone_name='Yerba Buena Centro',
        min_distance_km=Decimal('0'),
        max_distance_km=Decimal('3'),
        base_price=Decimal('7000'),
        price_per_km=Decimal('0'),
        zone_order=1,
    )


def proxima_fecha():
    return horario.proxima_fecha_de_entrega(horario.ahora_local()).isoformat()


class CanalPublicoBase(TestCase):
    def setUp(self):
        cache.clear()
        crear_config()
        categoria = Categoria.objects.create(nombre='Ramos', slug='ramos')
        self.producto = Producto.objects.create(
            nombre='Ramo de rosas rojas',
            slug='ramo-rosas-rojas',
            sku='ROSAS-12',
            categoria=categoria,
            precio=Decimal('45000'),
            stock=10,
            is_active=True,
        )
        self.parche_geo = patch(
            'pedidos.services.pedido_agente.geocode_address', return_value=DESTINO
        )
        self.parche_geo.start()
        self.addCleanup(self.parche_geo.stop)
        self.parche_tracking = patch(
            'pedidos.services.pedido_agente.schedule_purchase_tracking'
        )
        self.tracking = self.parche_tracking.start()
        self.addCleanup(self.parche_tracking.stop)

    def entrada(self, **cambios):
        datos = {
            'items': [{'sku': 'ROSAS-12', 'cantidad': 1}],
            'entrega': {
                'metodo': 'express',
                'fecha': proxima_fecha(),
                'franja': 'tarde',
                'direccion': 'Av. Aconquija 1234',
                'ciudad': 'Yerba Buena',
            },
            'destinatario': {'nombre': 'Ana Pérez', 'telefono': '3815551234'},
            'comprador': {'nombre': 'Daniel', 'email': 'daniel@example.com', 'telefono': '3815559876'},
            'tarjeta': {'dedicatoria': 'Te quiero', 'firma': 'Daniel'},
            'medio_pago': 'mercadopago',
        }
        datos.update(cambios)
        return datos

    def crear_solicitud(self, **cambios):
        respuesta = self.client.post(URL_CREAR, self.entrada(**cambios), format='json', content_type='application/json')
        self.assertEqual(respuesta.status_code, 201, respuesta.json())
        return respuesta.json()


class ValidacionTests(CanalPublicoBase):
    def test_cotiza_con_el_precio_del_catalogo_y_el_envio_del_servidor(self):
        respuesta = self.client.post(URL_VALIDAR, self.entrada(), content_type='application/json')

        self.assertEqual(respuesta.status_code, 200, respuesta.json())
        cuerpo = respuesta.json()
        self.assertEqual(cuerpo['subtotal_productos'], 45000.0)
        self.assertEqual(cuerpo['envio']['costo'], 7000.0)
        self.assertEqual(cuerpo['total'], 52000.0)

    def test_ignora_el_precio_y_el_envio_que_manda_el_agente(self):
        entrada = self.entrada(items=[{'sku': 'ROSAS-12', 'cantidad': 1, 'precio_unitario': 1}])
        entrada['envio'] = {'costo': 0}

        cuerpo = self.client.post(URL_VALIDAR, entrada, content_type='application/json').json()

        self.assertEqual(cuerpo['total'], 52000.0)

    def test_rechaza_sin_stock_suficiente(self):
        respuesta = self.client.post(
            URL_VALIDAR, self.entrada(items=[{'sku': 'ROSAS-12', 'cantidad': 5}]),
            content_type='application/json',
        )
        self.producto.stock = 2
        self.producto.save()

        respuesta = self.client.post(
            URL_VALIDAR, self.entrada(items=[{'sku': 'ROSAS-12', 'cantidad': 5}]),
            content_type='application/json',
        )

        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()['errores'][0]['codigo'], 'sin_stock')

    def test_rechaza_sku_inexistente_y_fecha_pasada_en_una_sola_respuesta(self):
        entrada = self.entrada(items=[{'sku': 'NO-EXISTE', 'cantidad': 1}])
        entrada['entrega']['fecha'] = '2020-01-01'

        cuerpo = self.client.post(URL_VALIDAR, entrada, content_type='application/json').json()

        codigos = {error['codigo'] for error in cuerpo['errores']}
        self.assertIn('sku_inexistente', codigos)
        self.assertIn('fecha_pasada', codigos)

    def test_rechaza_efectivo_sin_retiro(self):
        respuesta = self.client.post(
            URL_VALIDAR, self.entrada(medio_pago='efectivo'), content_type='application/json',
        )

        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()['errores'][0]['codigo'], 'efectivo_sin_retiro')

    def test_rechaza_telefono_corto_y_email_invalido(self):
        entrada = self.entrada(
            comprador={'nombre': 'Daniel', 'email': 'no-es-mail', 'telefono': '123'},
        )

        cuerpo = self.client.post(URL_VALIDAR, entrada, content_type='application/json').json()

        campos = {error['campo'] for error in cuerpo['errores']}
        self.assertIn('comprador.email', campos)
        self.assertIn('comprador.telefono', campos)

    def test_retiro_en_tienda_no_cobra_envio_y_exige_hora(self):
        entrada = self.entrada()
        entrada['entrega'] = {
            'metodo': 'retiro', 'fecha': proxima_fecha(), 'hora_retiro': '10:30',
        }

        cuerpo = self.client.post(URL_VALIDAR, entrada, content_type='application/json').json()

        self.assertEqual(cuerpo['envio']['costo'], 0.0)
        self.assertEqual(cuerpo['total'], 45000.0)

    def test_retiro_fuera_de_horario(self):
        entrada = self.entrada()
        entrada['entrega'] = {
            'metodo': 'retiro', 'fecha': proxima_fecha(), 'hora_retiro': '23:00',
        }

        respuesta = self.client.post(URL_VALIDAR, entrada, content_type='application/json')

        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()['errores'][0]['codigo'], 'fuera_de_horario')

    def test_fuera_de_zona(self):
        with patch(
            'pedidos.services.pedido_agente.distance_from_store_km',
            return_value=(40.0, 'test'),
        ):
            respuesta = self.client.post(URL_VALIDAR, self.entrada(), content_type='application/json')

        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()['errores'][0]['codigo'], 'fuera_de_zona')

    def test_direccion_que_google_no_resuelve(self):
        with patch(
            'pedidos.services.pedido_agente.geocode_address',
            side_effect=ValueError('sin resultados'),
        ):
            respuesta = self.client.post(URL_VALIDAR, self.entrada(), content_type='application/json')

        self.assertEqual(respuesta.json()['errores'][0]['codigo'], 'direccion_no_encontrada')


class SolicitudTests(CanalPublicoBase):
    def test_la_solicitud_no_crea_pedido_ni_descuenta_stock(self):
        cuerpo = self.crear_solicitud()

        self.assertEqual(Pedido.objects.count(), 0)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 10)
        self.assertIn('/pedido/confirmar/', cuerpo['confirmar_url'])
        self.assertEqual(cuerpo['resumen']['total'], 52000.0)
        self.tracking.assert_not_called()

    def test_no_guarda_la_ip_en_claro(self):
        self.client.post(
            URL_CREAR, self.entrada(), content_type='application/json',
            REMOTE_ADDR='190.1.2.3',
        )

        solicitud = SolicitudPedidoAgente.objects.get()
        self.assertNotIn('190.1.2.3', solicitud.ip_hash)
        self.assertEqual(len(solicitud.ip_hash), 64)

    def test_idempotencia_devuelve_la_misma_solicitud(self):
        primera = self.client.post(
            URL_CREAR, self.entrada(), content_type='application/json',
            HTTP_IDEMPOTENCY_KEY='abc-123',
        ).json()
        segunda = self.client.post(
            URL_CREAR, self.entrada(), content_type='application/json',
            HTTP_IDEMPOTENCY_KEY='abc-123',
        ).json()

        self.assertEqual(primera['confirmar_url'], segunda['confirmar_url'])
        self.assertEqual(SolicitudPedidoAgente.objects.count(), 1)

    def test_estado_de_la_solicitud(self):
        cuerpo = self.crear_solicitud()
        token = cuerpo['estado_url'].rsplit('/', 1)[-1]

        respuesta = self.client.get(f'/api/publico/pedidos/solicitud/{token}')

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['estado'], 'pendiente')

    def test_token_inexistente(self):
        self.assertEqual(
            self.client.get('/api/publico/pedidos/solicitud/no-existe').status_code, 404,
        )


class ConfirmacionTests(CanalPublicoBase):
    def setUp(self):
        super().setUp()
        self.parche_turnstile = patch('pedidos.agente_views.verificar_turnstile', return_value=True)
        self.turnstile = self.parche_turnstile.start()
        self.addCleanup(self.parche_turnstile.stop)
        self.token = self.crear_solicitud()['estado_url'].rsplit('/', 1)[-1]

    def url(self):
        return f'/api/publico/pedidos/solicitud/{self.token}/confirmar'

    def confirmar(self):
        return self.client.post(
            self.url(), {'turnstile_token': 'ok'}, content_type='application/json',
        )

    def test_confirmar_crea_el_pedido_y_descuenta_stock(self):
        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, 201, respuesta.json())
        pedido = Pedido.objects.get()
        self.assertTrue(pedido.confirmado)
        self.assertEqual(pedido.canal, 'agente')
        self.assertEqual(pedido.total, Decimal('52000.00'))
        self.assertEqual(respuesta.json()['numero_pedido'], pedido.numero)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 9)

    def test_el_pedido_del_canal_publico_si_cuenta_como_compra(self):
        self.confirmar()

        self.tracking.assert_called_once_with(Pedido.objects.get().id)

    def test_sin_turnstile_no_hay_pedido(self):
        self.turnstile.return_value = False

        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, 403)
        self.assertEqual(Pedido.objects.count(), 0)

    def test_confirmar_dos_veces_devuelve_el_mismo_pedido(self):
        primera = self.confirmar().json()
        segunda = self.confirmar()

        self.assertEqual(segunda.status_code, 200)
        self.assertEqual(segunda.json()['numero_pedido'], primera['numero_pedido'])
        self.assertEqual(Pedido.objects.count(), 1)

    def test_solicitud_vencida(self):
        SolicitudPedidoAgente.objects.update(expira_en=timezone.now() - timedelta(minutes=1))

        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, 410)
        self.assertEqual(Pedido.objects.count(), 0)
        self.assertEqual(SolicitudPedidoAgente.objects.get().estado, 'vencida')

    def test_si_el_precio_subio_no_crea_el_pedido(self):
        self.producto.precio = Decimal('50000')
        self.producto.save()

        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, 409)
        self.assertEqual(Pedido.objects.count(), 0)
        self.assertEqual(respuesta.json()['resumen']['total'], 57000.0)

    def test_si_se_quedo_sin_stock_no_crea_el_pedido(self):
        self.producto.stock = 0
        self.producto.save()

        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, 409)
        self.assertEqual(Pedido.objects.count(), 0)


class VencimientoTests(CanalPublicoBase):
    def test_el_comando_vence_y_borra_los_datos_personales(self):
        from django.core.management import call_command

        self.crear_solicitud()
        SolicitudPedidoAgente.objects.update(
            expira_en=timezone.now() - timedelta(minutes=1),
            creado=timezone.now() - timedelta(days=8),
        )

        call_command('vencer_solicitudes_agente')

        solicitud = SolicitudPedidoAgente.objects.get()
        self.assertEqual(solicitud.estado, 'vencida')
        self.assertEqual(solicitud.datos, {})


class DisponibilidadTests(CanalPublicoBase):
    def test_disponibilidad_de_una_fecha_valida(self):
        respuesta = self.client.get(f'/api/publico/entrega/disponibilidad?fecha={proxima_fecha()}')

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(respuesta.json()['disponible'])

    def test_domingo_no_disponible(self):
        from datetime import date

        domingo = date(2026, 10, 11)
        respuesta = self.client.get(f'/api/publico/entrega/disponibilidad?fecha={domingo.isoformat()}')

        cuerpo = respuesta.json()
        self.assertFalse(cuerpo['disponible'])
        self.assertEqual(cuerpo['motivo'], 'fecha_cerrado')


class FichaPorSkuTests(CanalPublicoBase):
    def test_devuelve_la_ficha_con_precio_y_stock(self):
        cuerpo = self.client.get('/api/publico/productos/ROSAS-12').json()

        self.assertEqual(cuerpo['sku'], 'ROSAS-12')
        self.assertEqual(cuerpo['precio'], 45000.0)
        self.assertTrue(cuerpo['disponible'])

    def test_sku_inexistente(self):
        self.assertEqual(self.client.get('/api/publico/productos/NO-EXISTE').status_code, 404)

    def test_la_busqueda_sigue_funcionando(self):
        respuesta = self.client.get('/api/publico/productos?q=rosas')

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('productos', respuesta.json())


class AgenteSoloGetTests(CanalPublicoBase):
    """Asistentes que sólo pueden abrir URLs: ni JSON ni cabeceras propias."""

    def parametros(self, **cambios):
        datos = {
            'sku': 'ROSAS-12',
            'cantidad': '1',
            'metodo': 'express',
            'fecha': proxima_fecha(),
            'franja': 'tarde',
            'direccion': 'Av. Aconquija 1234',
            'ciudad': 'Yerba Buena',
            'destinatario': 'Ana Pérez',
            'destinatario_telefono': '3815551234',
            'comprador': 'Daniel',
            'email': 'daniel@example.com',
            'comprador_telefono': '3815559876',
            'dedicatoria': 'Te quiero',
        }
        datos.update(cambios)
        return datos

    def test_preparar_con_parametros_devuelve_el_link_de_confirmacion(self):
        respuesta = self.client.get('/api/publico/pedidos/preparar', self.parametros())

        self.assertEqual(respuesta.status_code, 201, respuesta.json())
        cuerpo = respuesta.json()
        self.assertIn('/es/pedido/confirmar/', cuerpo['confirmar_url'])
        self.assertEqual(cuerpo['resumen']['total'], 52000.0)
        self.assertEqual(Pedido.objects.count(), 0)
        self.assertEqual(Producto.objects.get(sku='ROSAS-12').stock, 10)

    def test_varios_productos_en_un_solo_parametro(self):
        cuerpo = self.client.get(
            '/api/publico/pedidos/preparar',
            self.parametros(items='ROSAS-12:2', sku=''),
        ).json()

        self.assertEqual(cuerpo['resumen']['items'][0]['cantidad'], 2)
        self.assertEqual(cuerpo['resumen']['total'], 97000.0)

    def test_los_datos_incompletos_devuelven_los_errores_en_castellano(self):
        respuesta = self.client.get(
            '/api/publico/pedidos/preparar', self.parametros(email='no-es-un-mail')
        )

        self.assertEqual(respuesta.status_code, 422)
        campos = [error['campo'] for error in respuesta.json()['errores']]
        self.assertIn('comprador.email', campos)

    def test_idempotencia_por_parametro(self):
        primera = self.client.get(
            '/api/publico/pedidos/preparar', self.parametros(idempotency_key='abc')
        ).json()
        segunda = self.client.get(
            '/api/publico/pedidos/preparar', self.parametros(idempotency_key='abc')
        ).json()

        self.assertEqual(primera['confirmar_url'], segunda['confirmar_url'])
        self.assertEqual(SolicitudPedidoAgente.objects.count(), 1)

    def test_validar_tambien_acepta_get(self):
        cuerpo = self.client.get(URL_VALIDAR, self.parametros()).json()

        self.assertTrue(cuerpo['valido'])
        self.assertEqual(cuerpo['total'], 52000.0)
        self.assertEqual(SolicitudPedidoAgente.objects.count(), 0)

    def test_get_sin_parametros_explica_como_usar_el_endpoint(self):
        respuesta = self.client.get(URL_CREAR)

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('ejemplo_json', respuesta.json())

    def test_get_con_parametros_en_la_ruta_del_post(self):
        respuesta = self.client.get(URL_CREAR, self.parametros())

        self.assertEqual(respuesta.status_code, 201, respuesta.json())
        self.assertIn('confirmar_url', respuesta.json())


class CorsApiPublicaTests(CanalPublicoBase):
    """Un agente que corre en un navegador necesita las cabeceras CORS."""

    def test_la_api_publica_responde_a_cualquier_origen(self):
        respuesta = self.client.get(
            '/api/publico/productos?q=rosas', HTTP_ORIGIN='https://chatgpt.com'
        )

        self.assertEqual(respuesta['Access-Control-Allow-Origin'], '*')

    def test_el_preflight_permite_post_con_idempotency_key(self):
        respuesta = self.client.options(
            URL_CREAR,
            HTTP_ORIGIN='https://chatgpt.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type,idempotency-key',
        )

        self.assertEqual(respuesta.status_code, 204)
        self.assertEqual(respuesta['Access-Control-Allow-Origin'], '*')
        self.assertIn('POST', respuesta['Access-Control-Allow-Methods'])
        self.assertIn('Idempotency-Key', respuesta['Access-Control-Allow-Headers'])

    def test_el_resto_del_sitio_sigue_con_la_lista_cerrada(self):
        respuesta = self.client.get('/api/pedidos/', HTTP_ORIGIN='https://ajeno.com')

        self.assertNotEqual(respuesta.get('Access-Control-Allow-Origin'), '*')
