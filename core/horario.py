"""Horario comercial y promesa de entrega: única fuente de verdad del backend.

El horario vive en la base (`HorarioSemanal` y `DiaEspecial`, editables desde
`/admin-simple/horarios/`) y se consulta siempre por fecha con `horario_de()`:
primero la excepción del día, si no el horario semanal. Las constantes de este
módulo son sólo el valor por defecto de una base recién migrada.

La API pública, el feed y cualquier texto que hable de "entrega en el día" deben
salir de acá. El frontend lee el horario de `/api/publico/entrega/horario`.
"""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.cache import cache

ZONA_HORARIA = 'America/Argentina/Buenos_Aires'
LOCAL_TZ = ZoneInfo(ZONA_HORARIA)

APERTURA = time(9, 0)
CIERRE = time(21, 0)
# Los pedidos express confirmados antes de esta hora local se entregan el mismo día.
HORA_CORTE_MISMO_DIA = time(17, 0)

# 0 = lunes ... 6 = domingo (convención de `date.weekday()`). Domingos cerrado.
DIAS_ABIERTOS_POR_DEFECTO = (0, 1, 2, 3, 4, 5)

NOMBRES_DIAS = ('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')

CLAVE_CACHE = 'horario:semana:v1'
CLAVE_CACHE_ESPECIALES = 'horario:especiales:v1'
# Sin `CACHES` configurado la caché es local a cada proceso, así que al guardar
# desde el panel sólo se invalida ese worker: el TTL corto acota el desfasaje.
TTL_CACHE = 60


@dataclass(frozen=True)
class HorarioDelDia:
    """Cómo atiende el local una fecha concreta."""
    abierto: bool
    apertura: time = APERTURA
    cierre: time = CIERRE
    hora_corte: time = HORA_CORTE_MISMO_DIA
    acepta_retiro: bool = True
    acepta_envio: bool = True
    mensaje: str = ''
    especial: bool = False


CERRADO = HorarioDelDia(abierto=False, acepta_retiro=False, acepta_envio=False)
HABITUAL = HorarioDelDia(abierto=True)


def _desde_fila(fila, especial: bool = False) -> HorarioDelDia:
    return HorarioDelDia(
        abierto=fila.abierto,
        apertura=fila.apertura,
        cierre=fila.cierre,
        hora_corte=fila.hora_corte,
        acepta_retiro=fila.abierto and fila.acepta_retiro,
        acepta_envio=fila.abierto and fila.acepta_envio,
        mensaje=getattr(fila, 'mensaje', ''),
        especial=especial,
    )


def horario_semanal() -> dict[int, HorarioDelDia]:
    """El horario normal de cada día de la semana, cacheado."""
    cacheado = cache.get(CLAVE_CACHE)
    if cacheado is not None:
        return cacheado

    from core.models import HorarioSemanal

    semana = {
        dia: (HABITUAL if dia in DIAS_ABIERTOS_POR_DEFECTO else CERRADO)
        for dia in range(7)
    }
    try:
        for fila in HorarioSemanal.objects.all():
            semana[fila.dia] = _desde_fila(fila)
    except Exception:  # base todavía sin migrar: queda el horario por defecto
        return semana

    cache.set(CLAVE_CACHE, semana, TTL_CACHE)
    return semana


def dias_especiales() -> dict[date, HorarioDelDia]:
    """Excepciones por fecha, de hoy en adelante, cacheadas."""
    cacheado = cache.get(CLAVE_CACHE_ESPECIALES)
    if cacheado is not None:
        return cacheado

    from core.models import DiaEspecial

    desde = ahora_local().date() - timedelta(days=1)
    try:
        especiales = {
            fila.fecha: _desde_fila(fila, especial=True)
            for fila in DiaEspecial.objects.filter(fecha__gte=desde)
        }
    except Exception:  # base todavía sin migrar
        return {}

    cache.set(CLAVE_CACHE_ESPECIALES, especiales, TTL_CACHE)
    return especiales


def limpiar_cache() -> None:
    """La llaman las señales al guardar o borrar un horario."""
    cache.delete(CLAVE_CACHE)
    cache.delete(CLAVE_CACHE_ESPECIALES)


def horario_de(dia: date) -> HorarioDelDia:
    """Horario vigente para una fecha: la excepción si existe, si no el semanal."""
    especial = dias_especiales().get(dia)
    if especial is not None:
        return especial
    return horario_semanal()[dia.weekday()]


def dias_abiertos() -> tuple[int, ...]:
    """Días de la semana en los que el local atiende normalmente."""
    semana = horario_semanal()
    return tuple(dia for dia in range(7) if semana[dia].abierto)


def apertura_habitual() -> time:
    """Hora de apertura del primer día abierto de la semana."""
    semana = horario_semanal()
    abiertos = dias_abiertos()
    return semana[abiertos[0]].apertura if abiertos else APERTURA


def cierre_habitual() -> time:
    semana = horario_semanal()
    abiertos = dias_abiertos()
    return semana[abiertos[0]].cierre if abiertos else CIERRE


def semana_publica() -> list[dict]:
    """El horario semanal listo para publicar (API pública y frontend)."""
    semana = horario_semanal()
    return [
        {
            'dia': dia,
            'nombre': NOMBRES_DIAS[dia],
            'abierto': semana[dia].abierto,
            'apertura': semana[dia].apertura.strftime('%H:%M'),
            'cierre': semana[dia].cierre.strftime('%H:%M'),
            'hora_corte': semana[dia].hora_corte.strftime('%H:%M'),
            'acepta_retiro': semana[dia].acepta_retiro,
            'acepta_envio': semana[dia].acepta_envio,
        }
        for dia in range(7)
    ]


