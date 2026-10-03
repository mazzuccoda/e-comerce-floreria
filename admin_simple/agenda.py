"""Agenda de entregas del panel operativo.

A diferencia de `reportes`, que mira el día en que entró el pedido, acá todo se
ordena por `fecha_entrega`: es la vista del trabajo que hay que hacer. Los
retiros en tienda se separan del reparto porque se ordenan por hora exacta y no
por franja.
"""

import calendar
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from django.db.models import Count, DecimalField, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from pedidos.models import Pedido

FRANJAS = [
    ('mañana', 'Mañana (9-12)'),
    ('tarde', 'Tarde (16-20)'),
    ('durante_el_dia', 'Durante el día'),
]

DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

_CERO = Decimal('0')
_DECIMAL = DecimalField(max_digits=14, decimal_places=2)

CERRADOS = ['entregado', 'cancelado']


@dataclass(frozen=True)
class Mes:
    anio: int
    numero: int

    @property
    def etiqueta(self) -> str:
        return f'{MESES[self.numero - 1].capitalize()} {self.anio}'

    @property
    def valor(self) -> str:
        return f'{self.anio:04d}-{self.numero:02d}'

    @property
    def primer_dia(self) -> date:
        return date(self.anio, self.numero, 1)

    @property
    def ultimo_dia(self) -> date:
        return date(self.anio, self.numero, calendar.monthrange(self.anio, self.numero)[1])

    def desplazado(self, meses: int) -> 'Mes':
        total = self.anio * 12 + (self.numero - 1) + meses
        return Mes(total // 12, total % 12 + 1)


def parse_fecha(valor):
    """Fecha del querystring (`YYYY-MM-DD`) o None si no es una fecha válida."""
    if not valor:
        return None
    try:
        return datetime.strptime(valor, '%Y-%m-%d').date()
    except ValueError:
        return None


def resolver_fecha(valor, hoy=None) -> date:
    """Fecha del querystring; hoy si viene vacía o rota."""
    return parse_fecha(valor) or hoy or timezone.localdate()


def resolver_mes(valor, hoy=None) -> Mes:
    """Mes del querystring (`YYYY-MM`); el mes actual si viene vacío o roto."""
    hoy = hoy or timezone.localdate()
    if valor:
        try:
            parseado = datetime.strptime(valor, '%Y-%m').date()
            return Mes(parseado.year, parseado.month)
        except ValueError:
            pass
    return Mes(hoy.year, hoy.month)


def entregas_abiertas():
    """Pedidos que todavía hay que trabajar (ni entregados ni cancelados)."""
    return Pedido.objects.exclude(estado__in=CERRADOS)


def _del_dia(fecha):
    return (
        Pedido.objects.exclude(estado='cancelado')
        .filter(fecha_entrega=fecha)
        .select_related('cliente')
        .prefetch_related('items__producto')
    )


def agenda_del_dia(fecha: date) -> dict:
    """Pedidos del día separados en retiros (por hora) y reparto (por franja)."""
    pedidos = list(_del_dia(fecha))

    retiros = sorted(
        (p for p in pedidos if p.tipo_envio == 'retiro'),
        key=lambda p: (p.hora_retiro is None, p.hora_retiro),
    )
    reparto = [p for p in pedidos if p.tipo_envio != 'retiro']

    grupos = []
    for clave, etiqueta in FRANJAS:
        del_grupo = [p for p in reparto if p.franja_horaria == clave]
        if del_grupo:
            grupos.append({
                'clave': clave,
                'etiqueta': etiqueta,
                'pedidos': sorted(del_grupo, key=lambda p: (p.ciudad or '', p.direccion)),
            })

    sin_franja = [p for p in reparto if p.franja_horaria not in dict(FRANJAS)]
    if sin_franja:
        grupos.append({
            'clave': 'sin_franja',
            'etiqueta': 'Sin franja asignada',
            'pedidos': sin_franja,
        })

    pendientes = [p for p in pedidos if p.estado not in CERRADOS]
    return {
        'fecha': fecha,
        'retiros': retiros,
        'grupos': grupos,
        'total': len(pedidos),
        'pendientes': len(pendientes),
        'entregados': len(pedidos) - len(pendientes),
        'facturacion': sum((p.total for p in pedidos), _CERO),
        'sin_confirmar': [p for p in pedidos if not p.confirmado],
    }


def _carga_por_dia(desde: date, hasta: date) -> dict:
    filas = (
        Pedido.objects.exclude(estado='cancelado')
        .filter(fecha_entrega__gte=desde, fecha_entrega__lte=hasta)
        .values('fecha_entrega')
        .annotate(
            pedidos=Count('id'),
            pendientes=Count('id', filter=~Q(estado__in=CERRADOS)),
            facturacion=Coalesce(Sum('total'), _CERO, output_field=_DECIMAL),
        )
    )
    return {fila['fecha_entrega']: fila for fila in filas}


def calendario_mensual(mes: Mes, hoy=None) -> list:
    """Semanas de lunes a domingo con la carga de entregas de cada día."""
    hoy = hoy or timezone.localdate()
    semanas_crudas = calendar.Calendar(firstweekday=0).monthdatescalendar(
        mes.anio, mes.numero
    )
    primero = semanas_crudas[0][0]
    ultimo = semanas_crudas[-1][-1]
    carga = _carga_por_dia(primero, ultimo)

    semanas = []
    for semana in semanas_crudas:
        dias = []
        for dia in semana:
            fila = carga.get(dia)
            dias.append({
                'fecha': dia,
                'del_mes': dia.month == mes.numero,
                'es_hoy': dia == hoy,
                'pedidos': fila['pedidos'] if fila else 0,
                'pendientes': fila['pendientes'] if fila else 0,
                'facturacion': fila['facturacion'] if fila else _CERO,
            })
        semanas.append(dias)
    return semanas


def totales_del_mes(mes: Mes) -> dict:
    resumen = (
        Pedido.objects.exclude(estado='cancelado')
        .filter(fecha_entrega__gte=mes.primer_dia, fecha_entrega__lte=mes.ultimo_dia)
        .aggregate(
            pedidos=Count('id'),
            pendientes=Count('id', filter=~Q(estado__in=CERRADOS)),
            facturacion=Coalesce(Sum('total'), _CERO, output_field=_DECIMAL),
        )
    )
    return resumen
