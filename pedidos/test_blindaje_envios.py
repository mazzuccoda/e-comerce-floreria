"""Blindaje: configuración de envíos cerrada, caché de geocodificación
y costo de envío calculado en el servidor."""
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from catalogo.models import Categoria, Producto

from .models import MetodoEnvio, Pedido, ShippingConfig, ShippingZone
from .shipping_service import costo_envio_servidor, geocode_address

YERBA_BUENA = {'lat': -26.8192895, 'lng': -65.3062371}
CERCA = {'lat': -26.8200000, 'lng': -65.3070000, 'resolved_address': 'Av. Aconquija 1234', 'source': 'test'}


def crear_config():
    ShippingConfig.objects.create(
        store_name='Florería Cristina',
        store_address='Solano Vera 480',
        store_lat=Decimal(str(YERBA_BUENA['lat'])),
        store_lng=Decimal(str(YERBA_BUENA['lng'])),
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


class ConfiguracionEnviosCerradaTests(TestCase):
    """Cualquiera podía cambiar precios y zonas de envío sin loguearse."""

    def setUp(self):
        cache.clear()
        crear_config()

    def test_anonimo_no_puede_cambiar_la_configuracion(self):
        response = self.client.put(
            reverse('pedidos-api:shipping-config-update'),
            {'store_name': 'Hackeada'},
            content_type='application/json',
        )
        self.assertIn(response.status_code, (401, 403))
        self.assertEqual(ShippingConfig.get_config().store_name, 'Florería Cristina')

    def test_anonimo_no_puede_crear_zonas(self):
        response = self.client.post(
            reverse('pedidos-api:shipping-zone-save'),
            {'shipping_method': 'express', 'zone_name': 'Gratis', 'base_price': 0},
            content_type='application/json',
        )
        self.assertIn(response.status_code, (401, 403))

    def test_anonimo_no_puede_reinicializar_los_envios(self):
        response = self.client.post(reverse('pedidos-api:shipping-init'), content_type='application/json')
        self.assertIn(response.status_code, (401, 403))

    def test_administrador_si_puede(self):
        admin = get_user_model().objects.create_superuser(
            username='admin_envios', email='admin@test.local', password='clave-de-prueba'
        )
        self.client.force_login(admin)
        response = self.client.put(
            reverse('pedidos-api:shipping-config-update'),
            {'store_name': 'Florería Cristina Centro'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)

    def test_la_lectura_sigue_siendo_publica(self):
        response = self.client.get(reverse('pedidos-api:shipping-config'))
        self.assertEqual(response.status_code, 200)


class GeocodingCacheTests(TestCase):
    """Cada cotización cuesta dos llamadas pagas a Google."""

    def setUp(self):
        cache.clear()

    @patch('pedidos.shipping_service._google_api_key', return_value='clave-de-prueba')
    @patch('pedidos.shipping_service._geocode_google', return_value=CERCA)
    def test_la_misma_direccion_no_se_geocodifica_dos_veces(self, mock_google, _mock_key):
        geocode_address('Av. Aconquija 1234, Yerba Buena')
        geocode_address('av. aconquija 1234, yerba buena')
        self.assertEqual(mock_google.call_count, 1)


class CostoEnvioServidorTests(TestCase):
    def setUp(self):
        cache.clear()
        crear_config()

    def test_retiro_no_paga_envio(self):
        self.assertEqual(costo_envio_servidor('retiro', 'Solano Vera 480'), Decimal('0.00'))

    @patch('pedidos.shipping_service.geocode_address', return_value=CERCA)
    def test_cotiza_la_zona_que_corresponde(self, _mock_geocode):
        self.assertEqual(costo_envio_servidor('express', 'Av. Aconquija 1234'), Decimal('7000'))

    @patch('pedidos.shipping_service.geocode_address', side_effect=Exception('sin red'))
    def test_sin_direccion_no_devuelve_costo(self, _mock_geocode):
        self.assertIsNone(costo_envio_servidor('express', ''))


class CheckoutCostoEnvioTests(TestCase):
    """El navegador podía mandar envío $0 y el servidor lo aceptaba."""

    def setUp(self):
        cache.clear()
        crear_config()
        categoria = Categoria.objects.create(nombre='Ramos', slug='ramos')
        self.producto = Producto.objects.create(
            nombre='Ramo de rosas',
            slug='ramo-de-rosas',
            categoria=categoria,
            precio=Decimal('45000'),
            stock=10,
        )
        self.metodo = MetodoEnvio.objects.create(nombre='Express', costo=Decimal('7000'))
        self.url = reverse('pedidos-api:checkout-with-items')

    def _payload(self, costo_envio):
        return {
            'nombre_comprador': 'Daniel',
            'email_comprador': 'daniel@test.local',
            'telefono_comprador': '3811111111',
            'nombre_destinatario': 'Ana',
            'telefono_destinatario': '3812222222',
            'direccion': 'Av. Aconquija 1234',
            'ciudad': 'Yerba Buena',
            'fecha_entrega': '2030-01-10',
            'franja_horaria': 'tarde',
            'metodo_envio_id': self.metodo.id,
            'metodo_envio': 'express',
            'costo_envio': costo_envio,
            'items': [{'producto_id': self.producto.id, 'cantidad': 1}],
        }

    @patch('pedidos.shipping_service.geocode_address', return_value=CERCA)
    def test_ignora_el_costo_de_envio_del_navegador(self, _mock_geocode):
        response = self.client.post(self.url, self._payload(0), content_type='application/json')
        self.assertEqual(response.status_code, 200, response.content)

        pedido = Pedido.objects.latest('id')
        self.assertEqual(pedido.costo_envio, Decimal('7000'))
        self.assertEqual(pedido.total, Decimal('52000'))

    @patch('pedidos.shipping_service.geocode_address', side_effect=Exception('sin red'))
    def test_si_no_puede_cotizar_conserva_el_costo_informado(self, _mock_geocode):
        response = self.client.post(self.url, self._payload(7000), content_type='application/json')
        self.assertEqual(response.status_code, 200, response.content)

        pedido = Pedido.objects.latest('id')
        self.assertEqual(pedido.costo_envio, Decimal('7000'))
