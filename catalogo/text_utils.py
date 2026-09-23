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


# Los nombres propios ("Sol de Verano") no dicen qué se vende; el descriptor
# agrega al título del feed lo que la gente sí busca ("ramo de girasoles").
FLORES = [
    (re.compile(r'girasol', re.I), 'girasoles'),
    (re.compile(r'\brosas?\b', re.I), 'rosas'),
    (re.compile(r'lil[iy]um|lirio', re.I), 'lilium'),
    (re.compile(r'margarita', re.I), 'margaritas'),
    (re.compile(r'gerbera', re.I), 'gerberas'),
    (re.compile(r'tulip[áa]n', re.I), 'tulipanes'),
    (re.compile(r'orqu[íi]dea', re.I), 'orquídeas'),
    (re.compile(r'a?l?stroemeria|astromelia', re.I), 'astromelias'),
    (re.compile(r'crisantemo', re.I), 'crisantemos'),
    (re.compile(r'clavel', re.I), 'claveles'),
]

TIPO_POR_CATEGORIA = {
    'plantas': 'planta',
    'centros-de-mesa': 'arreglo floral',
    'floreros-preparados': 'florero con flores',
    'condolencias': 'arreglo fúnebre',
    'iglesias': 'arreglo floral para iglesia',
    'empresariales': 'arreglo floral empresarial',
}

# Las categorías de ocasión ("San Valentín", "Oferta del día") no describen el producto.
CATEGORIAS_DESCRIPTIVAS = ('ramos-de-flores', 'flores-amarillas', 'ramos-blancos')

NO_FLORAL = re.compile(r'peluche|\boso\b|globo|chocolate|bomb[óo]n|tarjeta|vino|caja de', re.I)


def product_descriptor(producto):
    """Qué es el producto en palabras buscables, o None si no corresponde."""
    nombre = clean_product_name(producto.nombre)
    if getattr(producto, 'es_adicional', False) or NO_FLORAL.search(nombre):
        return None

    categoria = getattr(producto, 'categoria', None)
    slug = getattr(categoria, 'slug', '') or ''
    tipo = TIPO_POR_CATEGORIA.get(slug, 'ramo')

    texto = ' '.join([
        nombre,
        producto.descripcion_corta or '',
        producto.descripcion or '',
    ])
    flores = [plural for patron, plural in FLORES if patron.search(texto)][:2]
    if flores:
        return '{} de {}'.format(tipo, ' y '.join(flores))

    if tipo != 'ramo':
        return tipo
    if slug in CATEGORIAS_DESCRIPTIVAS and categoria is not None:
        return 'ramo de {}'.format(categoria.nombre.lower())
    return 'ramo de flores'


def feed_title(producto):
    """Título del feed: nombre propio + descriptor buscable."""
    nombre = clean_product_name(producto.nombre)
    descriptor = product_descriptor(producto)
    titulo = '{} - {}'.format(nombre, descriptor) if descriptor else nombre
    return titulo[:150]


def normalize(texto):
    """Minúsculas sin acentos, para comparar búsquedas escritas de cualquier forma."""
    if not texto:
        return ''
    sin_acentos = unicodedata.normalize('NFKD', str(texto))
    sin_acentos = ''.join(c for c in sin_acentos if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', sin_acentos.lower()).strip()
