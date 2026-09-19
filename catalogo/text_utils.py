"""Normalización de texto para catálogo, feeds y búsquedas."""
import re
import unicodedata

EMOJI_RE = re.compile(
    '['
    '\U0001F000-\U0001FAFF'
    '\U00002600-\U000027BF'
    '\U0001F1E6-\U0001F1FF'
    '\U00002190-\U000021FF'
    '\U00002B00-\U00002BFF'
    '\U0000FE00-\U0000FE0F'
    '\U00002190-\U000021FF'
    ']+',
    flags=re.UNICODE,
)


def clean_product_name(nombre):
    """Nombre sin emojis ni espacios sobrantes, apto para feeds, SEO y agentes."""
    if not nombre:
        return ''
    limpio = EMOJI_RE.sub('', nombre)
    limpio = limpio.replace('\u200d', '').replace('\ufe0f', '')
    return re.sub(r'\s+', ' ', limpio).strip(' -·|')


def normalize(texto):
    """Minúsculas sin acentos, para comparar búsquedas escritas de cualquier forma."""
    if not texto:
        return ''
    sin_acentos = unicodedata.normalize('NFKD', str(texto))
    sin_acentos = ''.join(c for c in sin_acentos if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', sin_acentos.lower()).strip()
