"""Agregaciones de ventas para el panel operativo.

Una venta es un pedido confirmado que no está cancelado, imputada al día en que
el cliente lo generó (`creado`) y medida por el total del pedido (productos +
envío), sin esperar que el pago esté acreditado.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone

from pedidos.models import Pedido, PedidoItem

PERIODOS = [
    ('hoy', 'Hoy'),
    ('ayer', 'Ayer'),
    ('7d', 'Últimos 7 días'),
    ('30d', 'Últimos 30 días'),
    ('mes', 'Este mes'),
    ('mes_pasado', 'Mes pasado'),
    ('rango', 'Rango personalizado'),
]

PERIODO_POR_DEFECTO = '30d'

_CERO = Decimal('0')
_DECIMAL = DecimalField(max_digits=14, decimal_places=2)


@dataclass(frozen=True)
class Periodo:
    """Rango de fechas locales, inclusivo en los dos extremos."""

    clave: str
    desde: date
    hasta: date

    @property
    def dias(self) -> int:
        return (self.hasta - self.desde).days + 1

    @property
    def etiqueta(self) -> str:
        for clave, nombre in PERIODOS:
            if clave == self.clave and clave != 'rango':
                return nombre
        if self.desde == self.hasta:
            return self.desde.strftime('%d/%m/%Y')
        return f"{self.desde.strftime('%d/%m/%Y')} al {self.hasta.strftime('%d/%m/%Y')}"

    def anterior(self) -> 'Periodo':
        """Período inmediatamente previo, del mismo largo."""
        dias = self.dias
        hasta = self.desde - timedelta(days=1)
        return Periodo(
            clave=self.clave, desde=hasta - timedelta(days=dias - 1), hasta=hasta
        )


def _parsear_fecha(valor):
    if not valor:
        return None
    try:
        return datetime.strptime(valor, '%Y-%m-%d').date()
    except ValueError:
        return None


def resolver_periodo(clave, desde=None, hasta=None, hoy=None) -> Periodo:
    """Traduce los parámetros del querystring a un rango de fechas locales."""
    hoy = hoy or timezone.localdate()
    desde_fecha = _parsear_fecha(desde)
    hasta_fecha = _parsear_fecha(hasta)

    if desde_fecha or hasta_fecha:
        clave = 'rango'

    if clave not in dict(PERIODOS):
        clave = PERIODO_POR_DEFECTO

    if clave == 'hoy':
        return Periodo(clave, hoy, hoy)
    if clave == 'ayer':
        ayer = hoy - timedelta(days=1)
        return Periodo(clave, ayer, ayer)
    if clave == '7d':
        return Periodo(clave, hoy - timedelta(days=6), hoy)
    if clave == '30d':
        return Periodo(clave, hoy - timedelta(days=29), hoy)
    if clave == 'mes':
        return Periodo(clave, hoy.replace(day=1), hoy)
    if clave == 'mes_pasado':
        primero_de_este_mes = hoy.replace(day=1)
        fin = primero_de_este_mes - timedelta(days=1)
        return Periodo(clave, fin.replace(day=1), fin)

    desde_fecha = desde_fecha or hasta_fecha or hoy
    hasta_fecha = hasta_fecha or desde_fecha
    if hasta_fecha < desde_fecha:
        desde_fecha, hasta_fecha = hasta_fecha, desde_fecha
    return Periodo('rango', desde_fecha, hasta_fecha)


def pedidos_vendidos():
    """Pedidos que cuentan como venta, sin filtro de fechas."""
    return Pedido.objects.filter(confirmado=True).exclude(estado='cancelado')


def _limites(periodo: Periodo):
    tz = timezone.get_current_timezone()
    inicio = timezone.make_aware(datetime.combine(periodo.desde, time.min), tz)
    fin = timezone.make_aware(
        datetime.combine(periodo.hasta + timedelta(days=1), time.min), tz
    )
    return inicio, fin


def ventas_del_periodo(periodo: Periodo):
    inicio, fin = _limites(periodo)
    return pedidos_vendidos().filter(creado__gte=inicio, creado__lt=fin)


def _suma(queryset, campo):
    total = queryset.aggregate(valor=Sum(campo))['valor']
    return total if total is not None else _CERO


def totales(periodo: Periodo) -> dict:
    """Facturación, pedidos, ticket promedio, unidades y desglose envío/productos."""
    ventas = ventas_del_periodo(periodo)
    resumen = ventas.aggregate(
        facturacion=Coalesce(Sum('total'), _CERO, output_field=_DECIMAL),
        envio=Coalesce(Sum('costo_envio'), _CERO, output_field=_DECIMAL),
        cobrado=Coalesce(
            Sum('total', filter=Q(estado_pago='approved')), _CERO, output_field=_DECIMAL
        ),
        pedidos=Count('id'),
    )
    unidades = PedidoItem.objects.filter(pedido__in=ventas).aggregate(
        total=Coalesce(Sum('cantidad'), 0)
    )['total']

    pedidos = resumen['pedidos']
    facturacion = resumen['facturacion']
    return {
        'facturacion': facturacion,
        'productos': facturacion - resumen['envio'],
        'envio': resumen['envio'],
        'cobrado': resumen['cobrado'],
        'por_cobrar': facturacion - resumen['cobrado'],
        'pedidos': pedidos,
        'unidades': unidades,
        'ticket': (facturacion / pedidos) if pedidos else _CERO,
    }


def variacion(actual, anterior):
    """Variación porcentual contra el período previo. None si no hay base."""
    if not anterior:
        return None
    return round((Decimal(actual) - Decimal(anterior)) / Decimal(anterior) * 100, 1)


def comparativa(periodo: Periodo) -> dict:
    actual = totales(periodo)
    anterior = totales(periodo.anterior())
    return {
        'actual': actual,
        'anterior': anterior,
        'variacion': {
            clave: variacion(actual[clave], anterior[clave])
            for clave in ('facturacion', 'pedidos', 'ticket', 'unidades')
        },
    }


def serie_diaria(periodo: Periodo) -> list:
    """Una entrada por día del período, con los días sin ventas en cero."""
    filas = (
        ventas_del_periodo(periodo)
        .annotate(dia=TruncDate('creado'))
        .values('dia')
        .annotate(
            facturacion=Coalesce(Sum('total'), _CERO, output_field=_DECIMAL),
            pedidos=Count('id'),
        )
    )
    por_dia = {fila['dia']: fila for fila in filas}
    maximo = max((fila['facturacion'] for fila in filas), default=_CERO)

    serie = []
    dia = periodo.desde
    while dia <= periodo.hasta:
        fila = por_dia.get(dia)
        facturacion = fila['facturacion'] if fila else _CERO
        serie.append({
            'dia': dia,
            'facturacion': facturacion,
            'pedidos': fila['pedidos'] if fila else 0,
            'altura': int(facturacion / maximo * 100) if maximo else 0,
        })
        dia += timedelta(days=1)
    return serie


def _desglose(periodo: Periodo, campo, etiquetas):
    ventas = ventas_del_periodo(periodo)
    total = _suma(ventas, 'total')
    filas = (
        ventas.values(campo)
        .annotate(
            facturacion=Coalesce(Sum('total'), _CERO, output_field=_DECIMAL),
            pedidos=Count('id'),
        )
        .order_by('-facturacion')
    )
    return [
        {
            'clave': fila[campo] or 'sin_dato',
            'etiqueta': etiquetas.get(fila[campo], 'Sin especificar'),
            'facturacion': fila['facturacion'],
            'pedidos': fila['pedidos'],
            'porcentaje': int(fila['facturacion'] / total * 100) if total else 0,
        }
        for fila in filas
    ]


def desglose_medio_pago(periodo: Periodo) -> list:
    return _desglose(periodo, 'medio_pago', dict(Pedido.MEDIOS_PAGO))


def desglose_tipo_envio(periodo: Periodo) -> list:
    etiquetas = dict(Pedido._meta.get_field('tipo_envio').choices or [])
    return _desglose(periodo, 'tipo_envio', etiquetas)


def top_productos(periodo: Periodo, limite=10) -> list:
    """Productos más vendidos del período, con el stock actual al lado."""
    ventas = ventas_del_periodo(periodo)
    filas = (
        PedidoItem.objects.filter(pedido__in=ventas)
        .values('producto_id', 'producto__nombre', 'producto__stock')
        .annotate(
            unidades=Coalesce(Sum('cantidad'), 0),
            facturacion=Coalesce(
                Sum(F('precio') * F('cantidad'), output_field=_DECIMAL), _CERO,
                output_field=_DECIMAL,
            ),
        )
        .order_by('-unidades', '-facturacion')[:limite]
    )
    return [
        {
            'producto_id': fila['producto_id'],
            'nombre': fila['producto__nombre'],
            'stock': fila['producto__stock'],
            'unidades': fila['unidades'],
            'facturacion': fila['facturacion'],
        }
        for fila in filas
    ]


def pedidos_que_necesitan_atencion(horas_pago=48, hoy=None) -> dict:
    """Pedidos con cobro demorado y entregas pasadas sin cerrar."""
    hoy = hoy or timezone.localdate()
    limite = timezone.now() - timedelta(hours=horas_pago)
    abiertos = ~Q(estado__in=['entregado', 'cancelado'])

    pago_demorado = (
        pedidos_vendidos()
        .filter(estado_pago='pendiente', creado__lt=limite)
        .order_by('creado')
    )
    entregas_atrasadas = (
        Pedido.objects.filter(fecha_entrega__lt=hoy)
        .filter(abiertos)
        .order_by('fecha_entrega')
    )
    return {
        'horas_pago': horas_pago,
        'pago_demorado': list(pago_demorado[:10]),
        'pago_demorado_total': pago_demorado.count(),
        'entregas_atrasadas': list(entregas_atrasadas[:10]),
        'entregas_atrasadas_total': entregas_atrasadas.count(),
    }


def resumen_de_hoy(hoy=None) -> dict:
    """Los tres números que el panel muestra arriba del dashboard."""
    hoy = hoy or timezone.localdate()
    periodo = Periodo('hoy', hoy, hoy)
    del_dia = totales(periodo)
    entregas = (
        Pedido.objects.filter(fecha_entrega=hoy)
        .exclude(estado__in=['entregado', 'cancelado'])
        .count()
    )
    return {
        'facturacion': del_dia['facturacion'],
        'pedidos': del_dia['pedidos'],
        'entregas_pendientes': entregas,
    }


def filas_csv(periodo: Periodo):
    """Encabezado y filas del export de ventas del período."""
    yield [
        'Numero', 'Fecha pedido', 'Fecha entrega', 'Destinatario', 'Ciudad',
        'Medio de pago', 'Estado pago', 'Estado', 'Productos', 'Envio', 'Total',
    ]
    ventas = ventas_del_periodo(periodo).order_by('creado')
    for pedido in ventas:
        yield [
            pedido.numero_pedido or pedido.id,
            timezone.localtime(pedido.creado).strftime('%d/%m/%Y %H:%M'),
            pedido.fecha_entrega.strftime('%d/%m/%Y') if pedido.fecha_entrega else '',
            pedido.nombre_destinatario,
            pedido.ciudad or '',
            pedido.get_medio_pago_display(),
            pedido.get_estado_pago_display(),
            pedido.get_estado_display(),
            f'{pedido.total - pedido.costo_envio:.2f}',
            f'{pedido.costo_envio:.2f}',
            f'{pedido.total:.2f}',
        ]
