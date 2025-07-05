"""
Middleware personalizado para el manejo de conexiones a la base de datos.
"""
import logging
from django.db import connection, reset_queries
from django.conf import settings

logger = logging.getLogger(__name__)

class ConnectionMiddleware:
    """
    Middleware para manejar conexiones a la base de datos de manera eficiente.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Asegurar que la conexión esté activa al inicio de la petición
        self.ensure_connection()
        
        response = self.get_response(request)
        
        # Cerrar la conexión después de procesar la respuesta
        self.close_connection()
        
        return response
    
    def ensure_connection(self):
        """Asegura que la conexión a la base de datos esté activa."""
        try:
            if connection.connection is None or connection.connection.closed != 0:
                connection.connect()
                logger.debug("Nueva conexión a la base de datos establecida")
        except Exception as e:
            logger.error(f"Error al conectar a la base de datos: {str(e)}")
            raise
    
    def close_connection(self):
        """Cierra la conexión a la base de datos de manera segura."""
        try:
            if connection.connection is not None:
                reset_queries()  # Limpiar consultas pendientes
                connection.close()
                logger.debug("Conexión a la base de datos cerrada")
        except Exception as e:
            logger.warning(f"Error al cerrar la conexión: {str(e)}")
