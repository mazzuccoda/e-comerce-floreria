"""Validación, cotización y creación de pedidos armados por un agente de IA.

El servidor decide todo lo que cuesta plata: el precio sale del catálogo y el
envío de las zonas configuradas. Cualquier precio que mande el agente se ignora.
"""
import hashlib
import logging
import re
import secrets
import unicodedata
from datetime import date, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.db import transaction
from django.utils import timezone

from catalogo.models import Producto
from core import horario
from core.models import SiteSettings

from ..models import CarritoAbandonado, Pedido, PedidoEvento, PedidoItem, SolicitudPedidoAgente
from ..shipping_service import (
    ShippingConfig,
    distance_from_store_km,
    geocode_address,
    quote_method,
)
from .conversion_tracking import build_tracking_context, schedule_purchase_tracking

logger = logging.getLogger(__name__)

MAX_ITEMS = 10
MAX_CANTIDAD_POR_ITEM = 5
MAX_DIAS_ADELANTE = 60
MAX_DEDICATORIA = 500

FRANJAS = ('mañana', 'tarde', 'durante_el_dia')
METODOS_ENTREGA = ('express', 'programado', 'retiro')
MEDIOS_PAGO = ('mercadopago', 'paypal', 'transferencia', 'efectivo')

# Canales que no cuentan como compra publicitaria: la venta es real pero no vino
# de un anuncio, igual que los pedidos cargados a mano desde el panel.
CANALES_SIN_TRACKING = ('agente_api',)


class ErroresValidacion(Exception):
    """Lista de errores con código y sugerencia, para que el agente corrija solo."""

    def __init__(self, errores):
        self.errores = errores
        super().__init__(f'{len(errores)} error(es) de validación')

    def como_respuesta(self):
        return {'valido': False, 'errores': self.errores}


def _error(campo, codigo, mensaje, **extra):
    error = {'campo': campo, 'codigo': codigo, 'mensaje': mensaje}
    error.update(extra)
    return error


def _texto(valor, largo):
    """Texto limpio: sin caracteres de control y recortado al largo del modelo."""
    bruto = '' if valor is None else str(valor)
    limpio = ''.join(c for c in bruto if unicodedata.category(c)[0] != 'C')
    return limpio.strip()[:largo]


def _telefono(valor):
    digitos = re.sub(r'\D', '', str(valor or ''))
    return digitos if 10 <= len(digitos) <= 15 else ''


def _precio_vigente(producto) -> Decimal:
    if producto.precio_descuento and producto.precio_descuento > 0:
        return producto.precio_descuento
    return producto.precio


def _validar_items(entrada, errores):
    items_entrada = entrada.get('items')
    if not isinstance(items_entrada, list) or not items_entrada:
        errores.append(_error('items', 'dato_invalido', 'Mandá al menos un producto en items'))
        return [], Decimal('0.00')
    if len(items_entrada) > MAX_ITEMS:
        errores.append(_error('items', 'cantidad_invalida', f'Máximo {MAX_ITEMS} productos por pedido'))
        return [], Decimal('0.00')

    items = []
    total = Decimal('0.00')
    for indice, item in enumerate(items_entrada):
        campo = f'items[{indice}]'
        if not isinstance(item, dict):
            errores.append(_error(campo, 'dato_invalido', 'Cada item es un objeto con sku y cantidad'))
            continue

        sku = str(item.get('sku') or '').strip()
        try:
            cantidad = int(item.get('cantidad', 1))
        except (TypeError, ValueError):
            cantidad = 0
        if not 1 <= cantidad <= MAX_CANTIDAD_POR_ITEM:
            errores.append(_error(
                f'{campo}.cantidad', 'cantidad_invalida',
                f'La cantidad va de 1 a {MAX_CANTIDAD_POR_ITEM}',
            ))
            continue

        producto = Producto.objects.filter(sku=sku, is_active=True, precio__gt=0).first()
        if producto is None:
            errores.append(_error(
                f'{campo}.sku', 'sku_inexistente',
                f'No existe un producto activo con sku {sku}',
            ))
            continue
        if producto.stock < cantidad:
            errores.append(_error(
                f'{campo}.cantidad', 'sin_stock',
                f'Quedan {producto.stock} unidades de {producto.nombre}',
                stock=producto.stock,
            ))
            continue

        precio = _precio_vigente(producto)
        items.append({
            'producto_id': producto.id,
            'sku': producto.sku,
            'nombre': producto.nombre,
            'cantidad': cantidad,
            'precio_unitario': float(precio),
            'subtotal': float(precio * cantidad),
            'envio_gratis': producto.envio_gratis,
        })
        total += precio * cantidad

    return items, total


