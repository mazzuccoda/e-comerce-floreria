import os
import logging
from typing import Optional, Dict, Any, List

from django.core.cache import cache

from .models import Translation

logger = logging.getLogger(__name__)

# Usar requests para llamar a la API REST de Google Translate
# Esto evita problemas de autenticación con google-cloud-translate v3.x
import requests
GOOGLE_TRANSLATE_AVAILABLE = True


class TranslationService:
    """
    Servicio de traducción con caché en base de datos.
    Usa Google Translate API para traducciones automáticas.
    """
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_TRANSLATE_API_KEY')
        self.api_url = 'https://translation.googleapis.com/language/translate/v2'
        logger.info(f'🔧 Inicializando TranslationService...')
        logger.info(f'📦 GOOGLE_TRANSLATE_AVAILABLE: {GOOGLE_TRANSLATE_AVAILABLE}')
        logger.info(f'🔑 API Key configurada: {bool(self.api_key)}')
        
        if not self.api_key:
            logger.warning('⚠️ GOOGLE_TRANSLATE_API_KEY no configurada. Traducciones deshabilitadas.')
            self.client = None
        else:
            # Usar API REST directamente con requests
            self.client = True  # Marcador para indicar que el servicio está disponible
            logger.info('✅ Servicio de traducción inicializado correctamente (API REST)')
    
    def translate_text(self, text: str, target_lang: str = 'en', source_lang: str = 'es') -> str:
        """
        Traduce un texto simple con caché en DB.
        
        Args:
            text: Texto a traducir
            target_lang: Idioma destino (default: 'en')
            source_lang: Idioma origen (default: 'es')
        
        Returns:
            Texto traducido o texto original si no se puede traducir
        """
        if not text or not text.strip():
            return text
        
        # Si el idioma destino es el mismo que el origen, retornar sin traducir
        if target_lang == source_lang:
            return text
        
        # Buscar en caché de base de datos
        try:
            cached = Translation.objects.filter(
                source_text=text,
                source_lang=source_lang,
                target_lang=target_lang
            ).first()
            
            if cached:
                logger.debug(f'Traducción encontrada en caché: {text[:50]}...')
                return cached.translated_text
        except Exception as e:
            logger.error(f'Error buscando en caché: {e}')
        
        # Si no hay cliente de Google, retornar texto original
        if not self.client:
            logger.warning(f'Cliente de traducción no disponible. Retornando texto original.')
            return text
        
        # Traducir con Google Translate API REST
        try:
            logger.info(f'Traduciendo con Google API: {text[:50]}...')
            
            params = {
                'q': text,
                'target': target_lang,
                'source': source_lang,
                'key': self.api_key,
                'format': 'text'
            }
            
            response = requests.post(self.api_url, params=params)
            response.raise_for_status()
            
            result = response.json()
            translated_text = result['data']['translations'][0]['translatedText']
            
            # Guardar en caché
            try:
                Translation.objects.create(
                    source_text=text,
                    source_lang=source_lang,
                    target_lang=target_lang,
                    translated_text=translated_text
                )
                logger.info(f'Traducción guardada en caché')
            except Exception as e:
                logger.error(f'Error guardando traducción en caché: {e}')
            
            return translated_text
            
        except Exception as e:
            logger.error(f'Error traduciendo con Google API: {e}')
            return text
    
    def translate_dict(self, data: Dict[str, Any], fields: List[str], target_lang: str = 'en') -> Dict[str, Any]:
        """
        Traduce campos específicos de un diccionario.
        
        Args:
            data: Diccionario con datos
            fields: Lista de campos a traducir
            target_lang: Idioma destino
        
        Returns:
            Diccionario con campos traducidos
        """
        if target_lang == 'es':
            return data
        
        translated_data = data.copy()
        
        for field in fields:
            if field in translated_data and translated_data[field]:
                translated_data[field] = self.translate_text(
                    translated_data[field],
                    target_lang=target_lang
                )
        
        return translated_data
    
    def translate_product(self, product_data: Dict[str, Any], target_lang: str = 'en') -> Dict[str, Any]:
        """
        Traduce los campos de un producto.
        Los productos están originalmente en español en la base de datos.
        
        Args:
            product_data: Diccionario con datos del producto (originalmente en español)
            target_lang: Idioma destino ('es' para español, 'en' para inglés)
        
        Returns:
            Producto con campos traducidos
        """
        logger.info(f'🌐 translate_product llamado: target_lang={target_lang}, producto={product_data.get("nombre", "N/A")}')
        
        # Si el idioma destino es español, retornar sin traducir (ya está en español)
        if target_lang == 'es':
            logger.info(f'⏭️ Idioma es español (original), retornando sin traducir')
            return product_data
        
        if not self.client:
            logger.warning(f'⚠️ Cliente no disponible, retornando sin traducir')
            return product_data
        
        translated = product_data.copy()
        
        # Traducir campos del producto (desde español al idioma destino)
        if 'nombre' in translated and translated['nombre']:
            translated['nombre'] = self.translate_text(translated['nombre'], target_lang, source_lang='es')
        
        if 'descripcion' in translated and translated['descripcion']:
            translated['descripcion'] = self.translate_text(translated['descripcion'], target_lang, source_lang='es')
        
        if 'descripcion_corta' in translated and translated['descripcion_corta']:
            translated['descripcion_corta'] = self.translate_text(translated['descripcion_corta'], target_lang, source_lang='es')
        
        # Traducir categoría si existe (desde español)
        if 'categoria' in translated and translated['categoria']:
            if isinstance(translated['categoria'], dict) and 'nombre' in translated['categoria']:
                translated['categoria']['nombre'] = self.translate_text(
                    translated['categoria']['nombre'],
                    target_lang,
                    source_lang='es'
                )
        
        # Traducir tipo de flor si existe (desde español)
        if 'tipo_flor' in translated and translated['tipo_flor']:
            if isinstance(translated['tipo_flor'], dict) and 'nombre' in translated['tipo_flor']:
                translated['tipo_flor']['nombre'] = self.translate_text(
                    translated['tipo_flor']['nombre'],
                    target_lang,
                    source_lang='es'
                )
        
        # Traducir ocasiones si existen (desde español)
        if 'ocasiones' in translated and translated['ocasiones']:
            if isinstance(translated['ocasiones'], list):
                for ocasion in translated['ocasiones']:
                    if isinstance(ocasion, dict) and 'nombre' in ocasion:
                        ocasion['nombre'] = self.translate_text(
                            ocasion['nombre'],
                            target_lang,
                            source_lang='es'
                        )
        
        return translated
    
    def translate_products(self, products: List[Dict[str, Any]], target_lang: str = 'en') -> List[Dict[str, Any]]:
        """
        Traduce una lista de productos.
        
        Args:
            products: Lista de productos
            target_lang: Idioma destino
        
        Returns:
            Lista de productos traducidos
        """
        if target_lang == 'es':
            return products
        
        return [self.translate_product(product, target_lang) for product in products]


# Instancia singleton del servicio
translation_service = TranslationService()
