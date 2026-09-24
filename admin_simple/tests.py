from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from catalogo.models import Categoria, Producto
from pedidos.models import Pedido, PedidoItem

User = get_user_model()


class PanelPedidosTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin-test', email='admin-test@example.com', password='clave-de-prueba'
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos')
        self.producto = Producto.objects.create(
            nombre='Rosas del Alba',
            descripcion='Ramo de rosas.',
            categoria=self.categoria,
            precio=40000,
            sku='TEST-ROSAS',
            stock=10,
        )

    def _pedido(self, **kwargs):
        datos = dict(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='durante_el_dia',
            dedicatoria='Te quiero',
            medio_pago='transferencia',
            total=40000,
        )
        datos.update(kwargs)
        pedido = Pedido.objects.create(**datos)
        PedidoItem.objects.create(
            pedido=pedido, producto=self.producto, cantidad=1, precio=self.producto.precio
        )
        return pedido

    def test_detalle_muestra_direccion_y_medio_de_pago(self):
        pedido = self._pedido(instrucciones='Timbre 2', regalo_anonimo=True)

        respuesta = self.client.get(
            reverse('admin_simple:pedido-detail', args=[pedido.pk])
        )

        contenido = respuesta.content.decode()
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('Solano Vera 480', contenido)
        self.assertIn(pedido.get_medio_pago_display(), contenido)
        self.assertIn('Timbre 2', contenido)
        self.assertIn('Envío anónimo', contenido)

    def test_filtro_entrega_hoy_usa_fecha_de_entrega(self):
        hoy = self._pedido()
        manana = self._pedido(fecha_entrega=timezone.localdate() + timedelta(days=1))

        respuesta = self.client.get(
            reverse('admin_simple:pedidos-list'), {'entrega': 'hoy'}
        )

        pedidos = list(respuesta.context['page_obj'])
        self.assertIn(hoy, pedidos)
        self.assertNotIn(manana, pedidos)

    def test_filtro_entrega_excluye_entregados_y_cancelados(self):
        abierto = self._pedido()
        self._pedido(estado='entregado')
        self._pedido(estado='cancelado')

        respuesta = self.client.get(
            reverse('admin_simple:pedidos-list'), {'entrega': 'hoy'}
        )

        self.assertEqual(list(respuesta.context['page_obj']), [abierto])
        self.assertEqual(respuesta.context['entregas_hoy'], 1)

    def test_los_filtros_no_se_pisan_entre_si(self):
        respuesta = self.client.get(
            reverse('admin_simple:pedidos-list'), {'entrega': 'hoy', 'pago': 'pendiente'}
        )

        self.assertIn('entrega=hoy', respuesta.context['qs_sin_pago'])
        self.assertNotIn('pago=', respuesta.context['qs_sin_pago'])

    def test_dashboard_cuenta_pedidos_pendientes_con_estados_reales(self):
        self._pedido(estado='recibido')
        self._pedido(estado='preparando')
        self._pedido(estado='entregado')

        respuesta = self.client.get(reverse('admin_simple:dashboard'))

        self.assertEqual(respuesta.context['pedidos_pendientes'], 2)


class CancelarPedidoTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-cancel')
        self.producto = Producto.objects.create(
            nombre='Amor Suave',
            descripcion='Ramo.',
            categoria=self.categoria,
            precio=45000,
            sku='TEST-AMOR',
            stock=5,
        )
        self.pedido = Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='tarde',
            dedicatoria='Te quiero',
            total=45000,
        )
        PedidoItem.objects.create(
            pedido=self.pedido, producto=self.producto, cantidad=2, precio=self.producto.precio
        )

    def test_cancelar_pedido_sin_confirmar_no_toca_el_stock(self):
        exito, _ = self.pedido.cancelar_pedido()

        self.producto.refresh_from_db()
        self.pedido.refresh_from_db()
        self.assertTrue(exito)
        self.assertEqual(self.pedido.estado, 'cancelado')
        self.assertEqual(self.producto.stock, 5)

    def test_cancelar_pedido_confirmado_restaura_el_stock(self):
        self.pedido.confirmar_pedido()
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 3)

        exito, _ = self.pedido.cancelar_pedido()

        self.producto.refresh_from_db()
        self.assertTrue(exito)
        self.assertEqual(self.producto.stock, 5)

    def test_no_se_puede_cancelar_dos_veces(self):
        self.pedido.cancelar_pedido()

        exito, mensaje = self.pedido.cancelar_pedido()

        self.assertFalse(exito)
        self.assertIn('ya está cancelado', mensaje)
