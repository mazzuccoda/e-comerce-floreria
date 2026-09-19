from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from .models import ShippingConfig, ShippingZone

YERBA_BUENA = {'lat': -26.8192895, 'lng': -65.3062371}


class ShippingQuoteTests(TestCase):
    def setUp(self):
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
        ShippingZone.objects.create(
            shipping_method='programado',
            zone_name='San Miguel Centro',
            min_distance_km=Decimal('5'),
            max_distance_km=Decimal('8'),
            base_price=Decimal('7000'),
            price_per_km=Decimal('500'),
            zone_order=2,
        )
        self.url = reverse('pedidos-api:shipping-quote')

    def test_requiere_direccion_o_coordenadas(self):
        response = self.client.post(self.url, {}, content_type='application/json')

        self.assertEqual(response.status_code, 400)

    def test_cotiza_por_coordenadas_cerca_de_la_tienda(self):
        response = self.client.post(
            self.url,
            {'lat': YERBA_BUENA['lat'], 'lng': YERBA_BUENA['lng']},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['delivers_here'])
        self.assertEqual(data['distance_km'], 0.0)

        express = next(o for o in data['options'] if o['shipping_method'] == 'express')
        self.assertTrue(express['available'])
        self.assertEqual(express['zone_name'], 'Yerba Buena Centro')
        self.assertEqual(express['shipping_cost'], 7000)

        retiro = next(o for o in data['options'] if o['shipping_method'] == 'retiro')
        self.assertEqual(retiro['shipping_cost'], 0)
        self.assertEqual(retiro['pickup_address'], 'Solano Vera 480')

    def test_direccion_fuera_de_cobertura_no_entrega_pero_ofrece_retiro(self):
        # Buenos Aires: muy lejos de cualquier zona configurada
        response = self.client.post(
            self.url,
            {'lat': -34.6037, 'lng': -58.3816},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['delivers_here'])
        self.assertTrue(
            all(
                o['available'] is False
                for o in data['options']
                if o['shipping_method'] != 'retiro'
            )
        )
        self.assertTrue(
            next(o for o in data['options'] if o['shipping_method'] == 'retiro')['available']
        )

    def test_direccion_se_geocodifica(self):
        with patch('pedidos.shipping_quote_views.geocode_address') as geocode:
            geocode.return_value = {
                'lat': YERBA_BUENA['lat'],
                'lng': YERBA_BUENA['lng'],
                'resolved_address': 'Solano Vera 480, Yerba Buena, Tucumán',
                'source': 'google_geocoding',
            }
            response = self.client.post(
                self.url,
                {'address': 'Solano Vera 480', 'shipping_method': 'express'},
                content_type='application/json',
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['address']['resolved'], 'Solano Vera 480, Yerba Buena, Tucumán')
        self.assertEqual(data['distance_source'], 'estimada_linea_recta')
        self.assertEqual(
            [o['shipping_method'] for o in data['options']],
            ['express', 'retiro'],
        )

    def test_metodo_invalido(self):
        response = self.client.post(
            self.url,
            {'lat': YERBA_BUENA['lat'], 'lng': YERBA_BUENA['lng'], 'shipping_method': 'drone'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
