"""Límites de uso de la API pública, por IP.

Los endpoints públicos no tienen usuario: el cupo se cuenta por dirección IP,
con las tasas de `DEFAULT_THROTTLE_RATES` en settings.
"""
from rest_framework.throttling import SimpleRateThrottle


class _PorIP(SimpleRateThrottle):
    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class LecturaPublicaThrottle(_PorIP):
    scope = 'publico_lectura'


class CotizacionPublicaThrottle(_PorIP):
    scope = 'publico_cotizar'


class PedidoPublicoThrottle(_PorIP):
    scope = 'publico_pedido'


class ConfirmacionPublicaThrottle(_PorIP):
    scope = 'publico_confirmar'
