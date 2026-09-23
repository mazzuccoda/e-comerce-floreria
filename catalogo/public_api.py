"""API pública pensada para agentes de compra y asistentes de IA.

A diferencia de `/api/catalogo/`, estos endpoints devuelven datos ya resueltos
(nombre sin emojis, URL final del producto, precio vigente, disponibilidad) y
entienden búsquedas en lenguaje natural, con o sin acentos.
"""
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from pedidos.models import ShippingZone
from .models import Producto
from .text_utils import clean_product_name, normalize

SITE_URL = 'https://floreriacristina.com.ar'
PRODUCT_URL_TEMPLATE = SITE_URL + '/es/productos/{slug}'

# Los pedidos express confirmados antes de esta hora local se entregan el mismo día.
SAME_DAY_CUTOFF = time(17, 0)
LOCAL_TZ = ZoneInfo('America/Argentina/Buenos_Aires')

DEFAULT_LIMIT = 20
MAX_LIMIT = 50

# Categorías que nunca deben aparecer en una búsqueda de regalo/romántica.
LUTO_CATEGORIAS = ('condolencias', 'iglesias')

# Sinónimos por intención: el agente escribe "romántico" y el catálogo dice "rosas".
INTENCIONES = {
    'romantico': {
        'terminos': ('rosa', 'amor', 'pasion', 'corazon', 'romantic', 'enamorar', 'novia', 'novio', 'aniversario', 'san valentin'),
        'ocasiones': ('para enamorar',),
        'excluir_luto': True,
    },
    'cumpleanos': {
        'terminos': ('cumpleanos', 'feliz', 'festejo', 'torta', 'globo'),
        'ocasiones': ('cumpleanos',),
        'excluir_luto': True,
    },
    'condolencias': {
        'terminos': ('condolencia', 'funebre', 'pesame', 'luto', 'corona', 'sepelio'),
        'ocasiones': (),
        'excluir_luto': False,
    },
    'nacimiento': {
        'terminos': ('nacimiento', 'bebe', 'maternidad'),
        'ocasiones': (),
        'excluir_luto': True,
    },
}

# Palabras de la consulta que activan cada intención.
DISPARADORES = {
    'romantico': ('romantico', 'romantica', 'amor', 'novia', 'novio', 'pareja', 'aniversario', 'enamorado', 'enamorada', 'san valentin', 'rosas rojas'),
    'cumpleanos': ('cumpleanos', 'cumple', 'festejo'),
    'condolencias': ('condolencia', 'funebre', 'velorio', 'pesame', 'luto', 'fallecio'),
    'nacimiento': ('nacimiento', 'bebe', 'recien nacido'),
}


def _detectar_intencion(consulta):
    for intencion, disparadores in DISPARADORES.items():
        if any(d in consulta for d in disparadores):
            return intencion
    return None


def _precio_vigente(producto):
    if producto.precio_descuento and float(producto.precio_descuento) > 0:
        return float(producto.precio_descuento)
    return float(producto.precio)


def _serializar(producto):
    imagen = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
    return {
        'sku': producto.sku,
        'nombre': clean_product_name(producto.nombre),
        'descripcion': (producto.descripcion_corta or producto.descripcion or '').strip(),
        'precio': _precio_vigente(producto),
        'precio_lista': float(producto.precio),
        'moneda': 'ARS',
        'disponible': producto.stock > 0,
        'stock': producto.stock,
        'envio_gratis': producto.envio_gratis,
        'categoria': producto.categoria.nombre if producto.categoria else None,
        'ocasiones': [o.nombre for o in producto.ocasiones.all()],
        'url': PRODUCT_URL_TEMPLATE.format(slug=producto.slug),
        'imagen': imagen.imagen.url if imagen else None,
    }


def _puntaje(producto, terminos):
    """Cuántos términos de la búsqueda aparecen en el producto (nombre pesa más)."""
    nombre = normalize(clean_product_name(producto.nombre))
    texto = ' '.join(
        normalize(t) for t in (producto.descripcion, producto.descripcion_corta, producto.categoria.nombre if producto.categoria else '')
    )
    puntaje = 0
    for termino in terminos:
        if termino in nombre:
            puntaje += 3
        elif termino in texto:
            puntaje += 1
    return puntaje


