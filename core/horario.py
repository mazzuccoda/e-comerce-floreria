"""Horario comercial y promesa de entrega: única fuente de verdad del backend.

La API pública, el feed y cualquier texto que hable de "entrega en el día" deben
salir de acá. El frontend replica estas mismas constantes en
`frontend/utils/businessHours.ts`; si cambia algo, cambiarlo en los dos lados.

Los días con horario distinto al habitual (feriados, Día de la Madre, medio día)
se cargan en `DIAS_ESPECIALES`: una fila por fecha, que pisa al horario semanal.
"""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

ZONA_HORARIA = 'America/Argentina/Buenos_Aires'
LOCAL_TZ = ZoneInfo(ZONA_HORARIA)

APERTURA = time(9, 0)
CIERRE = time(21, 0)
# Los pedidos express confirmados antes de esta hora local se entregan el mismo día.
HORA_CORTE_MISMO_DIA = time(17, 0)

# 0 = lunes ... 6 = domingo (convención de `date.weekday()`). Domingos cerrado.
DIAS_ABIERTOS = (0, 1, 2, 3, 4, 5)

NOMBRES_DIAS = ('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')

HORARIO_TEXTO = 'Lunes a sábado de 9:00 a 21:00 hs (domingos cerrado)'
MISMO_DIA_TEXTO = (
    'Los pedidos express confirmados hasta las 17:00 (hora de Argentina) de lunes a sábado '
    'se entregan el mismo día; después de esa hora, o si el pedido se hace un domingo, '
    'la entrega pasa al próximo día hábil (los domingos no hay entregas).'
)


@dataclass(frozen=True)
class HorarioDelDia:
    """Cómo atiende el local una fecha concreta."""
    abierto: bool
    apertura: time = APERTURA
    cierre: time = CIERRE
    hora_corte: time = HORA_CORTE_MISMO_DIA
    mensaje: str = ''


CERRADO = HorarioDelDia(abierto=False)
HABITUAL = HorarioDelDia(abierto=True)

# Excepciones por fecha. Pisan al horario semanal, incluso para abrir un domingo.
DIAS_ESPECIALES: dict[date, HorarioDelDia] = {
    date(2026, 10, 18): HorarioDelDia(
        abierto=True,
        apertura=time(9, 0),
        cierre=time(13, 0),
        hora_corte=time(12, 0),
        mensaje=(
            'Día de la Madre: abrimos de 9:00 a 13:00 hs. '
            'Tomamos pedidos para entrega y retiro hasta las 12:00.'
        ),
    ),
}


def horario_de(dia: date) -> HorarioDelDia:
    """Horario vigente para una fecha: la excepción si existe, si no el semanal."""
    especial = DIAS_ESPECIALES.get(dia)
    if especial is not None:
        return especial
    return HABITUAL if dia.weekday() in DIAS_ABIERTOS else CERRADO


def ahora_local() -> datetime:
    return datetime.now(LOCAL_TZ)


def es_dia_abierto(dia: date) -> bool:
    return horario_de(dia).abierto


def proximo_dia_abierto(desde: date) -> date:
    """El primer día abierto a partir de `desde` inclusive."""
    dia = desde
    while not es_dia_abierto(dia):
        dia += timedelta(days=1)
    return dia


def acepta_pedidos_para_hoy(ahora: datetime) -> bool:
    hoy = horario_de(ahora.date())
    return hoy.abierto and ahora.time() < hoy.hora_corte


def proxima_fecha_de_entrega(ahora: datetime) -> date:
    """Fecha más próxima en la que un pedido express hecho `ahora` puede entregarse."""
    if acepta_pedidos_para_hoy(ahora):
        return ahora.date()
    return proximo_dia_abierto(ahora.date() + timedelta(days=1))


def entrega_mismo_dia(ahora: datetime | None = None) -> dict:
    """Qué puede prometer un agente ahora mismo sobre la entrega del mismo día."""
    ahora = (ahora or ahora_local()).astimezone(LOCAL_TZ)
    proxima = proxima_fecha_de_entrega(ahora)
    hoy = horario_de(ahora.date())
    datos = {
        'hora_corte': hoy.hora_corte.strftime('%H:%M'),
        'zona_horaria': ZONA_HORARIA,
        'hora_local': ahora.strftime('%Y-%m-%d %H:%M'),
        'dias_de_entrega': [NOMBRES_DIAS[d] for d in DIAS_ABIERTOS],
        'acepta_pedidos_para_hoy': acepta_pedidos_para_hoy(ahora),
        'proxima_fecha_de_entrega': proxima.isoformat(),
        'proximo_dia_de_entrega': NOMBRES_DIAS[proxima.weekday()],
        'detalle': MISMO_DIA_TEXTO,
    }
    avisos = [
        {'fecha': fecha.isoformat(), 'mensaje': especial.mensaje}
        for fecha, especial in sorted(DIAS_ESPECIALES.items())
        if especial.mensaje and ahora.date() <= fecha <= ahora.date() + timedelta(days=7)
    ]
    if avisos:
        datos['dias_especiales'] = avisos
    return datos
