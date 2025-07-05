"""
Utilidades para el manejo de conexiones a la base de datos.
"""
import logging
from django.db import connection, connections, transaction
from django.db.utils import DatabaseError, InterfaceError, OperationalError
from time import sleep

logger = logging.getLogger(__name__)

def ensure_connection():
    """
    Asegura que la conexión a la base de datos esté activa.
    Si la conexión está cerrada o es None, intenta reconectar.
    """
    try:
        if connection.connection is None or connection.connection.closed != 0:
            logger.debug("Estableciendo nueva conexión a la base de datos")
            connection.connect()
            logger.debug("Conexión establecida exitosamente")
    except Exception as e:
        logger.error(f"Error al conectar a la base de datos: {str(e)}")
        raise

def close_connection():
    """
    Cierra la conexión a la base de datos de manera segura.
    """
    try:
        if connection.connection is not None:
            connection.close()
            logger.debug("Conexión cerrada exitosamente")
    except Exception as e:
        logger.warning(f"Error al cerrar la conexión: {str(e)}")

def execute_with_retry(operation, max_retries=3, initial_delay=1):
    """
    Ejecuta una operación con reintentos en caso de error de base de datos.
    
    Args:
        operation: Función que realiza la operación de base de datos
        max_retries: Número máximo de reintentos (default: 3)
        initial_delay: Tiempo de espera inicial entre reintentos en segundos (default: 1)
        
    Returns:
        El resultado de la operación si tiene éxito
        
    Raises:
        Exception: Si todos los reintentos fallan
    """
    from django.db import connection, transaction
    
    for attempt in range(max_retries):
        try:
            # Cerrar cualquier conexión existente que pueda estar en mal estado
            if connection.connection is not None:
                connection.close()
                
            # Forzar una nueva conexión
            connection.ensure_connection()
            
            # Usar una transacción atómica para la operación
            with transaction.atomic(using='default'):
                result = operation()
                return result
                
        except (DatabaseError, InterfaceError, OperationalError) as e:
            logger.warning(f"Intento {attempt + 1}/{max_retries} fallido: {str(e)}")
            
            # Cerrar la conexión en caso de error
            if connection.connection is not None:
                try:
                    connection.close()
                except Exception:
                    pass
            
            # Si es el último intento, lanzar la excepción
            if attempt == max_retries - 1:
                logger.error(f"Error después de {max_retries} intentos: {str(e)}", exc_info=True)
                raise
                
            # Calcular tiempo de espera con backoff exponencial
            sleep_time = initial_delay * (2 ** attempt)
            logger.info(f"Reintentando en {sleep_time} segundos...")
            sleep(sleep_time)
    
    # Este punto no debería alcanzarse nunca debido al raise en el bucle
    raise Exception("Error inesperado en execute_with_retry")
