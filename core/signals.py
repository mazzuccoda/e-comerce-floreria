"""El horario se cachea: cualquier cambio tiene que verse en el próximo pedido."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .horario import limpiar_cache
from .models import DiaEspecial, HorarioSemanal


@receiver(post_save, sender=HorarioSemanal)
@receiver(post_save, sender=DiaEspecial)
@receiver(post_delete, sender=HorarioSemanal)
@receiver(post_delete, sender=DiaEspecial)
def invalidar_cache_horario(sender, **kwargs):
    limpiar_cache()
