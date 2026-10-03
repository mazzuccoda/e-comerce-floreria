from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from admin_simple import reportes
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

    def test_el_formulario_de_busqueda_conserva_estado_y_pago(self):
        respuesta = self.client.get(
            reverse('admin_simple:pedidos-list'), {'estado': 'recibido', 'pago': 'pendiente'}
        )

        contenido = respuesta.content.decode()
        self.assertIn('<input type="hidden" name="estado" value="recibido">', contenido)
        self.assertIn('<input type="hidden" name="pago" value="pendiente">', contenido)

    def test_cancelar_sin_confirmar_no_dice_que_restauro_stock(self):
        pedido = self._pedido()

        respuesta = self.client.post(
            reverse('admin_simple:pedido-cancelar', args=[pedido.pk])
        )

        self.producto.refresh_from_db()
        self.assertEqual(respuesta.status_code, 200)
        self.assertNotIn('stock', respuesta.json()['message'].lower())
        self.assertEqual(self.producto.stock, 10)

    def test_cancelar_confirmado_avisa_que_restauro_stock(self):
        pedido = self._pedido()
        pedido.confirmar_pedido()

        respuesta = self.client.post(
            reverse('admin_simple:pedido-cancelar', args=[pedido.pk])
        )

        self.producto.refresh_from_db()
        self.assertIn('stock restaurado', respuesta.json()['message'].lower())
        self.assertEqual(self.producto.stock, 10)

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


class ReportesVentasTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-ventas')
        self.producto = Producto.objects.create(
            nombre='Sol de Verano',
            descripcion='Ramo de girasoles.',
            categoria=self.categoria,
            precio=30000,
            sku='TEST-SOL',
            stock=20,
        )
        self.hoy = timezone.localdate()

    def _venta(self, dias_atras=0, total=40000, costo_envio=7000, cantidad=1, **kwargs):
        datos = dict(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=self.hoy,
            franja_horaria='durante_el_dia',
            medio_pago='transferencia',
            costo_envio=costo_envio,
            total=total,
            confirmado=True,
        )
        datos.update(kwargs)
        pedido = Pedido.objects.create(**datos)
        PedidoItem.objects.create(
            pedido=pedido,
            producto=self.producto,
            cantidad=cantidad,
            precio=self.producto.precio,
        )
        if dias_atras:
            nuevo_creado = pedido.creado - timedelta(days=dias_atras)
            Pedido.objects.filter(pk=pedido.pk).update(creado=nuevo_creado)
            pedido.refresh_from_db()
        return pedido

    def test_solo_cuentan_los_pedidos_confirmados_y_no_cancelados(self):
        self._venta(total=40000)
        self._venta(total=99000, confirmado=False)
        self._venta(total=99000, estado='cancelado')

        resumen = reportes.totales(reportes.Periodo('hoy', self.hoy, self.hoy))

        self.assertEqual(resumen['pedidos'], 1)
        self.assertEqual(resumen['facturacion'], Decimal('40000'))

    def test_la_venta_se_imputa_al_dia_del_pedido_no_al_de_entrega(self):
        self._venta(dias_atras=3, fecha_entrega=self.hoy)

        de_hoy = reportes.totales(reportes.Periodo('hoy', self.hoy, self.hoy))
        de_la_semana = reportes.totales(
            reportes.Periodo('7d', self.hoy - timedelta(days=6), self.hoy)
        )

        self.assertEqual(de_hoy['pedidos'], 0)
        self.assertEqual(de_la_semana['pedidos'], 1)

    def test_desglose_de_productos_envio_y_cobrado(self):
        self._venta(total=52000, costo_envio=7000, estado_pago='approved')
        self._venta(total=30000, costo_envio=0, estado_pago='pendiente')

        resumen = reportes.totales(reportes.Periodo('hoy', self.hoy, self.hoy))

        self.assertEqual(resumen['facturacion'], Decimal('82000'))
        self.assertEqual(resumen['envio'], Decimal('7000'))
        self.assertEqual(resumen['productos'], Decimal('75000'))
        self.assertEqual(resumen['cobrado'], Decimal('52000'))
        self.assertEqual(resumen['por_cobrar'], Decimal('30000'))
        self.assertEqual(resumen['ticket'], Decimal('41000'))

    def test_el_rango_personalizado_invertido_se_ordena(self):
        periodo = reportes.resolver_periodo(
            'rango', desde='2026-03-10', hasta='2026-03-01', hoy=self.hoy
        )

        self.assertEqual(periodo.desde.isoformat(), '2026-03-01')
        self.assertEqual(periodo.hasta.isoformat(), '2026-03-10')
        self.assertEqual(periodo.dias, 10)

    def test_el_periodo_anterior_tiene_el_mismo_largo_y_termina_antes(self):
        periodo = reportes.resolver_periodo('7d', hoy=self.hoy)
        anterior = periodo.anterior()

        self.assertEqual(anterior.dias, periodo.dias)
        self.assertEqual(anterior.hasta, periodo.desde - timedelta(days=1))

    def test_la_serie_diaria_devuelve_los_dias_sin_ventas_en_cero(self):
        self._venta(total=50000)

        serie = reportes.serie_diaria(
            reportes.Periodo('7d', self.hoy - timedelta(days=6), self.hoy)
        )

        self.assertEqual(len(serie), 7)
        self.assertEqual(serie[-1]['facturacion'], Decimal('50000'))
        self.assertEqual(serie[-1]['altura'], 100)
        self.assertEqual(serie[0]['facturacion'], Decimal('0'))
        self.assertEqual(serie[0]['pedidos'], 0)

    def test_top_productos_suma_unidades_y_muestra_el_stock_actual(self):
        self._venta(cantidad=3)
        self._venta(cantidad=2)

        top = reportes.top_productos(reportes.Periodo('hoy', self.hoy, self.hoy))

        self.assertEqual(len(top), 1)
        self.assertEqual(top[0]['unidades'], 5)
        self.assertEqual(top[0]['facturacion'], Decimal('150000'))
        self.assertEqual(top[0]['stock'], self.producto.stock)

    def test_atencion_marca_el_cobro_demorado_y_las_entregas_pasadas(self):
        demorado = self._venta(dias_atras=3, estado_pago='pendiente')
        self._venta(estado_pago='pendiente')
        atrasado = self._venta(fecha_entrega=self.hoy - timedelta(days=1))

        atencion = reportes.pedidos_que_necesitan_atencion(hoy=self.hoy)

        self.assertEqual([p.pk for p in atencion['pago_demorado']], [demorado.pk])
        self.assertIn(atrasado.pk, [p.pk for p in atencion['entregas_atrasadas']])

    def test_resumen_de_hoy_separa_facturacion_de_entregas_pendientes(self):
        self._venta(total=40000)
        self._venta(dias_atras=2, fecha_entrega=self.hoy)

        resumen = reportes.resumen_de_hoy(hoy=self.hoy)

        self.assertEqual(resumen['pedidos'], 1)
        self.assertEqual(resumen['facturacion'], Decimal('40000'))
        self.assertEqual(resumen['entregas_pendientes'], 2)


class PanelVentasTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin-ventas',
            email='admin-ventas@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(
            nombre='Ramos', slug='ramos-panel-ventas'
        )
        self.producto = Producto.objects.create(
            nombre='Mix Único',
            descripcion='Ramo mixto.',
            categoria=self.categoria,
            precio=25000,
            sku='TEST-MIX',
            stock=8,
        )
        self.pedido = Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='durante_el_dia',
            medio_pago='transferencia',
            tipo_envio='express',
            costo_envio=7000,
            total=32000,
            confirmado=True,
        )
        PedidoItem.objects.create(
            pedido=self.pedido,
            producto=self.producto,
            cantidad=1,
            precio=self.producto.precio,
        )

    def test_la_vista_de_ventas_muestra_el_total_del_periodo(self):
        respuesta = self.client.get(reverse('admin_simple:ventas'), {'periodo': 'hoy'})

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.context['totales']['facturacion'], Decimal('32000'))
        self.assertEqual(respuesta.context['periodo'].clave, 'hoy')
        self.assertEqual(respuesta.context['medios_pago'][0]['etiqueta'],
                         self.pedido.get_medio_pago_display())
        self.assertEqual(respuesta.context['top_productos'][0]['nombre'], 'Mix Único')

    def test_el_rango_personalizado_llega_desde_el_querystring(self):
        hoy = timezone.localdate()

        respuesta = self.client.get(reverse('admin_simple:ventas'), {
            'desde': hoy.isoformat(), 'hasta': hoy.isoformat(),
        })

        periodo = respuesta.context['periodo']
        self.assertEqual(periodo.clave, 'rango')
        self.assertEqual(periodo.desde, hoy)
        self.assertEqual(respuesta.context['totales']['pedidos'], 1)

    def test_exporta_csv_con_el_pedido_del_periodo(self):
        respuesta = self.client.get(reverse('admin_simple:ventas'), {
            'periodo': 'hoy', 'formato': 'csv',
        })

        contenido = respuesta.content.decode('utf-8')
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('text/csv', respuesta['Content-Type'])
        self.assertIn('attachment;', respuesta['Content-Disposition'])
        self.assertIn('Numero;Fecha pedido', contenido)
        self.assertIn('25000.00;7000.00;32000.00', contenido)

    def test_el_dashboard_muestra_la_franja_de_hoy(self):
        respuesta = self.client.get(reverse('admin_simple:dashboard'))

        self.assertEqual(respuesta.context['hoy']['facturacion'], Decimal('32000'))
        self.assertIn('Facturado hoy', respuesta.content.decode())

    def test_ventas_exige_superusuario(self):
        self.client.logout()

        respuesta = self.client.get(reverse('admin_simple:ventas'))

        self.assertEqual(respuesta.status_code, 302)