@api_view(['GET'])
@permission_classes([AllowAny])
def buscar_productos(request):
    """
    GET /api/publico/productos?q=ramo romantico&precio_max=50000

    Params: q, precio_min, precio_max, categoria (slug), ocasion (nombre),
    incluir_adicionales (true/false), incluir_sin_stock (true/false), limit.
    """
    params = request.query_params
    consulta = normalize(params.get('q') or '')
    intencion = _detectar_intencion(consulta)

    productos = Producto.objects.filter(is_active=True, precio__gt=0).select_related('categoria').prefetch_related('imagenes', 'ocasiones')

    if params.get('incluir_sin_stock') != 'true':
        productos = productos.filter(stock__gt=0)

    if params.get('incluir_adicionales') != 'true':
        productos = productos.exclude(es_adicional=True)

    categoria = params.get('categoria')
    if categoria:
        productos = productos.filter(categoria__slug=categoria)

    ocasion = normalize(params.get('ocasion') or '')
    if ocasion:
        ids = [p.id for p in productos if any(ocasion in normalize(o.nombre) for o in p.ocasiones.all())]
        productos = productos.filter(id__in=ids)

    for campo, param in (('precio__gte', 'precio_min'), ('precio__lte', 'precio_max')):
        valor = params.get(param)
        if valor:
            try:
                productos = productos.filter(**{campo: float(valor)})
            except ValueError:
                return Response({'error': f'{param} debe ser un número'}, status=400)

    productos = list(productos)

    if intencion and INTENCIONES[intencion]['excluir_luto']:
        productos = [p for p in productos if not (p.categoria and p.categoria.slug in LUTO_CATEGORIAS)]

    if consulta:
        terminos = set(consulta.split())
        if intencion:
            terminos |= {normalize(t) for t in INTENCIONES[intencion]['terminos']}
        ocasiones_intencion = {normalize(o) for o in INTENCIONES[intencion]['ocasiones']} if intencion else set()

        con_puntaje = []
        for producto in productos:
            puntaje = _puntaje(producto, terminos)
            if ocasiones_intencion and any(normalize(o.nombre) in ocasiones_intencion for o in producto.ocasiones.all()):
                puntaje += 4
            if puntaje:
                con_puntaje.append((puntaje, producto))
        con_puntaje.sort(key=lambda par: (-par[0], par[1].precio))
        productos = [producto for _, producto in con_puntaje]

    try:
        limit = min(int(params.get('limit', DEFAULT_LIMIT)), MAX_LIMIT)
    except ValueError:
        limit = DEFAULT_LIMIT

    return Response({
        'consulta': params.get('q') or '',
        'intencion': intencion,
        'total': len(productos),
        'productos': [_serializar(p) for p in productos[:limit]],
        'nota_envio': 'El costo de envío no está incluido en el precio: cotizalo en POST /api/publico/envio/cotizar',
    })


def _entrega_mismo_dia(ahora: datetime) -> dict:
    """Qué puede prometer un agente ahora mismo sobre la entrega del mismo día."""
    abierto = ahora.time() < SAME_DAY_CUTOFF
    proxima = ahora.date() if abierto else (ahora + timedelta(days=1)).date()
    return {
        'hora_corte': SAME_DAY_CUTOFF.strftime('%H:%M'),
        'zona_horaria': 'America/Argentina/Buenos_Aires',
        'hora_local': ahora.strftime('%Y-%m-%d %H:%M'),
        'acepta_pedidos_para_hoy': abierto,
        'proxima_fecha_de_entrega': proxima.isoformat(),
        'detalle': (
            'Los pedidos express confirmados hasta las 17:00 se entregan el mismo día; '
            'después de esa hora la entrega pasa al día siguiente.'
        ),
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def info_tienda(request):
    """GET /api/publico/tienda — datos operativos que un agente necesita antes de recomendar."""
    zonas = [
        {
            'nombre': zona.zone_name,
            'metodo': zona.shipping_method,
            'desde_km': float(zona.min_distance_km),
            'hasta_km': float(zona.max_distance_km),
            'precio_base': float(zona.base_price),
            'precio_por_km': float(zona.price_per_km),
        }
        for zona in ShippingZone.objects.filter(is_active=True).order_by('shipping_method', 'min_distance_km')
    ]

    return Response({
        'nombre': 'Florería Cristina',
        'url': f'{SITE_URL}/es',
        'direccion': 'Solano Vera 480, Yerba Buena, Tucumán, Argentina',
        'coordenadas': {'lat': -26.8192895, 'lng': -65.3062371},
        'telefono': '+543814778577',
        'whatsapp': '+5493813671352',
        'email': 'eleososatuc@gmail.com',
        'horario': '9:00 a 20:00 hs',
        'zonas_de_entrega': ['Yerba Buena', 'San Miguel de Tucumán'],
        'metodos_de_entrega': ['express', 'programado', 'retiro'],
        'entrega_mismo_dia': _entrega_mismo_dia(datetime.now(LOCAL_TZ)),
        'medios_de_pago': ['Mercado Pago', 'PayPal', 'Transferencia bancaria', 'Efectivo (sólo al retirar en tienda)'],
        'moneda': 'ARS',
        'zonas': zonas,
        'endpoints': {
            'buscar_productos': f'{SITE_URL}/api/publico/productos?q=ramo%20romantico&precio_max=50000',
            'cotizar_envio': f'{SITE_URL}/api/publico/envio/cotizar',
            'info_tienda': f'{SITE_URL}/api/publico/tienda',
            'feed_productos': f'{SITE_URL}/feeds/facebook-products.xml',
            'sitemap': f'{SITE_URL}/sitemap.xml',
        },
        'politicas': {
            'cancelacion': 'Hasta 24 horas antes de la entrega.',
            'envio_gratis': 'Sólo en productos marcados con envío gratis o al superar el umbral configurado.',
            'tarjeta': 'La dedicatoria se escribe a mano y se entrega con el arreglo.',
            'entrega_mismo_dia': 'Pedidos express hasta las 17:00 (hora de Argentina).',
        },
    })
