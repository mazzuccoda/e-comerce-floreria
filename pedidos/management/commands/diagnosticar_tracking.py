"""Diagnóstico del registro de una compra en GA4 y Meta.

    python manage.py diagnosticar_tracking <numero_pedido>
    python manage.py diagnosticar_tracking <numero_pedido> --enviar

Muestra qué variables están cargadas (nunca sus valores secretos), si el pedido
cuenta como compra, qué contexto de atribución se capturó y si ya se envió a
cada destino. Con --enviar, envía ahora los destinos pendientes y muestra la
respuesta (lo ya enviado no se reenvía).
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from pedidos.models import Pedido
from pedidos.services.conversion_tracking import (
    TRACKING_KEYS,
    config_summary,
    ineligible_reason,
    track_order_purchase,
)

SECRETAS = ('GA4_MEASUREMENT_ID', 'GA4_API_SECRET', 'FACEBOOK_PIXEL_ID', 'META_CAPI_ACCESS_TOKEN')
VISIBLES = ('META_GRAPH_API_VERSION', 'META_CAPI_TEST_EVENT_CODE')


def _si_no(valor):
    return 'sí' if valor else 'no'


class Command(BaseCommand):
    help = 'Diagnostica el registro de la compra de un pedido en GA4 y Meta.'

    def add_arguments(self, parser):
        parser.add_argument('numero_pedido')
        parser.add_argument('--enviar', action='store_true', help='Envía ahora los destinos pendientes.')

    def handle(self, *args, **options):
        pedido = Pedido.objects.filter(numero_pedido=options['numero_pedido']).first()
        if pedido is None:
            raise CommandError(f'No existe el pedido {options["numero_pedido"]}')

        escribir = self.stdout.write
        escribir(f'Configuración: {config_summary()}')
        for nombre in SECRETAS:
            escribir(f'  {nombre}: {_si_no(getattr(settings, nombre, ""))}')
        for nombre in VISIBLES:
            escribir(f'  {nombre}: {getattr(settings, nombre, "") or "(vacío)"}')

        motivo = ineligible_reason(pedido)
        escribir(f'\nPedido {pedido.numero_pedido} (id {pedido.id})')
        escribir(f'  medio de pago: {pedido.medio_pago} · estado: {pedido.estado} · pago: {pedido.estado_pago}')
        escribir(f'  confirmado: {_si_no(pedido.confirmado)}')
        escribir(f'  cuenta como compra: {"sí" if not motivo else f"no ({motivo})"}')
        escribir(f'  momento de la compra: {pedido.conversion_at or "-"}')
        escribir(f'  enviado a GA4: {pedido.ga_purchase_sent_at or "no"}')
        escribir(f'  enviado a Meta: {pedido.meta_purchase_sent_at or "no"}')

        contexto = pedido.tracking_context or {}
        capturado = ', '.join(
            f'{clave}={_si_no(contexto.get(clave))}'
            for clave in (*TRACKING_KEYS, 'client_ip_address', 'client_user_agent')
        )
        escribir(f'  contexto del navegador: {capturado}')

        if options['enviar']:
            escribir('\nEnviando...')
            for destino, (resultado, detalle) in track_order_purchase(pedido.id).items():
                extra = ' '.join(f'{clave}={valor}' for clave, valor in detalle.items())
                escribir(f'  {destino}: {resultado} {extra}'.rstrip())
