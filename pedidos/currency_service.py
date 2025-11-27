"""
Servicio para conversión de moneda ARS → USD
Obtiene cotización oficial del dólar y aplica margen del 15%
"""
import requests
import logging
from decimal import Decimal
from django.core.cache import cache
from django.conf import settings
import os

logger = logging.getLogger(__name__)


class CurrencyService:
    """
    Servicio para obtener cotización del dólar y convertir ARS a USD
    """
    
    # URLs de APIs de cotización (con fallback)
    BCRA_API_URL = "https://api.estadisticasbcra.com/usd_of"
    DOLAR_API_URL = "https://dolarapi.com/v1/dolares/oficial"
    
    # Tiempo de caché en segundos (1 hora)
    CACHE_TIMEOUT = 3600
    CACHE_KEY = 'usd_exchange_rate'
    
    def __init__(self):
        # Obtener margen desde settings o usar 15% por defecto
        self.margin = Decimal(os.getenv('USD_EXCHANGE_MARGIN', '1.15'))
        logger.info(f"💱 CurrencyService inicializado con margen: {self.margin}")
    
    def get_usd_rate(self, use_cache=True):
        """
        Obtiene la cotización oficial del dólar
        
        Args:
            use_cache (bool): Si usar caché o forzar actualización
            
        Returns:
            Decimal: Cotización en ARS por USD (ej: 1050.00)
        """
        # Intentar obtener del caché primero
        if use_cache:
            cached_rate = cache.get(self.CACHE_KEY)
            if cached_rate:
                logger.info(f"💰 Cotización desde caché: ${cached_rate} ARS/USD")
                return Decimal(str(cached_rate))
        
        # Si no hay caché, obtener de la API
        rate = self._fetch_rate_from_apis()
        
        if rate:
            # Guardar en caché
            cache.set(self.CACHE_KEY, float(rate), self.CACHE_TIMEOUT)
            logger.info(f"💰 Cotización actualizada: ${rate} ARS/USD (guardada en caché)")
            return rate
        
        # Si falla todo, usar cotización de emergencia
        emergency_rate = Decimal('1050.00')
        logger.warning(f"⚠️ Usando cotización de emergencia: ${emergency_rate} ARS/USD")
        return emergency_rate
    
    def _fetch_rate_from_apis(self):
        """
        Intenta obtener la cotización de múltiples APIs (con fallback)
        
        Returns:
            Decimal: Cotización o None si falla
        """
        # Intentar API del BCRA primero
        try:
            logger.info("🌐 Consultando API del BCRA...")
            response = requests.get(self.BCRA_API_URL, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                # La API devuelve un array, tomamos el último valor
                if data and len(data) > 0:
                    rate = Decimal(str(data[-1]['v']))
                    logger.info(f"✅ Cotización BCRA obtenida: ${rate}")
                    return rate
        except Exception as e:
            logger.warning(f"⚠️ Error consultando BCRA: {str(e)}")
        
        # Fallback: Intentar DolarAPI
        try:
            logger.info("🌐 Consultando DolarAPI (fallback)...")
            response = requests.get(self.DOLAR_API_URL, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                # Promedio entre compra y venta
                compra = Decimal(str(data['compra']))
                venta = Decimal(str(data['venta']))
                rate = (compra + venta) / 2
                logger.info(f"✅ Cotización DolarAPI obtenida: ${rate}")
                return rate
        except Exception as e:
            logger.warning(f"⚠️ Error consultando DolarAPI: {str(e)}")
        
        return None
    
    def convert_ars_to_usd(self, amount_ars, apply_margin=True):
        """
        Convierte un monto de ARS a USD
        
        Args:
            amount_ars (Decimal|float): Monto en pesos argentinos
            apply_margin (bool): Si aplicar el margen del 15%
            
        Returns:
            dict: {
                'amount_usd': Decimal,
                'exchange_rate': Decimal,
                'margin_applied': Decimal,
                'original_amount_ars': Decimal
            }
        """
        try:
            # Convertir a Decimal si es necesario
            amount_ars = Decimal(str(amount_ars))
            
            # Obtener cotización oficial
            official_rate = self.get_usd_rate()
            
            # Calcular monto en USD: (ARS / cotización_oficial) * margen
            # Ejemplo: $60,000 ARS / $1,000 = $60 USD → $60 * 1.15 = $69 USD
            amount_usd = amount_ars / official_rate
            
            # Aplicar margen si corresponde (aumenta el precio en USD)
            if apply_margin:
                amount_usd = amount_usd * self.margin
            
            # Calcular tasa efectiva para información
            effective_rate = official_rate / self.margin if apply_margin else official_rate
            
            # Redondear a 2 decimales (requerimiento de PayPal)
            amount_usd = amount_usd.quantize(Decimal('0.01'))
            
            result = {
                'amount_usd': amount_usd,
                'exchange_rate': official_rate,
                'effective_rate': effective_rate,
                'margin_applied': self.margin if apply_margin else Decimal('1.00'),
                'original_amount_ars': amount_ars
            }
            
            logger.info(f"💱 Conversión: ${amount_ars} ARS → ${amount_usd} USD (tasa: ${effective_rate})")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en conversión: {str(e)}")
            raise
    
    def get_conversion_info(self):
        """
        Obtiene información sobre la conversión actual
        
        Returns:
            dict: Información de cotización y margen
        """
        official_rate = self.get_usd_rate()
        # Tasa efectiva es MENOR porque dividimos por ella después de aplicar margen
        effective_rate = official_rate / self.margin
        
        return {
            'official_rate': official_rate,
            'effective_rate': effective_rate,
            'margin_percentage': (self.margin - 1) * 100,
            'margin_multiplier': self.margin,
            'last_update': 'Cotización actualizada cada hora'
        }
