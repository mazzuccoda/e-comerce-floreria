"""
Utilidades para el módulo de pedidos
"""

import phonenumbers
from phonenumbers import geocoder
import logging

logger = logging.getLogger(__name__)


def normalizar_telefono_whatsapp(telefono):
    """
    Normaliza un número de teléfono al formato internacional para WhatsApp
    
    Detecta automáticamente el país y formatea el número correctamente.
    Soporta números de Argentina, España, y otros países.
    
    Args:
        telefono (str): Número en cualquier formato (con o sin código de país)
        
    Returns:
        str: Número en formato internacional sin + (ej: 5493814778577, 34934695182)
        None: Si el número es inválido o vacío
        
    Ejemplos:
        >>> normalizar_telefono_whatsapp("3814778577")
        "5493814778577"  # Argentino sin código
        
        >>> normalizar_telefono_whatsapp("34934695182")
        "34934695182"  # Español con código
        
        >>> normalizar_telefono_whatsapp("54 381 477-8577")
        "5493814778577"  # Argentino con formato
    """
    if not telefono:
        logger.warning("⚠️ Teléfono vacío recibido")
        return None
    
    # Limpiar el número (solo dígitos)
    telefono_limpio = ''.join(filter(str.isdigit, str(telefono)))
    
    if not telefono_limpio:
        logger.warning(f"⚠️ Teléfono sin dígitos: {telefono}")
        return None
    
    try:
        # Lista de regiones a intentar (orden de prioridad)
        regiones_prioritarias = ['AR', 'ES', 'US', 'MX', 'CL', 'UY', 'BR', 'CO', 'PE']
        
        # Intentar parsear con cada región
        for region in regiones_prioritarias:
            try:
                # Intentar parsear el número
                numero = phonenumbers.parse(telefono_limpio, region)
                
                # Verificar si es válido
                if phonenumbers.is_valid_number(numero):
                    # Formatear en E164 (formato internacional estándar con +)
                    numero_internacional = phonenumbers.format_number(
                        numero, 
                        phonenumbers.PhoneNumberFormat.E164
                    )
                    
                    # Obtener información del país
                    region_detectada = phonenumbers.region_code_for_number(numero)
                    pais = geocoder.description_for_number(numero, "es")
                    
                    logger.info(
                        f"✅ Teléfono normalizado: '{telefono}' → '{numero_internacional}' "
                        f"(País: {pais or region_detectada})"
                    )
                    return numero_internacional
                    
            except phonenumbers.NumberParseException:
                # Esta región no funcionó, probar la siguiente
                continue
        
        # Si no se pudo parsear con phonenumbers, aplicar heurísticas
        logger.warning(f"⚠️ No se pudo validar con phonenumbers: {telefono_limpio}")
        
        # Detectar por prefijo conocido
        if telefono_limpio.startswith('54'):
            # Ya tiene código argentino
            resultado = f"+{telefono_limpio}"
            logger.info(f"✅ Código argentino detectado: '{telefono}' → '{resultado}'")
            return resultado
            
        elif telefono_limpio.startswith('34'):
            # Código español
            resultado = f"+{telefono_limpio}"
            logger.info(f"✅ Código español detectado: '{telefono}' → '{resultado}'")
            return resultado
            
        elif telefono_limpio.startswith('1') and len(telefono_limpio) == 11:
            # Código USA/Canadá
            resultado = f"+{telefono_limpio}"
            logger.info(f"✅ Código USA/Canadá detectado: '{telefono}' → '{resultado}'")
            return resultado
            
        elif len(telefono_limpio) == 10:
            # Probablemente argentino sin código de país (ej: 3814778577)
            resultado = f"+549{telefono_limpio}"  # 549 = Argentina + móvil
            logger.info(f"✅ Asumiendo móvil argentino: '{telefono}' → '{resultado}'")
            return resultado
            
        elif len(telefono_limpio) == 9:
            # Podría ser español sin código (ej: 934695182)
            resultado = f"+34{telefono_limpio}"
            logger.info(f"⚠️ Asumiendo español: '{telefono}' → '{resultado}' (verificar manualmente)")
            return resultado
            
        else:
            # No se pudo determinar, devolver con + si no lo tiene
            resultado = f"+{telefono_limpio}" if not telefono_limpio.startswith('+') else telefono_limpio
            logger.warning(
                f"⚠️ No se pudo normalizar '{telefono}' (longitud: {len(telefono_limpio)}). "
                f"Devolviendo: {resultado}"
            )
            return resultado
            
    except Exception as e:
        logger.error(f"❌ Error normalizando teléfono '{telefono}': {e}", exc_info=True)
        # En caso de error, devolver el número limpio
        return telefono_limpio


def validar_telefono_whatsapp(telefono):
    """
    Valida si un número de teléfono es válido para WhatsApp
    
    Args:
        telefono (str): Número a validar
        
    Returns:
        tuple: (es_valido: bool, numero_normalizado: str, mensaje: str)
        
    Ejemplo:
        >>> validar_telefono_whatsapp("3814778577")
        (True, "5493814778577", "Número válido - Argentina")
    """
    if not telefono:
        return (False, None, "Número vacío")
    
    numero_normalizado = normalizar_telefono_whatsapp(telefono)
    
    if not numero_normalizado:
        return (False, None, "Número inválido")
    
    try:
        # Intentar parsear el número normalizado
        numero = phonenumbers.parse(f"+{numero_normalizado}", None)
        
        if phonenumbers.is_valid_number(numero):
            pais = phonenumbers.geocoder.description_for_number(numero, "es")
            return (True, numero_normalizado, f"Número válido - {pais}")
        else:
            return (False, numero_normalizado, "Número con formato incorrecto")
            
    except Exception as e:
        logger.warning(f"⚠️ No se pudo validar completamente: {e}")
        # Asumir válido si se pudo normalizar
        return (True, numero_normalizado, "Número normalizado (sin validación completa)")
