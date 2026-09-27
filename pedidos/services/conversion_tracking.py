"""Registro de compras desde el servidor: GA4 (Measurement Protocol) y Meta (Conversions API).

Cada pedido se envía una sola vez por destino. La marca `*_purchase_sent_at` se
reclama con un UPDATE condicional antes de enviar (así el webhook, la vista de
éxito y el checkout no pueden mandar la misma compra dos veces) y se libera si el
envío falla, para que `reenviar_conversiones` lo reintente.

Regla de negocio:
- Transferencia y efectivo: la compra cuenta al confirmar el pedido.
- Mercado Pago y PayPal: la compra cuenta cuando el pago queda aprobado.

Analytics nunca rompe una venta: timeouts cortos, sin reintentos dentro del
request y todas las excepciones capturadas. Nunca se loguean tokens, emails,
teléfonos, IPs ni payloads.
"""
import hashlib
import logging
import re
from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from catalogo.text_utils import clean_product_name

from ..models import Pedido

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 3
MEDIOS_ONLINE = ('mercadopago', 'paypal')
GA4_MAX_AGE = timedelta(hours=72)
META_MAX_AGE = timedelta(days=7)

GA4_URL = 'https://www.google-analytics.com/mp/collect'
GA4_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect'

# Claves que el checkout puede mandar en `tracking`, y largo máximo de cada valor.
TRACKING_KEYS = ('ga_client_id', 'ga_session_id', 'fbp', 'fbc', 'event_source_url')
TRACKING_MAX_LEN = 500
USER_AGENT_MAX_LEN = 512


# ---------------------------------------------------------------------------
# Contexto de atribución
# ---------------------------------------------------------------------------

def build_tracking_context(request, data) -> dict:
    """Contexto de atribución del checkout: lo que manda el navegador más IP y user agent."""
    contexto = {}
    recibido = data.get('tracking') if isinstance(data, dict) else None
    if isinstance(recibido, dict):
        for clave in TRACKING_KEYS:
            valor = recibido.get(clave)
            if isinstance(valor, (str, int, float)) and str(valor).strip():
                contexto[clave] = str(valor).strip()[:TRACKING_MAX_LEN]

    reenviada = request.META.get('HTTP_X_FORWARDED_FOR', '')
    ip = reenviada.split(',')[0].strip() if reenviada else request.META.get('REMOTE_ADDR', '')
    if ip:
        contexto['client_ip_address'] = ip[:64]
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    if user_agent:
        contexto['client_user_agent'] = user_agent[:USER_AGENT_MAX_LEN]
    return contexto


# ---------------------------------------------------------------------------
# Elegibilidad
# ---------------------------------------------------------------------------

def ineligible_reason(pedido) -> str | None:
    """None si el pedido cuenta como compra; si no, el motivo (para el log)."""
    if pedido.estado == 'cancelado':
        return 'cancelado'
    if not pedido.confirmado:
        return 'no_confirmado'
    if pedido.medio_pago in MEDIOS_ONLINE and pedido.estado_pago != 'approved':
        return 'pago_pendiente_mp' if pedido.medio_pago == 'mercadopago' else 'pago_pendiente_paypal'
    return None


# ---------------------------------------------------------------------------
# Normalización y hash para Meta
# ---------------------------------------------------------------------------

def _sha256(valor: str) -> str:
    return hashlib.sha256(valor.encode('utf-8')).hexdigest()


def normalize_email(email: str | None) -> str | None:
    email = (email or '').strip().lower()
    return email or None


def normalize_phone_ar(telefono: str | None) -> str | None:
    """
    Teléfono argentino en formato internacional sólo con dígitos: 549 + área + número.

    Acepta "+54 9 381 477-8577", "0381 15 477-8577", "381 4778577", etc. Los teléfonos
    del checkout son de WhatsApp (móviles), por eso se usa el prefijo móvil 9.
    """
    digitos = re.sub(r'\D', '', telefono or '')
    if not digitos:
        return None
    if digitos.startswith('54'):
        digitos = digitos[2:]
    digitos = digitos.lstrip('0')
    if digitos.startswith('9') and len(digitos) == 11:
        digitos = digitos[1:]
    if len(digitos) == 12:
        # Número local con el 15 después del código de área (2 a 4 dígitos).
        for largo_area in (3, 2, 4):
            if digitos[largo_area:largo_area + 2] == '15':
                digitos = digitos[:largo_area] + digitos[largo_area + 2:]
                break
    if len(digitos) != 10:
        return None
    return f'549{digitos}'


# ---------------------------------------------------------------------------
# Payloads
# ---------------------------------------------------------------------------

def _items(pedido):
    return list(pedido.items.all())