def _validar_fecha(entrega, errores):
    bruta = str(entrega.get('fecha') or '').strip()
    try:
        fecha = date.fromisoformat(bruta)
    except ValueError:
        errores.append(_error('entrega.fecha', 'dato_invalido', 'La fecha va en formato YYYY-MM-DD'))
        return None

    ahora = horario.ahora_local()
    hoy = ahora.date()
    proxima = horario.proxima_fecha_de_entrega(ahora)

    if fecha < hoy:
        errores.append(_error(
            'entrega.fecha', 'fecha_pasada', 'Esa fecha ya pasó',
            sugerencia=proxima.isoformat(),
        ))
        return None
    if fecha > hoy + timedelta(days=MAX_DIAS_ADELANTE):
        errores.append(_error(
            'entrega.fecha', 'dato_invalido',
            f'Como máximo se puede reservar {MAX_DIAS_ADELANTE} días hacia adelante',
        ))
        return None
    if not horario.es_dia_abierto(fecha):
        errores.append(_error(
            'entrega.fecha', 'fecha_cerrado', 'Los domingos no hay entregas',
            sugerencia=horario.proximo_dia_abierto(fecha + timedelta(days=1)).isoformat(),
        ))
        return None
    if fecha == hoy and not horario.acepta_pedidos_para_hoy(ahora):
        errores.append(_error(
            'entrega.fecha', 'fuera_de_horario',
            f'Para hoy ya pasó el corte de las {horario.HORA_CORTE_MISMO_DIA.strftime("%H:%M")}',
            sugerencia=proxima.isoformat(),
        ))
        return None
    return fecha


def _validar_vacaciones(metodo, fecha, errores):
    ajustes = SiteSettings.get_solo()
    if not ajustes.is_vacation_active():
        return
    if metodo in ('express', 'retiro'):
        errores.append(_error(
            'entrega.metodo', 'modo_vacaciones', ajustes.vacation_message,
            sugerencia='programado',
        ))
    if fecha and ajustes.reopen_date and fecha < ajustes.reopen_date:
        errores.append(_error(
            'entrega.fecha', 'modo_vacaciones', ajustes.vacation_message,
            sugerencia=ajustes.reopen_date.isoformat(),
        ))


def _validar_envio(metodo, entrega, total_productos, items, errores):
    """Costo de envío según las zonas configuradas. Nunca lo manda el agente."""
    if metodo == 'retiro':
        hora_bruta = str(entrega.get('hora_retiro') or '').strip()
        try:
            hora = time.fromisoformat(hora_bruta)
        except ValueError:
            errores.append(_error(
                'entrega.hora_retiro', 'dato_invalido',
                f'Indicá la hora de retiro (HH:MM) entre {horario.APERTURA:%H:%M} y {horario.CIERRE:%H:%M}',
            ))
            return None, None
        if not horario.APERTURA <= hora <= horario.CIERRE:
            errores.append(_error(
                'entrega.hora_retiro', 'fuera_de_horario',
                f'El local atiende de {horario.APERTURA:%H:%M} a {horario.CIERRE:%H:%M}',
            ))
            return None, None
        return hora, {'metodo': 'retiro', 'costo': 0.0, 'gratis': False, 'zona': None, 'distancia_km': None}

    direccion = _texto(entrega.get('direccion'), 255)
    if not direccion:
        errores.append(_error('entrega.direccion', 'dato_invalido', 'La dirección es obligatoria para envíos'))
        return None, None

    config = ShippingConfig.get_config()
    if not config:
        errores.append(_error('entrega.direccion', 'direccion_no_encontrada', 'No hay zonas de envío configuradas'))
        return None, None

    ciudad = _texto(entrega.get('ciudad'), 100)
    consulta = f'{direccion}, {ciudad}'.strip(', ') if ciudad else direccion
    try:
        ubicacion = geocode_address(consulta)
        distancia, _ = distance_from_store_km(config, ubicacion['lat'], ubicacion['lng'])
    except Exception as exc:
        logger.warning('AGENTE no se pudo geocodificar %r: %s', consulta, exc)
        errores.append(_error(
            'entrega.direccion', 'direccion_no_encontrada',
            'No pudimos ubicar esa dirección: agregá calle, número y ciudad',
        ))
        return None, None

    cotizacion = quote_method(metodo, distancia, order_amount=float(total_productos), cart_items=items)
    if not cotizacion.get('available'):
        errores.append(_error(
            'entrega.direccion', 'fuera_de_zona',
            'Esa dirección queda fuera de la zona de reparto',
            distancia_km=cotizacion.get('distance_km'),
            maximo_km=cotizacion.get('max_distance_km'),
        ))
        return None, None

    return None, {
        'metodo': metodo,
        'costo': float(cotizacion['shipping_cost']),
        'zona': cotizacion['zone_name'],
        'distancia_km': cotizacion['distance_km'],
        'gratis': cotizacion['is_free_shipping'],
        'direccion_resuelta': ubicacion.get('resolved_address', consulta),
    }


