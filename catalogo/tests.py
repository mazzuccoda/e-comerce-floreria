from datetime import date, datetime

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from core import horario

from .models import Categoria, Ocasion, Producto, TipoFlor
from .text_utils import clean_product_name, normalize


class TextUtilsTests(TestCase):
    def test_clean_product_name_quita_emojis(self):
        self.assertEqual(clean_product_name('Mensaje de Amor ❤️'), 'Mensaje de Amor')
        self.assertEqual(clean_product_name('Florece en Vos 🌹'), 'Florece en Vos')
        self.assertEqual(clean_product_name('Rosas del Alba'), 'Rosas del Alba')

    def test_normalize_saca_acentos(self):
        self.assertEqual(normalize('Ramo Romántico'), 'ramo romantico')


class PublicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ramos = Categoria.objects.create(nombre='Ramos de flores', slug='ramos-de-flores')
        self.condolencias = Categoria.objects.create(nombre='Condolencias', slug='condolencias')
        self.enamorar = Ocasion.objects.create(nombre='Para enamorar')

        self.romantico = Producto.objects.create(
            nombre='Rosas del Alba ❤️',
            descripcion='Ramo de rosas en tonos cálidos con velo de novia.',
            categoria=self.ramos,
            precio=40000,
            sku='TEST-1',
            stock=50,
        )
        self.romantico.ocasiones.add(self.enamorar)

        self.funebre = Producto.objects.create(
            nombre='Camino de Fe',
            descripcion='Arreglo fúnebre con velo de novia para acompañar.',
            categoria=self.condolencias,
            precio=600000,
            sku='TEST-2',
            stock=50,
        )

        self.sin_precio = Producto.objects.create(
            nombre='Gloria Blanca',
            descripcion='Producto sin precio cargado.',
            categoria=self.ramos,
            precio=0,
            sku='TEST-3',
            stock=50,
        )

    def _buscar(self, query=''):
        respuesta = self.client.get(f'/api/publico/productos{query}')
        self.assertEqual(respuesta.status_code, 200)
        return respuesta.json()

    def test_busqueda_sin_acentos_encuentra_romanticos(self):
        datos = self._buscar('?q=ramo romantico')
        self.assertEqual(datos['intencion'], 'romantico')
        nombres = [p['nombre'] for p in datos['productos']]
        self.assertIn('Rosas del Alba', nombres)

    def test_busqueda_romantica_excluye_funebres(self):
        datos = self._buscar('?q=algo para mi novia')
        nombres = [p['nombre'] for p in datos['productos']]
        self.assertNotIn('Camino de Fe', nombres)

    def test_no_publica_productos_sin_precio(self):
        nombres = [p['nombre'] for p in self._buscar()['productos']]
        self.assertNotIn('Gloria Blanca', nombres)

    def test_filtra_por_precio_maximo(self):
        datos = self._buscar('?precio_max=50000')
        self.assertTrue(all(p['precio'] <= 50000 for p in datos['productos']))

    def test_producto_trae_url_localizada_y_nombre_limpio(self):
        producto = self._buscar('?q=rosas')['productos'][0]
        self.assertEqual(producto['nombre'], 'Rosas del Alba')
        self.assertIn('/es/productos/', producto['url'])

    def test_info_tienda(self):
        datos = self.client.get('/api/publico/tienda').json()
        self.assertEqual(datos['moneda'], 'ARS')
        self.assertIn('Yerba Buena', datos['zonas_de_entrega'])
        self.assertIn('cotizar_envio', datos['endpoints'])

    def test_api_catalogo_no_devuelve_productos_sin_precio_ni_emojis(self):
        productos = self.client.get('/api/catalogo/productos/').json()
        nombres = [p['nombre'] for p in productos]
        self.assertIn('Rosas del Alba', nombres)
        self.assertNotIn('Gloria Blanca', nombres)


class HorarioTests(SimpleTestCase):
    """2026-09-21 es lunes; 2026-09-26, sábado; 2026-09-27, domingo."""

    def _en(self, dia, hora, minuto=0):
        return datetime(2026, 9, dia, hora, minuto, tzinfo=horario.LOCAL_TZ)

    def test_lunes_antes_del_corte_entrega_hoy(self):
        ahora = self._en(21, 10)
        self.assertTrue(horario.acepta_pedidos_para_hoy(ahora))
        self.assertEqual(horario.proxima_fecha_de_entrega(ahora), date(2026, 9, 21))

    def test_lunes_despues_del_corte_entrega_el_martes(self):
        ahora = self._en(21, 18)
        self.assertFalse(horario.acepta_pedidos_para_hoy(ahora))
        self.assertEqual(horario.proxima_fecha_de_entrega(ahora), date(2026, 9, 22))

    def test_sabado_antes_del_corte_entrega_hoy(self):
        self.assertEqual(horario.proxima_fecha_de_entrega(self._en(26, 16)), date(2026, 9, 26))

    def test_sabado_despues_del_corte_pasa_al_lunes_nunca_domingo(self):
        proxima = horario.proxima_fecha_de_entrega(self._en(26, 18))
        self.assertEqual(proxima, date(2026, 9, 28))
        self.assertEqual(proxima.weekday(), 0)

    def test_domingo_no_acepta_pedidos_para_hoy(self):
        ahora = self._en(27, 10)
        self.assertFalse(horario.acepta_pedidos_para_hoy(ahora))
        self.assertEqual(horario.proxima_fecha_de_entrega(ahora), date(2026, 9, 28))

    def test_nunca_devuelve_un_dia_cerrado(self):
        for dia in range(21, 28):
            for hora in range(0, 24):
                proxima = horario.proxima_fecha_de_entrega(self._en(dia, hora))
                self.assertTrue(horario.es_dia_abierto(proxima), (dia, hora, proxima))

    def test_convierte_a_hora_argentina(self):
        # Sábado 21:30 UTC = sábado 18:30 en Argentina: ya pasó el corte.
        from zoneinfo import ZoneInfo
        ahora = datetime(2026, 9, 26, 21, 30, tzinfo=ZoneInfo('UTC'))
        datos = horario.entrega_mismo_dia(ahora)
        self.assertFalse(datos['acepta_pedidos_para_hoy'])
        self.assertEqual(datos['proxima_fecha_de_entrega'], '2026-09-28')
        self.assertEqual(datos['proximo_dia_de_entrega'], 'lunes')


class PublicApiIntencionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        ramos = Categoria.objects.create(nombre='Ramos de flores', slug='ramos-de-flores')
        condolencias = Categoria.objects.create(nombre='Condolencias', slug='condolencias')
        rosas = TipoFlor.objects.create(nombre='Rosas')
        cumple = Ocasion.objects.create(nombre='Cumpleaños')

        self.romantico = Producto.objects.create(
            nombre='Pasión Roja', descripcion='Ramo de rosas rojas.', categoria=ramos,
            tipo_flor=rosas, precio=45000, sku='INT-1', stock=50,
        )
        self.cumple = Producto.objects.create(
            nombre='Feliz Día', descripcion='Ramo alegre de gerberas.', categoria=ramos,
            precio=30000, sku='INT-2', stock=50,
        )
        self.cumple.ocasiones.add(cumple)
        self.caro = Producto.objects.create(
            nombre='Rosas Eternas', descripcion='Caja de rosas.', categoria=ramos,
            tipo_flor=rosas, precio=90000, sku='INT-3', stock=50,
        )
        self.corona = Producto.objects.create(
            nombre='Corona de Paz', descripcion='Corona fúnebre con rosas blancas.', categoria=condolencias,
            precio=80000, sku='INT-4', stock=50,
        )
        self.agotado = Producto.objects.create(
            nombre='Rosa Única', descripcion='Una rosa.', categoria=ramos,
            precio=10000, sku='INT-5', stock=0,
        )

    def _skus(self, query):
        respuesta = self.client.get(f'/api/publico/productos{query}')
        self.assertEqual(respuesta.status_code, 200)
        return respuesta.json(), [p['sku'] for p in respuesta.json()['productos']]

    def test_intencion_explicita_sin_texto(self):
        datos, skus = self._skus('?intencion=romantico')
        self.assertEqual(datos['intencion'], 'romantico')
        self.assertIn('INT-1', skus)
        self.assertNotIn('INT-4', skus)  # excluye luto
        self.assertNotIn('INT-5', skus)  # sin stock

    def test_intencion_invalida(self):
        respuesta = self.client.get('/api/publico/productos?intencion=cualquiera')
        self.assertEqual(respuesta.status_code, 400)

    def test_flores_para_mi_novia(self):
        datos, skus = self._skus('?q=flores para mi novia')
        self.assertEqual(datos['intencion'], 'romantico')
        self.assertIn('INT-1', skus)
        self.assertNotIn('INT-4', skus)

    def test_ramo_romantico_hasta_50000(self):
        _, skus = self._skus('?q=ramo romántico&precio_max=50000')
        self.assertIn('INT-1', skus)
        self.assertNotIn('INT-3', skus)

    def test_rosas(self):
        _, skus = self._skus('?q=rosas')
        self.assertIn('INT-1', skus)
        self.assertIn('INT-3', skus)

    def test_filtro_por_tipo_flor(self):
        datos, skus = self._skus('?tipo_flor=rosas')
        self.assertEqual(set(skus), {'INT-1', 'INT-3'})
        self.assertEqual(datos['productos'][0]['tipo_flor'], 'Rosas')

    def test_cumpleanos(self):
        datos, skus = self._skus('?q=cumpleaños')
        self.assertEqual(datos['intencion'], 'cumpleanos')
        self.assertEqual(skus[0], 'INT-2')
        self.assertNotIn('INT-4', skus)

    def test_condolencias_incluye_arreglos_funebres(self):
        datos, skus = self._skus('?q=condolencias')
        self.assertEqual(datos['intencion'], 'condolencias')
        self.assertIn('INT-4', skus)

    def test_enviar_flores_manana_en_yerba_buena(self):
        datos, _ = self._skus('?q=quiero enviar flores mañana en Yerba Buena')
        self.assertIn('nota_envio', datos)

    def test_tienda_informa_proxima_entrega_en_dia_abierto(self):
        datos = self.client.get('/api/publico/tienda').json()
        proxima = date.fromisoformat(datos['entrega_mismo_dia']['proxima_fecha_de_entrega'])
        self.assertNotEqual(proxima.weekday(), 6)
        self.assertIn('precarrito', datos['endpoints'])

    def test_precarrito_devuelve_url_de_producto_sin_crear_pedido(self):
        respuesta = self.client.post('/api/publico/carrito', {'sku': 'INT-1', 'cantidad': 2}, format='json')
        self.assertEqual(respuesta.status_code, 200)
        datos = respuesta.json()
        self.assertIn('/es/productos/', datos['checkout_url'])
        self.assertEqual(datos['subtotal'], 90000)

    def test_precarrito_valida_sku_y_stock(self):
        self.assertEqual(self.client.post('/api/publico/carrito', {}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/publico/carrito', {'sku': 'NO'}, format='json').status_code, 404)
        self.assertEqual(self.client.post('/api/publico/carrito', {'sku': 'INT-5'}, format='json').status_code, 409)
        self.assertEqual(
            self.client.post('/api/publico/carrito', {'sku': 'INT-1', 'cantidad': 99}, format='json').status_code,
            400,
        )