def build_ga4_payload(pedido) -> tuple[dict, bool]:
    """Payload de GA4 y si se usó un client_id sintético."""
    contexto = pedido.tracking_context or {}
    client_id = contexto.get('ga_client_id')
    sintetico = not client_id
    if sintetico:
        client_id = f'srv.{pedido.id}'

    params = {
        'transaction_id': pedido.numero_pedido,
        'value': float(pedido.total),
        'currency': 'ARS',
        'shipping': float(pedido.costo_envio or 0),
        'payment_type': pedido.medio_pago,
        'engagement_time_msec': 1,
        'items': [
            {
                # Mismo id que view_item y add_to_cart en el navegador.
                'item_id': str(item.producto_id),
                'item_name': clean_product_name(item.producto.nombre),
                'price': float(item.precio),
                'quantity': item.cantidad,
            }
            for item in _items(pedido)
        ],
    }
    if contexto.get('ga_session_id'):
        params['session_id'] = contexto['ga_session_id']

    payload = {
        'client_id': client_id,
        'timestamp_micros': int(pedido.conversion_at.timestamp() * 1_000_000),
        'events': [{'name': 'purchase', 'params': params}],
    }
    return payload, sintetico


def build_meta_payload(pedido) -> dict:
    contexto = pedido.tracking_context or {}

    user_data = {}
    email = normalize_email(pedido.email_comprador)
    if email:
        user_data['em'] = [_sha256(email)]
    telefono = normalize_phone_ar(pedido.telefono_comprador)
    if telefono:
        user_data['ph'] = [_sha256(telefono)]
    for clave in ('fbp', 'fbc', 'client_ip_address', 'client_user_agent'):
        if contexto.get(clave):
            user_data[clave] = contexto[clave]

    contents = [
        {
            # Mismo id que el g:id del feed de catálogo (el SKU).
            'id': item.producto.sku or str(item.producto_id),
            'quantity': item.cantidad,
            'item_price': float(item.precio),
        }
        for item in _items(pedido)
    ]

    evento = {
        'event_name': 'Purchase',
        # Mismo eventID que manda el Pixel en /checkout/success: Meta deduplica.
        'event_id': f'order_{pedido.numero_pedido}',
        'event_time': int(pedido.conversion_at.timestamp()),
        'action_source': 'website',
        'user_data': user_data,
        'custom_data': {
            'currency': 'ARS',
            'value': float(pedido.total),
            'order_id': pedido.numero_pedido,
            'content_type': 'product',
            'contents': contents,
            'content_ids': [c['id'] for c in contents],
        },
    }
    if contexto.get('event_source_url'):
        evento['event_source_url'] = contexto['event_source_url']

    payload = {'data': [evento]}
    if settings.META_CAPI_TEST_EVENT_CODE:
        payload['test_event_code'] = settings.META_CAPI_TEST_EVENT_CODE
    return payload


# ---------------------------------------------------------------------------
# Envío
# ---------------------------------------------------------------------------

def _log(destino, pedido, resultado, **extra):
    detalle = ''.join(f' {clave}={valor}' for clave, valor in extra.items())
    logger.info('TRACKING %-4s pedido=%s %s%s', destino, pedido.numero_pedido, resultado, detalle)


def ga4_configured() -> bool:
    return bool(settings.GA4_MEASUREMENT_ID and settings.GA4_API_SECRET)


def meta_configured() -> bool:
    return bool(settings.FACEBOOK_PIXEL_ID and settings.META_CAPI_ACCESS_TOKEN and settings.META_GRAPH_API_VERSION)


def _ga4_params():
    return {'measurement_id': settings.GA4_MEASUREMENT_ID, 'api_secret': settings.GA4_API_SECRET}


def validate_ga4_payload(pedido) -> dict:
    """Valida el payload contra /debug/mp/collect (no registra nada en GA4)."""
    payload, _ = build_ga4_payload(pedido)
    respuesta = requests.post(GA4_DEBUG_URL, params=_ga4_params(), json=payload, timeout=TIMEOUT_SECONDS)
    return respuesta.json()


def _json(respuesta) -> dict:
    try:
        data = respuesta.json()
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def _recortar(texto, largo=200) -> str:
    return ' '.join(str(texto).split())[:largo]