def _validar_contacto(entrada, errores):
    destinatario = entrada.get('destinatario') if isinstance(entrada.get('destinatario'), dict) else {}
    comprador = entrada.get('comprador') if isinstance(entrada.get('comprador'), dict) else {}
    tarjeta = entrada.get('tarjeta') if isinstance(entrada.get('tarjeta'), dict) else {}

    datos = {
        'destinatario': {
            'nombre': _texto(destinatario.get('nombre'), 100),
            'telefono': _telefono(destinatario.get('telefono')),
        },
        'comprador': {
            'nombre': _texto(comprador.get('nombre'), 100),
            'email': _texto(comprador.get('email'), 254),
            'telefono': _telefono(comprador.get('telefono')),
        },
        'tarjeta': {
            'dedicatoria': _texto(tarjeta.get('dedicatoria'), MAX_DEDICATORIA),
            'firma': _texto(tarjeta.get('firma'), 100),
            'anonimo': bool(tarjeta.get('anonimo')),
        },
    }

    for ruta, valor, mensaje in (
        ('destinatario.nombre', datos['destinatario']['nombre'], 'El nombre de quien recibe es obligatorio'),
        ('destinatario.telefono', datos['destinatario']['telefono'], 'El teléfono de quien recibe tiene que tener entre 10 y 15 dígitos'),
        ('comprador.nombre', datos['comprador']['nombre'], 'El nombre de quien compra es obligatorio'),
        ('comprador.telefono', datos['comprador']['telefono'], 'El teléfono de quien compra tiene que tener entre 10 y 15 dígitos'),
    ):
        if not valor:
            errores.append(_error(ruta, 'dato_invalido', mensaje))

    email = datos['comprador']['email']
    try:
        EmailValidator()(email)
    except ValidationError:
        errores.append(_error('comprador.email', 'dato_invalido', 'El email de quien compra no es válido'))

    return datos


def entrada_desde_parametros(parametros):
    """Traduce un query string plano al cuerpo que espera `validar_y_cotizar`.

    `items` admite dos formas: `sku` + `cantidad` para un solo producto, o
    `items=sku:cantidad,sku:cantidad` para varios. El resto de los campos son
    los mismos del JSON con punto reemplazado por guión bajo
    (`entrega.fecha` → `fecha`, `comprador.email` → `email`).
    """
    def valor(*nombres):
        for nombre in nombres:
            if parametros.get(nombre):
                return str(parametros.get(nombre))
        return ''

    items = []
    lista = valor('items')
    if lista:
        for parte in lista.split(','):
            sku, _, cantidad = parte.partition(':')
            items.append({'sku': sku.strip(), 'cantidad': cantidad.strip() or 1})
    elif valor('sku'):
        items.append({'sku': valor('sku'), 'cantidad': valor('cantidad') or 1})

    return {
        'items': items,
        'entrega': {
            'metodo': valor('metodo', 'metodo_entrega'),
            'fecha': valor('fecha'),
            'franja': valor('franja'),
            'direccion': valor('direccion'),
            'ciudad': valor('ciudad'),
            'hora_retiro': valor('hora_retiro'),
        },
        'destinatario': {
            'nombre': valor('destinatario', 'destinatario_nombre'),
            'telefono': valor('destinatario_telefono', 'telefono'),
        },
        'comprador': {
            'nombre': valor('comprador', 'comprador_nombre'),
            'email': valor('email', 'comprador_email'),
            'telefono': valor('comprador_telefono', 'telefono'),
        },
        'tarjeta': {
            'dedicatoria': valor('dedicatoria'),
            'firma': valor('firma'),
            'anonimo': valor('anonimo').lower() in ('1', 'true', 'si', 'sí'),
        },
        'medio_pago': valor('medio_pago') or 'mercadopago',
    }


