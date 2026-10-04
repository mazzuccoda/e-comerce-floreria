from datetime import time, timedelta
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


class AgendaTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='agenda-admin',
            email='agenda@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-agenda')
        self.producto = Producto.objects.create(
            nombre='Ramo de Girasoles',
            descripcion='Girasoles frescos.',
            categoria=self.categoria,
            precio=30000,
            sku='AGENDA-GIRASOLES',
            stock=10,
        )
        self.hoy = timezone.localdate()

    def _pedido(self, **kwargs):
        datos = dict(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=self.hoy,
            franja_horaria='tarde',
            dedicatoria='Te quiero',
            medio_pago='transferencia',
            tipo_envio='programado',
            total=Decimal('30000'),
            confirmado=True,
        )
        datos.update(kwargs)
        pedido = Pedido.objects.create(**datos)
        PedidoItem.objects.create(
            pedido=pedido,
            producto=self.producto,
            cantidad=1,
            precio=self.producto.precio,
        )
        return pedido

    def test_la_agenda_agrupa_por_franja_y_separa_los_retiros(self):
        manana = self._pedido(franja_horaria='mañana')
        tarde = self._pedido(franja_horaria='tarde')
        retiro = self._pedido(
            tipo_envio='retiro', hora_retiro=time(10, 30), direccion=''
        )

        respuesta = self.client.get(reverse('admin_simple:agenda'))

        contexto = respuesta.context['agenda']
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual([retiro], contexto['retiros'])
        self.assertEqual(
            [('mañana', [manana]), ('tarde', [tarde])],
            [(grupo['clave'], grupo['pedidos']) for grupo in contexto['grupos']],
        )
        self.assertEqual(contexto['total'], 3)

    def test_la_agenda_deja_fuera_los_cancelados_y_cuenta_los_entregados(self):
        self._pedido()
        self._pedido(estado='entregado')
        self._pedido(estado='cancelado')

        respuesta = self.client.get(
            reverse('admin_simple:agenda'), {'fecha': self.hoy.isoformat()}
        )

        contexto = respuesta.context['agenda']
        self.assertEqual(contexto['total'], 2)
        self.assertEqual(contexto['pendientes'], 1)
        self.assertEqual(contexto['entregados'], 1)
        self.assertEqual(contexto['facturacion'], Decimal('60000'))

    def test_una_fecha_rota_cae_en_el_dia_de_hoy(self):
        respuesta = self.client.get(
            reverse('admin_simple:agenda'), {'fecha': 'treinta-de-febrero'}
        )

        self.assertEqual(respuesta.context['fecha'], self.hoy)

    def test_el_calendario_muestra_la_carga_de_cada_dia(self):
        self._pedido()
        self._pedido(estado='entregado')

        respuesta = self.client.get(
            reverse('admin_simple:calendario'),
            {'mes': f'{self.hoy.year:04d}-{self.hoy.month:02d}'},
        )

        dias = [
            dia
            for semana in respuesta.context['semanas']
            for dia in semana
            if dia['fecha'] == self.hoy
        ]
        self.assertEqual(len(dias), 1)
        self.assertEqual(dias[0]['pedidos'], 2)
        self.assertEqual(dias[0]['pendientes'], 1)
        self.assertEqual(respuesta.context['totales']['pedidos'], 2)

    def test_el_calendario_navega_entre_meses(self):
        respuesta = self.client.get(
            reverse('admin_simple:calendario'), {'mes': '2026-01'}
        )

        self.assertEqual(respuesta.context['mes'].valor, '2026-01')
        self.assertEqual(respuesta.context['mes_anterior'].valor, '2025-12')
        self.assertEqual(respuesta.context['mes_siguiente'].valor, '2026-02')

    def test_la_hoja_de_ruta_devuelve_un_pdf(self):
        self._pedido()

        respuesta = self.client.get(
            reverse('admin_simple:agenda-pdf'), {'fecha': self.hoy.isoformat()}
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta['Content-Type'], 'application/pdf')
        self.assertTrue(respuesta.content.startswith(b'%PDF'))

    def test_el_rango_libre_filtra_por_fecha_de_entrega(self):
        pasado = self._pedido(fecha_entrega=self.hoy - timedelta(days=5))
        proximo = self._pedido(fecha_entrega=self.hoy + timedelta(days=2))

        respuesta = self.client.get(reverse('admin_simple:pedidos-list'), {
            'entrega_desde': (self.hoy + timedelta(days=1)).isoformat(),
            'entrega_hasta': (self.hoy + timedelta(days=3)).isoformat(),
        })

        pedidos = list(respuesta.context['page_obj'])
        self.assertIn(proximo, pedidos)
        self.assertNotIn(pasado, pedidos)

    def test_el_rango_invertido_se_ordena_solo(self):
        proximo = self._pedido(fecha_entrega=self.hoy + timedelta(days=2))

        respuesta = self.client.get(reverse('admin_simple:pedidos-list'), {
            'entrega_desde': (self.hoy + timedelta(days=3)).isoformat(),
            'entrega_hasta': (self.hoy + timedelta(days=1)).isoformat(),
        })

        self.assertIn(proximo, list(respuesta.context['page_obj']))

    def test_la_agenda_exige_superusuario(self):
        self.client.logout()

        respuesta = self.client.get(reverse('admin_simple:agenda'))

        self.assertEqual(respuesta.status_code, 302)


class EdicionOperativaTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='edicion-admin',
            email='edicion@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-edicion')
        self.producto = Producto.objects.create(
            nombre='Ramo Clásico',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=25000,
            sku='EDICION-ROSAS',
            stock=10,
        )
        self.pedido = Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='tarde',
            dedicatoria='Te quiero',
            medio_pago='transferencia',
            tipo_envio='programado',
            total=Decimal('25000'),
            confirmado=True,
        )
        PedidoItem.objects.create(
            pedido=self.pedido,
            producto=self.producto,
            cantidad=1,
            precio=self.producto.precio,
        )

    def _datos(self, **kwargs):
        datos = {
            'fecha_entrega': self.pedido.fecha_entrega.isoformat(),
            'franja_horaria': self.pedido.franja_horaria,
            'hora_retiro': '',
            'tipo_envio': self.pedido.tipo_envio,
            'nombre_destinatario': self.pedido.nombre_destinatario,
            'telefono_destinatario': self.pedido.telefono_destinatario,
            'direccion': self.pedido.direccion,
            'ciudad': self.pedido.ciudad,
            'dedicatoria': self.pedido.dedicatoria,
            'instrucciones': '',
        }
        datos.update(kwargs)
        return datos

    def test_corrige_fecha_franja_y_direccion(self):
        nueva_fecha = timezone.localdate() + timedelta(days=3)

        respuesta = self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            self._datos(
                fecha_entrega=nueva_fecha.isoformat(),
                franja_horaria='mañana',
                direccion='Av. Aconquija 1200',
            ),
        )

        self.pedido.refresh_from_db()
        self.assertRedirects(
            respuesta,
            reverse('admin_simple:pedido-detail', args=[self.pedido.pk]),
        )
        self.assertEqual(self.pedido.fecha_entrega, nueva_fecha)
        self.assertEqual(self.pedido.franja_horaria, 'mañana')
        self.assertEqual(self.pedido.direccion, 'Av. Aconquija 1200')

    def test_no_toca_importes_ni_stock(self):
        self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            self._datos(direccion='Av. Aconquija 1200'),
        )

        self.pedido.refresh_from_db()
        self.producto.refresh_from_db()
        self.assertEqual(self.pedido.total, Decimal('25000'))
        self.assertEqual(self.producto.stock, 10)

    def test_un_envio_sin_direccion_no_se_guarda(self):
        respuesta = self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            self._datos(direccion='   '),
        )

        self.pedido.refresh_from_db()
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(self.pedido.direccion, 'Solano Vera 480')
        self.assertIn('dirección de entrega', respuesta.content.decode())

    def test_un_retiro_necesita_hora(self):
        respuesta = self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            self._datos(tipo_envio='retiro', hora_retiro=''),
        )

        self.pedido.refresh_from_db()
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(self.pedido.tipo_envio, 'programado')

    def test_el_detalle_trae_el_formulario_de_edicion(self):
        respuesta = self.client.get(
            reverse('admin_simple:pedido-detail', args=[self.pedido.pk])
        )

        contenido = respuesta.content.decode()
        self.assertIn('Corregir datos de entrega', contenido)
        self.assertIn('name="fecha_entrega"', contenido)

    def test_editar_exige_superusuario(self):
        self.client.logout()

        respuesta = self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            self._datos(),
        )

        self.pedido.refresh_from_db()
        self.assertEqual(respuesta.status_code, 302)
        self.assertEqual(self.pedido.direccion, 'Solano Vera 480')


class NumeroPedidoTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='numero-admin',
            email='numero@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-numero')
        self.producto = Producto.objects.create(
            nombre='Ramo Primavera',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=30000,
            sku='NUMERO-ROSAS',
            stock=10,
        )

    def _pedido(self):
        pedido = Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='tarde',
            medio_pago='transferencia',
            tipo_envio='programado',
            total=Decimal('30000'),
        )
        PedidoItem.objects.create(
            pedido=pedido, producto=self.producto, cantidad=1, precio=self.producto.precio
        )
        return pedido

    def test_el_numero_es_correlativo_y_derivado_del_id(self):
        pedido = self._pedido()

        self.assertEqual(pedido.numero_pedido, str(1000 + pedido.pk))
        self.assertEqual(pedido.numero, pedido.numero_pedido)

    def test_dos_pedidos_no_comparten_numero(self):
        primero = self._pedido()
        segundo = self._pedido()

        self.assertNotEqual(primero.numero, segundo.numero)
        self.assertEqual(int(segundo.numero) - int(primero.numero), segundo.pk - primero.pk)

    def test_la_busqueda_acepta_el_numero_con_numeral(self):
        pedido = self._pedido()

        respuesta = self.client.get(reverse('admin_simple:pedidos-list'), {
            'buscar': f'#{pedido.numero}',
        })

        self.assertEqual(list(respuesta.context['page_obj']), [pedido])

    def test_el_panel_muestra_el_numero_comercial(self):
        pedido = self._pedido()

        respuesta = self.client.get(reverse('admin_simple:pedido-detail', args=[pedido.pk]))

        self.assertContains(respuesta, f'Pedido #{pedido.numero}')


class PedidoManualTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='manual-admin',
            email='manual@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-manual')
        self.producto = Producto.objects.create(
            nombre='Ramo Telefónico',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=Decimal('30000'),
            sku='MANUAL-ROSAS',
            stock=5,
        )
        self.url = reverse('admin_simple:pedido-nuevo')

    def _datos(self, **kwargs):
        datos = {
            'nombre_comprador': 'Daniel',
            'telefono_comprador': '3813671352',
            'email_comprador': '',
            'nombre_destinatario': 'Ana',
            'telefono_destinatario': '3814778577',
            'direccion': 'Av. Aconquija 1200',
            'ciudad': 'Yerba Buena',
            'tipo_envio': 'programado',
            'fecha_entrega': timezone.localdate().isoformat(),
            'franja_horaria': 'tarde',
            'hora_retiro': '',
            'costo_envio': '7000',
            'medio_pago': 'transferencia',
            'estado_pago': 'pendiente',
            'dedicatoria': 'Te quiero',
            'firmado_como': 'Daniel',
            'regalo_anonimo': '',
            'instrucciones': '',
            'items-TOTAL_FORMS': '3',
            'items-INITIAL_FORMS': '0',
            'items-MIN_NUM_FORMS': '0',
            'items-MAX_NUM_FORMS': '20',
            'items-0-producto': str(self.producto.pk),
            'items-0-cantidad': '2',
            'items-1-producto': '',
            'items-1-cantidad': '',
            'items-2-producto': '',
            'items-2-cantidad': '',
        }
        datos.update(kwargs)
        return datos

    def test_crea_el_pedido_confirmado_y_descuenta_stock(self):
        respuesta = self.client.post(self.url, self._datos())

        pedido = Pedido.objects.get(nombre_comprador='Daniel')
        self.assertRedirects(
            respuesta, reverse('admin_simple:pedido-detail', args=[pedido.pk])
        )
        self.assertTrue(pedido.confirmado)
        self.assertTrue(pedido.origen_manual)
        self.assertEqual(pedido.total, Decimal('67000'))
        self.assertEqual(pedido.numero, str(1000 + pedido.pk))
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 3)

    def test_sin_productos_no_crea_nada(self):
        respuesta = self.client.post(self.url, self._datos(**{
            'items-0-producto': '',
            'items-0-cantidad': '',
        }))

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(Pedido.objects.exists())

    def test_stock_insuficiente_sumando_lineas_repetidas(self):
        respuesta = self.client.post(self.url, self._datos(**{
            'items-0-cantidad': '3',
            'items-1-producto': str(self.producto.pk),
            'items-1-cantidad': '4',
        }))

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(Pedido.objects.exists())
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 5)

    def test_el_envio_exige_direccion(self):
        respuesta = self.client.post(self.url, self._datos(direccion=''))

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(Pedido.objects.exists())
        self.assertIn('direccion', respuesta.context['form'].errors)

    def test_el_retiro_exige_hora(self):
        respuesta = self.client.post(self.url, self._datos(
            tipo_envio='retiro', hora_retiro='', direccion=''
        ))

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('hora_retiro', respuesta.context['form'].errors)

    def test_el_retiro_sin_direccion_queda_como_retiro_en_tienda(self):
        self.client.post(self.url, self._datos(
            tipo_envio='retiro',
            hora_retiro='10:30',
            direccion='',
            medio_pago='efectivo',
            costo_envio='0',
        ))

        pedido = Pedido.objects.get(nombre_comprador='Daniel')
        self.assertEqual(pedido.direccion, 'Retiro en tienda')
        self.assertEqual(pedido.total, Decimal('60000'))

    def test_efectivo_con_envio_se_rechaza(self):
        respuesta = self.client.post(self.url, self._datos(medio_pago='efectivo'))

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('medio_pago', respuesta.context['form'].errors)

    def test_la_carga_manual_exige_superusuario(self):
        self.client.logout()

        respuesta = self.client.get(self.url)

        self.assertEqual(respuesta.status_code, 302)


