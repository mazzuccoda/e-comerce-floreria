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


# IDs de la taxonomía de Google (taxonomy-with-ids.es-ES):
# 2899 Flores recién cortadas, 985 Casa y jardín > Plantas, 2587 Globos,
# 4748 Bombones y chocolatinas, 1259 Animales de peluche, 95 Tarjetas de felicitación.
CATEGORIA_GOOGLE_POR_PATRON = (
    (re.compile(r'peluche|\boso\b', re.I), '1259'),
    (re.compile(r'globo', re.I), '2587'),
    (re.compile(r'chocolate|bomb[óo]n', re.I), '4748'),
    (re.compile(r'tarjeta', re.I), '95'),
)
CATEGORIA_GOOGLE_FLORES_CORTADAS = '2899'
CATEGORIA_GOOGLE_PLANTAS = '985'


def google_product_category(producto):
    """Categoría de la taxonomía de Google: un ramo no es una planta."""
    nombre = clean_product_name(producto.nombre)
    for patron, categoria_google in CATEGORIA_GOOGLE_POR_PATRON:
        if patron.search(nombre):
            return categoria_google

    if producto.categoria is not None and producto.categoria.slug == 'plantas':
        return CATEGORIA_GOOGLE_PLANTAS
    return CATEGORIA_GOOGLE_FLORES_CORTADAS


def feed_description(producto, limite=5000):
    """Descripción sin comillas decorativas y cortada en palabra entera.

    `descripcion_corta` viene recortada a mitad de palabra desde el admin, así que
    se prefiere la descripción completa.
    """
    texto = producto.descripcion or producto.descripcion_corta or ''
    texto = re.sub(r'\s+', ' ', texto).strip().strip('\u201c\u201d"\u2018\u2019')
    if len(texto) <= limite:
        return texto
    recortado = texto[:limite].rsplit(' ', 1)[0]
    return recortado.rstrip(',;:.') + '…'


def normalize(texto):
    """Minúsculas sin acentos, para comparar búsquedas escritas de cualquier forma."""
    if not texto:
        return ''
    sin_acentos = unicodedata.normalize('NFKD', str(texto))
    sin_acentos = ''.join(c for c in sin_acentos if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', sin_acentos.lower()).strip()