def validar_y_cotizar(entrada):
    """Valida la entrada del agente y devuelve los datos normalizados con el total.

    Levanta `ErroresValidacion` con la lista completa, para que el agente corrija
    todo de una vez en lugar de ir descubriendo un error por intento.
    """
    if not isinstance(entrada, dict):
        raise ErroresValidacion([_error('', 'dato_invalido', 'El cuerpo tiene que ser un objeto JSON')])

    errores = []
    items, total_productos = _validar_items(entrada, errores)

    entrega = entrada.get('entrega') if isinstance(entrada.get('entrega'), dict) else {}
    metodo = str(entrega.get('metodo') or '').strip()
    if metodo not in METODOS_ENTREGA:
        errores.append(_error(
            'entrega.metodo', 'dato_invalido',
            f'El método de entrega es uno de: {", ".join(METODOS_ENTREGA)}',
        ))
        metodo = None

    franja = str(entrega.get('franja') or '').strip()
    if metodo == 'retiro':
        franja = franja if franja in FRANJAS else 'durante_el_dia'
    elif franja not in FRANJAS:
        errores.append(_error(
            'entrega.franja', 'franja_invalida',
            f'La franja es una de: {", ".join(FRANJAS)}',
        ))

    fecha = _validar_fecha(entrega, errores)
    if metodo:
        _validar_vacaciones(metodo, fecha, errores)

    hora_retiro = None
    envio = None
    if metodo:
        hora_retiro, envio = _validar_envio(metodo, entrega, total_productos, items, errores)

    medio_pago = str(entrada.get('medio_pago') or 'mercadopago').strip()
    if medio_pago not in MEDIOS_PAGO:
        errores.append(_error(
            'medio_pago', 'medio_pago_invalido',
            f'El medio de pago es uno de: {", ".join(MEDIOS_PAGO)}',
        ))
    elif medio_pago == 'efectivo' and metodo != 'retiro':
        errores.append(_error(
            'medio_pago', 'efectivo_sin_retiro',
            'El efectivo sólo está disponible para retiro en tienda',
            sugerencia='mercadopago',
        ))

    contacto = _validar_contacto(entrada, errores)

    if errores:
        raise ErroresValidacion(errores)

    total = total_productos + Decimal(str(envio['costo']))
    datos = {
        'items': items,
        'entrega': {
            'metodo': metodo,
            'fecha': fecha.isoformat(),
            'franja': franja,
            'direccion': _texto(entrega.get('direccion'), 255),
            'ciudad': _texto(entrega.get('ciudad'), 100),
            'instrucciones': _texto(entrega.get('instrucciones'), 200),
            'hora_retiro': hora_retiro.isoformat() if hora_retiro else None,
        },
        'envio': envio,
        'medio_pago': medio_pago,
        **contacto,
    }
    datos['total'] = float(total)
    datos['subtotal_productos'] = float(total_productos)
    datos['moneda'] = 'ARS'
    return datos


def resumen_publico(datos):
    """Lo que se le muestra a la persona (y al agente): sin ids internos."""
    return {
        'valido': True,
        'items': [
            {
                'sku': item['sku'],
                'nombre': item['nombre'],
                'cantidad': item['cantidad'],
                'precio_unitario': item['precio_unitario'],
                'subtotal': item['subtotal'],
            }
            for item in datos['items']
        ],
        'subtotal_productos': datos['subtotal_productos'],
        'envio': datos['envio'],
        'entrega': datos['entrega'],
        'destinatario': datos['destinatario'],
        'comprador': datos['comprador'],
        'tarjeta': datos['tarjeta'],
        'medio_pago': datos['medio_pago'],
        'total': datos['total'],
        'moneda': 'ARS',
    }


