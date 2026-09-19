from django.test import TestCase
from rest_framework.test import APIClient

from .models import Categoria, Ocasion, Producto
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