class HistorialPedidoTests(TestCase):
    """El panel tiene que poder decir quién tocó el pedido y cuándo."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='historial-admin',
            email='historial@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)

        self.categoria = Categoria.objects.create(
            nombre='Ramos', slug='ramos-historial'
        )
        self.producto = Producto.objects.create(
            nombre='Ramo del Historial',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=30000,
            sku='HIST-ROSAS',
            stock=10,
        )
        self.pedido = Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            ciudad='Yerba Buena',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='tarde',
            dedicatoria='Te quiero',
            medio_pago='transferencia',
            tipo_envio='programado',
            total=Decimal('30000'),
            confirmado=True,
        )
        PedidoItem.objects.create(
            pedido=self.pedido,
            producto=self.producto,
            cantidad=1,
            precio=self.producto.precio,
        )

    def test_cambio_de_estado_queda_registrado_con_autor(self):
        self.client.post(
            reverse('admin_simple:pedido-cambiar-estado', args=[self.pedido.pk]),
            {'estado': 'en_camino'},
        )

        evento = self.pedido.eventos.filter(tipo='estado').first()
        self.assertIsNotNone(evento)
        self.assertIn('En camino', evento.descripcion)
        self.assertEqual(evento.autor, 'historial-admin')

    def test_cambio_de_pago_queda_registrado(self):
        self.client.post(
            reverse('admin_simple:pedido-cambiar-estado-pago', args=[self.pedido.pk]),
            {'estado_pago': 'approved'},
        )

        self.assertTrue(self.pedido.eventos.filter(tipo='pago').exists())

    def test_correccion_de_entrega_queda_registrada(self):
        self.client.post(
            reverse('admin_simple:pedido-editar', args=[self.pedido.pk]),
            {
                'fecha_entrega': self.pedido.fecha_entrega.isoformat(),
                'franja_horaria': self.pedido.franja_horaria,
                'hora_retiro': '',
                'tipo_envio': self.pedido.tipo_envio,
                'nombre_destinatario': self.pedido.nombre_destinatario,
                'telefono_destinatario': self.pedido.telefono_destinatario,
                'direccion': 'Av. Aconquija 1200',
                'ciudad': self.pedido.ciudad,
                'dedicatoria': self.pedido.dedicatoria,
                'instrucciones': '',
            },
        )

        evento = self.pedido.eventos.filter(tipo='entrega').first()
        self.assertIsNotNone(evento)
        self.assertIn('Aconquija', evento.descripcion)

    def test_nota_interna_se_guarda_y_se_ve_en_el_detalle(self):
        respuesta = self.client.post(
            reverse('admin_simple:pedido-nota', args=[self.pedido.pk]),
            {'nota': 'Llamé y no atiende, dejar con el portero'},
        )

        self.assertRedirects(
            respuesta,
            reverse('admin_simple:pedido-detail', args=[self.pedido.pk]),
        )
        nota = self.pedido.eventos.filter(tipo='nota').first()
        self.assertEqual(nota.descripcion, 'Llamé y no atiende, dejar con el portero')

        detalle = self.client.get(
            reverse('admin_simple:pedido-detail', args=[self.pedido.pk])
        )
        self.assertContains(detalle, 'dejar con el portero')

    def test_nota_vacia_no_se_guarda(self):
        self.client.post(
            reverse('admin_simple:pedido-nota', args=[self.pedido.pk]),
            {'nota': '   '},
        )

        self.assertFalse(self.pedido.eventos.filter(tipo='nota').exists())


class AccionesMasivasTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='lote-admin',
            email='lote@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)
        self.url = reverse('admin_simple:pedidos-accion-masiva')

    def _pedido(self, estado='recibido'):
        return Pedido.objects.create(
            nombre_destinatario='Ana',
            direccion='Solano Vera 480',
            telefono_destinatario='3814778577',
            fecha_entrega=timezone.localdate(),
            franja_horaria='tarde',
            dedicatoria='',
            medio_pago='transferencia',
            total=Decimal('30000'),
            confirmado=True,
            estado=estado,
        )

    def test_marca_varios_pedidos_en_camino(self):
        uno, dos = self._pedido(), self._pedido('preparando')

        self.client.post(
            self.url, {'accion': 'en_camino', 'pedidos': [uno.pk, dos.pk]}
        )

        uno.refresh_from_db()
        dos.refresh_from_db()
        self.assertEqual(uno.estado, 'en_camino')
        self.assertEqual(dos.estado, 'en_camino')
        self.assertTrue(uno.eventos.filter(tipo='estado').exists())

    def test_no_toca_entregados_ni_cancelados(self):
        entregado = self._pedido('entregado')
        cancelado = self._pedido('cancelado')

        self.client.post(
            self.url,
            {'accion': 'en_camino', 'pedidos': [entregado.pk, cancelado.pk]},
        )

        entregado.refresh_from_db()
        cancelado.refresh_from_db()
        self.assertEqual(entregado.estado, 'entregado')
        self.assertEqual(cancelado.estado, 'cancelado')

    def test_accion_desconocida_no_cambia_nada(self):
        pedido = self._pedido()

        self.client.post(self.url, {'accion': 'borrar', 'pedidos': [pedido.pk]})

        pedido.refresh_from_db()
        self.assertEqual(pedido.estado, 'recibido')

    def test_vuelve_al_listado_conservando_los_filtros(self):
        pedido = self._pedido()
        volver = reverse('admin_simple:pedidos-list') + '?estado=recibido'

        respuesta = self.client.post(
            self.url,
            {'accion': 'preparando', 'pedidos': [pedido.pk], 'volver': volver},
        )

        self.assertRedirects(respuesta, volver)

    def test_ignora_un_destino_externo(self):
        pedido = self._pedido()

        respuesta = self.client.post(
            self.url,
            {
                'accion': 'preparando',
                'pedidos': [pedido.pk],
                'volver': 'https://otro-sitio.com/',
            },
        )

        self.assertRedirects(respuesta, reverse('admin_simple:pedidos-list'))


class PermisosOperadorTests(TestCase):
    """El operador maneja pedidos; la plata y el catálogo son del dueño."""

    def setUp(self):
        self.operador = User.objects.create_user(
            username='operador',
            email='operador@example.com',
            password='clave-de-prueba',
            is_staff=True,
        )
        self.categoria = Categoria.objects.create(
            nombre='Ramos', slug='ramos-permisos'
        )
        self.producto = Producto.objects.create(
            nombre='Ramo Permisos',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=30000,
            sku='PERM-ROSAS',
            stock=4,
        )
        self.client.force_login(self.operador)

    def test_el_operador_gestiona_pedidos_y_agenda(self):
        for nombre in ['pedidos-list', 'agenda', 'dashboard', 'pedido-nuevo']:
            with self.subTest(vista=nombre):
                respuesta = self.client.get(reverse(f'admin_simple:{nombre}'))
                self.assertEqual(respuesta.status_code, 200)

    def test_el_operador_no_entra_a_ventas_ni_a_productos(self):
        for nombre in ['ventas', 'productos-list', 'producto-create']:
            with self.subTest(vista=nombre):
                respuesta = self.client.get(reverse(f'admin_simple:{nombre}'))
                self.assertEqual(respuesta.status_code, 302)

    def test_el_operador_no_puede_tocar_precios_ni_stock(self):
        respuesta = self.client.post(
            reverse('admin_simple:producto-update-field', args=[self.producto.pk]),
            {'field': 'precio', 'value': '1'},
        )

        self.producto.refresh_from_db()
        self.assertEqual(respuesta.status_code, 302)
        self.assertEqual(self.producto.precio, Decimal('30000'))

    def test_el_dashboard_del_operador_no_muestra_la_facturacion(self):
        respuesta = self.client.get(reverse('admin_simple:dashboard'))

        self.assertNotContains(respuesta, 'Facturado hoy')

    def test_sin_staff_no_entra_al_panel(self):
        self.client.logout()
        miron = User.objects.create_user(
            username='cliente', email='cliente@example.com', password='clave'
        )
        self.client.force_login(miron)

        respuesta = self.client.get(reverse('admin_simple:pedidos-list'))

        self.assertEqual(respuesta.status_code, 302)


class ReposicionDeStockTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='stock-admin',
            email='stock@example.com',
            password='clave-de-prueba',
        )
        self.client.force_login(self.admin)
        self.categoria = Categoria.objects.create(nombre='Ramos', slug='ramos-stock')
        self.producto = Producto.objects.create(
            nombre='Ramo Stock',
            descripcion='Rosas.',
            categoria=self.categoria,
            precio=30000,
            sku='STOCK-ROSAS',
            stock=2,
        )
        self.url = reverse('admin_simple:producto-reponer', args=[self.producto.pk])

    def test_suma_unidades_al_stock(self):
        respuesta = self.client.post(self.url, {'unidades': '8'})

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 10)
        self.assertRedirects(respuesta, reverse('admin_simple:ventas'))

    def test_rechaza_cantidades_invalidas(self):
        for valor in ['0', '-3', 'muchas']:
            with self.subTest(valor=valor):
                self.client.post(self.url, {'unidades': valor})
                self.producto.refresh_from_db()
                self.assertEqual(self.producto.stock, 2)

    def test_el_operador_no_repone_stock(self):
        self.client.logout()
        operador = User.objects.create_user(
            username='operador-stock',
            email='operador-stock@example.com',
            password='clave',
            is_staff=True,
        )
        self.client.force_login(operador)

        self.client.post(self.url, {'unidades': '5'})

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 2)