def _hash_ip(request):
    reenviada = request.META.get('HTTP_X_FORWARDED_FOR', '')
    ip = reenviada.split(',')[0].strip() if reenviada else request.META.get('REMOTE_ADDR', '')
    if not ip:
        return ''
    return hashlib.sha256(f'{ip}{settings.SECRET_KEY}'.encode()).hexdigest()


def nombre_del_agente(request):
    nombre = (
        request.headers.get('X-Agent-Name')
        or request.GET.get('agente')
        or request.META.get('HTTP_USER_AGENT', '')
    )
    return _texto(nombre, 80)


def crear_solicitud(datos, request, *, idempotency_key=''):
    """Guarda la solicitud: todavía no hay pedido, ni stock descontado, ni venta."""
    minutos = int(getattr(settings, 'AGENT_SOLICITUD_TTL_MIN', 120))
    return SolicitudPedidoAgente.objects.create(
        token=secrets.token_urlsafe(32),
        datos=datos,
        resumen=resumen_publico(datos),
        expira_en=timezone.now() + timedelta(minutes=minutos),
        agente_nombre=nombre_del_agente(request),
        ip_hash=_hash_ip(request),
        idempotency_key=_texto(idempotency_key, 100),
    )


def solicitud_pendiente_con_clave(clave, request):
    if not clave:
        return None
    return SolicitudPedidoAgente.objects.filter(
        idempotency_key=_texto(clave, 100),
        ip_hash=_hash_ip(request),
        estado='pendiente',
        expira_en__gt=timezone.now(),
    ).first()


@transaction.atomic
def crear_pedido(datos, *, canal, request=None, agente_nombre=''):
    """Crea el pedido real desde datos ya validados: stock, taller y seguimiento.

    Es el mismo camino que el checkout web después de confirmar: descuenta stock
    con `confirmar_pedido()` y agenda el tracking salvo en los canales que no
    cuentan como compra publicitaria.
    """
    entrega = datos['entrega']
    envio = datos['envio']
    contexto = build_tracking_context(request, datos) if request is not None else {}

    pedido = Pedido.objects.create(
        nombre_comprador=datos['comprador']['nombre'],
        email_comprador=datos['comprador']['email'],
        telefono_comprador=datos['comprador']['telefono'],
        nombre_destinatario=datos['destinatario']['nombre'],
        telefono_destinatario=datos['destinatario']['telefono'],
        direccion=entrega['direccion'],
        ciudad=entrega['ciudad'],
        fecha_entrega=entrega['fecha'],
        hora_retiro=entrega['hora_retiro'] or None,
        franja_horaria=entrega['franja'],
        tipo_envio=entrega['metodo'],
        costo_envio=Decimal(str(envio['costo'])),
        dedicatoria=datos['tarjeta']['dedicatoria'],
        firmado_como=datos['tarjeta']['firma'],
        instrucciones=entrega['instrucciones'],
        regalo_anonimo=datos['tarjeta']['anonimo'],
        medio_pago=datos['medio_pago'],
        anonimo=True,
        canal=canal,
        agente_nombre=_texto(agente_nombre, 80),
        tracking_context=contexto,
    )

    total_productos = Decimal('0.00')
    for item in datos['items']:
        producto = Producto.objects.get(id=item['producto_id'])
        precio = _precio_vigente(producto)
        PedidoItem.objects.create(
            pedido=pedido, producto=producto, cantidad=item['cantidad'], precio=precio,
        )
        total_productos += precio * item['cantidad']

    pedido.total = total_productos + pedido.costo_envio
    pedido.save()

    confirmado, mensaje = pedido.confirmar_pedido()
    if not confirmado:
        raise ErroresValidacion([_error('items', 'sin_stock', mensaje)])

    CarritoAbandonado.marcar_recuperados_por_telefono(pedido.telefono_comprador, pedido)

    PedidoEvento.objects.create(
        pedido=pedido,
        tipo='creacion',
        descripcion=(
            f'Pedido armado por {agente_nombre or "un agente de IA"} '
            f'({pedido.get_canal_display()}) y confirmado por la persona'
            if canal == 'agente'
            else f'Pedido creado por la integración {agente_nombre or "con clave"}'
        ),
    )

    if canal not in CANALES_SIN_TRACKING:
        schedule_purchase_tracking(pedido.id)

    logger.info('AGENTE pedido creado pedido=%s canal=%s agente=%s', pedido.numero, canal, agente_nombre)
    return pedido


