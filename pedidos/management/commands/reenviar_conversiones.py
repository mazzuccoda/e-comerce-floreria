"""Reintenta el envío de compras a GA4 y Meta que quedaron pendientes.

Pensado para correr como cron (Railway Cron, cada 30 minutos):
    python manage.py reenviar_conversiones --horas 72

Para validar el payload de GA4 de un pedido sin registrar nada:
    python manage.py reenviar_conversiones --validar-ga4 <numero_pedido>

Sólo reintenta los destinos cuya marca `*_purchase_sent_at` sigue vacía; el
servicio vuelve a chequear elegibilidad y no reenvía lo que ya se envió.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from django.utils import timezone

from pedidos.models import Pedido

from pedidos.services.conversion_tracking import (
    ga4_configured,
    track_order_purchase,
    validate_ga4_payload,
)


class Command(BaseCommand):
    help = 'Reintenta los envíos de compras a GA4 y Meta pendientes de las últimas horas.'

    def add_arguments(self, parser):
        # GA4 acepta eventos de hasta 72 h atrás; Meta, hasta 7 días.
        parser.add_argument('--horas', type=int, default=72)
        parser.add_argument(
            '--validar-ga4',
            metavar='NUMERO_PEDIDO',
            help='Valida el payload de GA4 del pedido contra /debug/mp/collect. No envía nada.',
        )

    def handle(self, *args, **options):
        if options['validar_ga4']:
            return self.validar_ga4(options['validar_ga4'])

        desde = timezone.now() - timedelta(hours=options['horas'])
        pendientes = Q(ga_purchase_sent_at__isnull=True) | Q(meta_purchase_sent_at__isnull=True)
        elegibles = Q(confirmado=True) & ~Q(estado='cancelado') & ~Q(estado_pago='rejected')
        # Ya registrados como compra, o elegibles cuyo tracking nunca llegó a correr.
        ventana = Q(conversion_at__gte=desde) | Q(conversion_at__isnull=True, actualizado__gte=desde)

        ids = list(
            Pedido.objects.filter(pendientes & elegibles & ventana).order_by('pk').values_list('pk', flat=True)
        )
        for pedido_id in ids:
            track_order_purchase(pedido_id)
        self.stdout.write(f'reenviar_conversiones: {len(ids)} pedido(s) revisados')

    def validar_ga4(self, numero_pedido):
        if not ga4_configured():
            raise CommandError('Faltan GA4_MEASUREMENT_ID o GA4_API_SECRET')
        pedido = Pedido.objects.prefetch_related('items__producto').filter(numero_pedido=numero_pedido).first()
        if pedido is None:
            raise CommandError(f'No existe el pedido {numero_pedido}')
        pedido.conversion_at = pedido.conversion_at or timezone.now()
        mensajes = validate_ga4_payload(pedido).get('validationMessages', [])
        if mensajes:
            for mensaje in mensajes:
                self.stdout.write(f"{mensaje.get('fieldPath', '')}: {mensaje.get('description', '')}")
            raise CommandError('GA4 rechazó el payload')
        self.stdout.write('GA4 aceptó el payload (debug, no se registró nada)')