def especiales_publicos(desde: date | None = None, dias: int = 60) -> list[dict]:
    """Los días especiales próximos, listos para publicar."""
    desde = desde or ahora_local().date()
    return [
        {
            'fecha': fecha.isoformat(),
            'abierto': especial.abierto,
            'apertura': especial.apertura.strftime('%H:%M'),
            'cierre': especial.cierre.strftime('%H:%M'),
            'hora_corte': especial.hora_corte.strftime('%H:%M'),
            'acepta_retiro': especial.acepta_retiro,
            'acepta_envio': especial.acepta_envio,
            'mensaje': especial.mensaje,
        }
        for fecha, especial in sorted(dias_especiales().items())
        if desde <= fecha <= desde + timedelta(days=dias)
    ]


def horario_texto() -> str:
    """El horario habitual en una línea, para SEO y textos públicos."""
    semana = horario_semanal()
    abiertos = [dia for dia in range(7) if semana[dia].abierto]
    if not abiertos:
        return 'Cerrado temporalmente'

    tramos = []
    for inicio, fin in _tramos_consecutivos(abiertos):
        nombre = (
            NOMBRES_DIAS[inicio].capitalize() if inicio == fin
            else f'{NOMBRES_DIAS[inicio].capitalize()} a {NOMBRES_DIAS[fin]}'
        )
        horas = f'{semana[inicio].apertura:%H:%M} a {semana[inicio].cierre:%H:%M} hs'
        tramos.append(f'{nombre} de {horas}')

    cerrados = [NOMBRES_DIAS[dia] for dia in range(7) if not semana[dia].abierto]
    texto = ', '.join(tramos)
    if cerrados:
        texto += f' ({", ".join(cerrados)} cerrado)'
    return texto


def _tramos_consecutivos(dias: list[int]) -> list[tuple[int, int]]:
    tramos: list[tuple[int, int]] = []
    for dia in dias:
        if tramos and dia == tramos[-1][1] + 1:
            tramos[-1] = (tramos[-1][0], dia)
        else:
            tramos.append((dia, dia))
    return tramos


def mismo_dia_texto() -> str:
    """Cómo se explica la entrega en el día, con el corte real de la semana."""
    semana = horario_semanal()
    abiertos = [dia for dia in range(7) if semana[dia].abierto]
    if not abiertos:
        return 'Por ahora no estamos tomando pedidos.'

    corte = semana[abiertos[0]].hora_corte
    cerrados = [NOMBRES_DIAS[dia] for dia in range(7) if not semana[dia].abierto]
    detalle = (
        f'Los pedidos express confirmados hasta las {corte:%H:%M} (hora de Argentina) '
        'se entregan el mismo día; después de esa hora pasa al próximo día hábil'
    )
    if cerrados:
        detalle += f' (los {", ".join(cerrados)} no hay entregas)'
    return detalle + '.'


def ahora_local() -> datetime:
    return datetime.now(LOCAL_TZ)


def es_dia_abierto(dia: date) -> bool:
    return horario_de(dia).abierto


def proximo_dia_abierto(desde: date) -> date:
    """El primer día abierto a partir de `desde` inclusive."""
    dia = desde
    for _ in range(366):
        if es_dia_abierto(dia):
            return dia
        dia += timedelta(days=1)
    return desde


def acepta_pedidos_para_hoy(ahora: datetime) -> bool:
    hoy = horario_de(ahora.date())
    return hoy.abierto and ahora.time() < hoy.hora_corte


def proxima_fecha_de_entrega(ahora: datetime) -> date:
    """Fecha más próxima en la que un pedido express hecho `ahora` puede entregarse."""
    if acepta_pedidos_para_hoy(ahora):
        return ahora.date()
    return proximo_dia_abierto(ahora.date() + timedelta(days=1))


def avisos_proximos(desde: date, dias: int = 14) -> list[dict]:
    """Mensajes de los días especiales que caen en la próxima quincena."""
    return [
        {
            'fecha': fecha.isoformat(),
            'mensaje': especial.mensaje,
            'abierto': especial.abierto,
        }
        for fecha, especial in sorted(dias_especiales().items())
        if especial.mensaje and desde <= fecha <= desde + timedelta(days=dias)
    ]


def entrega_mismo_dia(ahora: datetime | None = None) -> dict:
    """Qué puede prometer un agente ahora mismo sobre la entrega del mismo día."""
    ahora = (ahora or ahora_local()).astimezone(LOCAL_TZ)
    proxima = proxima_fecha_de_entrega(ahora)
    hoy = horario_de(ahora.date())
    datos = {
        'hora_corte': hoy.hora_corte.strftime('%H:%M'),
        'zona_horaria': ZONA_HORARIA,
        'hora_local': ahora.strftime('%Y-%m-%d %H:%M'),
        'dias_de_entrega': [NOMBRES_DIAS[d] for d in dias_abiertos()],
        'acepta_pedidos_para_hoy': acepta_pedidos_para_hoy(ahora),
        'proxima_fecha_de_entrega': proxima.isoformat(),
        'proximo_dia_de_entrega': NOMBRES_DIAS[proxima.weekday()],
        'detalle': mismo_dia_texto(),
    }
    avisos = avisos_proximos(ahora.date())
    if avisos:
        datos['dias_especiales'] = avisos
    return datos