def confirmar_solicitud(solicitud, request):
    """Revalida y crea el pedido. El llamador ya verificó el anti-bot."""
    datos_nuevos = validar_y_cotizar(_entrada_desde_datos(solicitud.datos))
    resumen_nuevo = resumen_publico(datos_nuevos)

    if resumen_nuevo['total'] != solicitud.resumen.get('total'):
        logger.info('AGENTE solicitud rechazada token=%s… motivo=precio_cambio', solicitud.token[:8])
        solicitud.resumen = resumen_nuevo
        solicitud.datos = datos_nuevos
        solicitud.save(update_fields=['resumen', 'datos'])
        return None, resumen_nuevo

    pedido = crear_pedido(
        datos_nuevos, canal='agente', request=request, agente_nombre=solicitud.agente_nombre,
    )
    solicitud.estado = 'confirmada'
    solicitud.pedido = pedido
    solicitud.datos = datos_nuevos
    solicitud.resumen = resumen_nuevo
    solicitud.save(update_fields=['estado', 'pedido', 'datos', 'resumen'])
    logger.info('AGENTE solicitud confirmada token=%s… pedido=%s', solicitud.token[:8], pedido.numero)
    return pedido, resumen_nuevo


def _entrada_desde_datos(datos):
    """Rearma la entrada original para revalidar contra precios y stock de ahora."""
    return {
        'items': [{'sku': item['sku'], 'cantidad': item['cantidad']} for item in datos['items']],
        'entrega': datos['entrega'],
        'destinatario': datos['destinatario'],
        'comprador': datos['comprador'],
        'tarjeta': datos['tarjeta'],
        'medio_pago': datos['medio_pago'],
    }


def disponibilidad(fecha_bruta):
    """Qué se puede prometer para una fecha: franjas, mismo día y próxima fecha."""
    ahora = horario.ahora_local()
    datos = {
        'hoy': ahora.date().isoformat(),
        'hora_local': ahora.strftime('%H:%M'),
        'proxima_fecha_de_entrega': horario.proxima_fecha_de_entrega(ahora).isoformat(),
        'hora_corte_mismo_dia': horario.HORA_CORTE_MISMO_DIA.strftime('%H:%M'),
        'franjas': [
            {'valor': 'mañana', 'horario': '9:00 a 12:00'},
            {'valor': 'tarde', 'horario': '16:00 a 20:00'},
            {'valor': 'durante_el_dia', 'horario': '9:00 a 20:00'},
        ],
    }

    if not fecha_bruta:
        return datos

    try:
        fecha = date.fromisoformat(str(fecha_bruta))
    except ValueError:
        datos['error'] = 'La fecha va en formato YYYY-MM-DD'
        return datos

    errores = []
    _validar_fecha({'fecha': fecha.isoformat()}, errores)
    ajustes = SiteSettings.get_solo()
    datos['fecha'] = fecha.isoformat()
    datos['disponible'] = not errores
    if errores:
        datos['motivo'] = errores[0]['codigo']
        datos['mensaje'] = errores[0]['mensaje']
        datos['sugerencia'] = errores[0].get('sugerencia')
    datos['metodos'] = (
        ['programado'] if ajustes.is_vacation_active() else list(METODOS_ENTREGA)
    )
    return datos


def marcar_vencidas():
    """Las pendientes con fecha pasada quedan vencidas (el cron sólo limpia)."""
    return SolicitudPedidoAgente.objects.filter(
        estado='pendiente', expira_en__lte=timezone.now(),
    ).update(estado='vencida')


def borrar_datos_personales(dias=7):
    """Las solicitudes viejas pierden los datos de terceros que nunca aceptaron nada."""
    limite = timezone.now() - timedelta(days=dias)
    viejas = SolicitudPedidoAgente.objects.filter(creado__lte=limite).exclude(datos={})
    total = 0
    for solicitud in viejas:
        solicitud.datos = {}
        solicitud.resumen = {}
        solicitud.save(update_fields=['datos', 'resumen'])
        total += 1
    return total
