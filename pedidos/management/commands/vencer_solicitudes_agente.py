"""Vence las solicitudes de pedido que nadie confirmó y borra sus datos personales.

Pensado para correr cada 30 minutos: las solicitudes guardan nombre, teléfono y
dirección de gente que nunca aceptó nada, así que no se quedan para siempre.
"""
from django.core.management.base import BaseCommand

from pedidos.services import pedido_agente


class Command(BaseCommand):
    help = 'Marca como vencidas las solicitudes de agentes sin confirmar y limpia datos viejos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias-retencion', type=int, default=7,
            help='Días que se conservan los datos personales de la solicitud (default: 7)',
        )

    def handle(self, *args, **options):
        vencidas = pedido_agente.marcar_vencidas()
        limpiadas = pedido_agente.borrar_datos_personales(options['dias_retencion'])
        self.stdout.write(self.style.SUCCESS(
            f'{vencidas} solicitud(es) vencida(s), {limpiadas} sin datos personales'
        ))
