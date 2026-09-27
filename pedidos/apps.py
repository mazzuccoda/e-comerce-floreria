import logging

from django.apps import AppConfig

logger = logging.getLogger('pedidos.services.conversion_tracking')


class PedidosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pedidos'

    def ready(self):
        # Una línea al arrancar para ver en los logs qué tracking está activo.
        from .services.conversion_tracking import config_summary

        logger.info('TRACKING config %s', config_summary())
