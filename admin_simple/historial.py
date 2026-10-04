"""Historial del pedido: qué pasó, cuándo y quién lo hizo."""

import logging

from pedidos.models import PedidoEvento

logger = logging.getLogger(__name__)


def registrar(pedido, tipo, descripcion, usuario=None):
    """
    Deja constancia de un cambio en el pedido.

    Nunca interrumpe la operación: si el historial falla, el pedido igual
    se guardó y el error queda en los logs.
    """
    try:
        return PedidoEvento.objects.create(
            pedido=pedido,
            tipo=tipo,
            descripcion=descripcion,
            usuario=usuario if usuario and usuario.is_authenticated else None,
        )
    except Exception:
        logger.exception('No se pudo registrar el evento del pedido %s', pedido.pk)
        return None
