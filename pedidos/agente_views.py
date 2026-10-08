"""Canal público de pedidos para agentes de IA.

El agente valida, cotiza y deja una solicitud; el pedido real se crea cuando la
persona abre el link, revisa el resumen y confirma. Ningún agente cobra.
"""
import logging

from django.db import transaction
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.throttling import (
    ConfirmacionPublicaThrottle,
    CotizacionPublicaThrottle,
    LecturaPublicaThrottle,
    PedidoPublicoThrottle,
)
from core.turnstile import verificar as verificar_turnstile

from .models import SolicitudPedidoAgente
from .services import pedido_agente

logger = logging.getLogger(__name__)

SITE_URL = 'https://floreriacristina.com.ar'

INSTRUCCIONES_AGENTE = (
    'El pedido todavía no está hecho. Mostrale el resumen a la persona y pasale '
    'confirmar_url: ahí revisa los datos, confirma y paga. No reintentes la '
    'creación; consultá estado_url.'
)


def _urls(solicitud):
    return {
        'confirmar_url': f'{SITE_URL}/es/pedido/confirmar/{solicitud.token}',
        'estado_url': f'{SITE_URL}/api/publico/pedidos/solicitud/{solicitud.token}',
    }


def _ip(request):
    reenviada = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return reenviada.split(',')[0].strip() if reenviada else request.META.get('REMOTE_ADDR', '')


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([CotizacionPublicaThrottle])
def validar_pedido(request):
    """POST /api/publico/pedidos/validar — cotiza sin guardar nada."""
    try:
        datos = pedido_agente.validar_y_cotizar(request.data)
    except pedido_agente.ErroresValidacion as invalido:
        return Response(invalido.como_respuesta(), status=422)

    logger.info(
        'AGENTE validar ok agente=%s items=%s total=%s',
        pedido_agente.nombre_del_agente(request), len(datos['items']), datos['total'],
    )
    return Response(pedido_agente.resumen_publico(datos))


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PedidoPublicoThrottle])
def crear_pedido_publico(request):
    """POST /api/publico/pedidos — deja la solicitud lista para que la confirme la persona."""
    clave = request.headers.get('Idempotency-Key', '')
    repetida = pedido_agente.solicitud_pendiente_con_clave(clave, request)
    if repetida is not None:
        return Response({
            'estado': 'pendiente_confirmacion',
            **_urls(repetida),
            'expira_en': repetida.expira_en.isoformat(),
            'resumen': repetida.resumen,
            'instrucciones_para_el_agente': INSTRUCCIONES_AGENTE,
        })

    try:
        datos = pedido_agente.validar_y_cotizar(request.data)
    except pedido_agente.ErroresValidacion as invalido:
        return Response(invalido.como_respuesta(), status=422)

    solicitud = pedido_agente.crear_solicitud(datos, request, idempotency_key=clave)
    logger.info(
        'AGENTE solicitud creada token=%s… agente=%s expira=%s',
        solicitud.token[:8], solicitud.agente_nombre, solicitud.expira_en.isoformat(),
    )
    return Response({
        'estado': 'pendiente_confirmacion',
        **_urls(solicitud),
        'expira_en': solicitud.expira_en.isoformat(),
        'resumen': solicitud.resumen,
        'instrucciones_para_el_agente': INSTRUCCIONES_AGENTE,
    }, status=201)


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([LecturaPublicaThrottle])
def estado_solicitud(request, token):
    """GET /api/publico/pedidos/solicitud/<token> — estado y resumen completo."""
    solicitud = SolicitudPedidoAgente.objects.filter(token=token).first()
    if solicitud is None:
        return Response({'error': 'No existe esa solicitud'}, status=404)

    estado = 'vencida' if solicitud.vencida else solicitud.estado
    cuerpo = {
        'estado': estado,
        'expira_en': solicitud.expira_en.isoformat(),
        'resumen': solicitud.resumen,
        'turnstile_site_key_requerida': True,
    }
    if solicitud.pedido_id:
        cuerpo['numero_pedido'] = solicitud.pedido.numero
        cuerpo['token_acceso'] = solicitud.pedido.token_acceso
        cuerpo['seguimiento_url'] = f'{SITE_URL}/es/pedido/{solicitud.pedido.token_acceso}'
    return Response(cuerpo)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ConfirmacionPublicaThrottle])
def confirmar_solicitud(request, token):
    """POST /api/publico/pedidos/solicitud/<token>/confirmar — acá nace el pedido real."""
    datos = request.data if isinstance(request.data, dict) else {}
    if not verificar_turnstile(datos.get('turnstile_token', ''), _ip(request)):
        return Response({'error': 'No pudimos verificar que seas una persona'}, status=403)

    with transaction.atomic():
        solicitud = (
            SolicitudPedidoAgente.objects.select_for_update().filter(token=token).first()
        )
        if solicitud is None:
            return Response({'error': 'No existe esa solicitud'}, status=404)

        if solicitud.estado == 'confirmada' and solicitud.pedido_id:
            pedido = solicitud.pedido
            return Response({
                'numero_pedido': pedido.numero,
                'pedido_id': pedido.id,
                'token_acceso': pedido.token_acceso,
                'medio_pago': pedido.medio_pago,
                'total': float(pedido.total),
            })

        if solicitud.vencida or solicitud.estado in ('vencida', 'rechazada'):
            if solicitud.estado == 'pendiente':
                solicitud.estado = 'vencida'
                solicitud.save(update_fields=['estado'])
            return Response({
                'error': 'Esta solicitud venció',
                'detalle': 'Pedile a tu asistente que la genere de nuevo o escribinos por WhatsApp.',
            }, status=410)

        try:
            pedido, resumen = pedido_agente.confirmar_solicitud(solicitud, request)
        except pedido_agente.ErroresValidacion as invalido:
            return Response({
                'error': 'Los datos del pedido cambiaron',
                **invalido.como_respuesta(),
            }, status=409)

        if pedido is None:
            return Response({
                'error': 'El precio cambió desde que el asistente armó el pedido',
                'resumen': resumen,
            }, status=409)

    return Response({
        'numero_pedido': pedido.numero,
        'pedido_id': pedido.id,
        'token_acceso': pedido.token_acceso,
        'medio_pago': pedido.medio_pago,
        'total': float(pedido.total),
    }, status=201)


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([LecturaPublicaThrottle])
def disponibilidad_entrega(request):
    """GET /api/publico/entrega/disponibilidad?fecha=YYYY-MM-DD"""
    return Response(pedido_agente.disponibilidad(request.query_params.get('fecha')))