def send_ga4(pedido) -> tuple[bool, dict]:
    """Envía la compra a GA4. Devuelve (ok, detalle) sin datos personales."""
    payload, sintetico = build_ga4_payload(pedido)
    if sintetico:
        _log('GA4', pedido, 'fallback_client_id')
    try:
        respuesta = requests.post(
            GA4_URL,
            params=_ga4_params(),
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        return False, {'tipo': type(error).__name__}
    if not 200 <= respuesta.status_code < 300:
        return False, {'status': respuesta.status_code}
    return True, {'status': respuesta.status_code}


def send_meta(pedido) -> tuple[bool, dict]:
    """
    Envía la compra a la Conversions API. Devuelve (ok, detalle): en éxito,
    `events_received`; en error, el código y mensaje de Meta y su `fbtrace_id`
    (nunca el payload ni datos personales).
    """
    url = (
        f'https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/'
        f'{settings.FACEBOOK_PIXEL_ID}/events'
    )
    try:
        respuesta = requests.post(
            url,
            params={'access_token': settings.META_CAPI_ACCESS_TOKEN},
            json=build_meta_payload(pedido),
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        return False, {'tipo': type(error).__name__}

    data = _json(respuesta)
    if respuesta.status_code != 200:
        error = data.get('error') if isinstance(data.get('error'), dict) else {}
        detalle = {'status': respuesta.status_code}
        for clave in ('code', 'error_subcode', 'fbtrace_id'):
            if error.get(clave) is not None:
                detalle[clave] = error[clave]
        if error.get('message'):
            detalle['message'] = f'"{_recortar(error["message"])}"'
        return False, detalle

    detalle = {'status': 200}
    if 'events_received' in data:
        detalle['events_received'] = data['events_received']
    if settings.META_CAPI_TEST_EVENT_CODE:
        detalle['test_event_code'] = settings.META_CAPI_TEST_EVENT_CODE
    return True, detalle


# (nombre en el log, campo de la marca, ¿configurado?, envío, antigüedad máxima aceptada)
DESTINOS = (
    ('GA4', 'ga_purchase_sent_at', ga4_configured, send_ga4, GA4_MAX_AGE),
    ('META', 'meta_purchase_sent_at', meta_configured, send_meta, META_MAX_AGE),
)


def config_summary() -> str:
    """Estado de la configuración, sin secretos: 'GA4=on META=off test_mode=off'."""
    return 'GA4={} META={} test_mode={}'.format(
        'on' if ga4_configured() else 'off',
        'on' if meta_configured() else 'off',
        'on' if settings.META_CAPI_TEST_EVENT_CODE else 'off',
    )


def track_order_purchase(pedido_id: int) -> dict:
    """
    Envía la compra a GA4 y Meta si el pedido es elegible y el destino no la recibió.

    Devuelve {destino: (resultado, detalle)} para diagnóstico; el resultado es el
    mismo que va al log (sent, error, skipped_*).
    """
    resultados = {}
    pedido = Pedido.objects.prefetch_related('items__producto').filter(pk=pedido_id).first()
    if pedido is None:
        return resultados

    def registrar(destino, resultado, **detalle):
        _log(destino, pedido, resultado, **detalle)
        resultados[destino] = (resultado, detalle)

    motivo = ineligible_reason(pedido)
    if motivo:
        for destino, *_ in DESTINOS:
            registrar(destino, 'skipped_not_eligible', reason=motivo)
        return resultados

    ahora = timezone.now()
    Pedido.objects.filter(pk=pedido.pk, conversion_at__isnull=True).update(conversion_at=ahora)
    pedido.conversion_at = Pedido.objects.values_list('conversion_at', flat=True).get(pk=pedido.pk)

    for destino, campo, configurado, enviar, max_age in DESTINOS:
        if not configurado():
            registrar(destino, 'skipped_not_configured')
            continue
        if timezone.now() - pedido.conversion_at > max_age:
            registrar(destino, 'skipped_expired')
            continue

        reclamado = Pedido.objects.filter(pk=pedido.pk, **{f'{campo}__isnull': True}).update(**{campo: timezone.now()})
        if not reclamado:
            registrar(destino, 'skipped_already_sent')
            continue

        try:
            enviado, detalle = enviar(pedido)
        except Exception:
            logger.exception('TRACKING %-4s pedido=%s error_inesperado', destino, pedido.numero_pedido)
            enviado, detalle = False, {'tipo': 'error_inesperado'}

        if enviado:
            registrar(destino, 'sent', **detalle)
        else:
            # Libera la marca para que el comando reenviar_conversiones lo reintente.
            Pedido.objects.filter(pk=pedido.pk).update(**{campo: None})
            registrar(destino, 'error', **detalle)

    return resultados


def schedule_purchase_tracking(pedido_id: int) -> None:
    """Agenda el tracking para después del commit: si la transacción falla, no se envía nada."""
    def _run():
        try:
            track_order_purchase(pedido_id)
        except Exception:
            logger.exception('TRACKING pedido_id=%s error_inesperado', pedido_id)

    transaction.on_commit(_run)
