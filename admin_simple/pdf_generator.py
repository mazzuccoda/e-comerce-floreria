"""
Hoja de pedido imprimible: taller, tarjeta de dedicatoria y talón del repartidor
en una sola A4, separados por dos líneas de corte.
"""
import os
from html import escape
from io import BytesIO
from urllib.parse import quote_plus

from django.conf import settings
from pedidos.models import ShippingConfig
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
import requests

TINTA = colors.HexColor('#2d3748')
TINTA_SUAVE = colors.HexColor('#718096')
COBRO = colors.HexColor('#c53030')
ROSA = colors.HexColor('#fdf2f4')
BORDE = colors.HexColor('#cbd5e0')

ANCHO_UTIL = 18 * cm
ALTO_TARJETA = 7 * cm
DIAS = ('LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO')
MANUSCRITA = 'Caveat'
RUTA_MANUSCRITA = os.path.join(os.path.dirname(__file__), 'fonts', 'Caveat-Regular.ttf')


def _fuente_manuscrita():
    """Registra la letra de la tarjeta; si falta el archivo, cae en la cursiva de sistema."""
    if MANUSCRITA in pdfmetrics.getRegisteredFontNames():
        return MANUSCRITA
    try:
        pdfmetrics.registerFont(TTFont(MANUSCRITA, RUTA_MANUSCRITA))
        return MANUSCRITA
    except Exception:
        return 'Helvetica-Oblique'


def _imagen_remota(url, lado):
    """La foto del producto; una hoja sin foto se imprime igual que una con foto."""
    if not url or url.startswith('https://via.placeholder.com'):
        return None
    try:
        respuesta = requests.get(url, timeout=10)
        if respuesta.status_code != 200:
            return None
        return Image(BytesIO(respuesta.content), width=lado, height=lado)
    except Exception:
        return None


def _texto_de_tarjeta(texto):
    """Baja a minúscula las dedicatorias escritas enteras en mayúscula."""
    letras = [c for c in texto if c.isalpha()]
    if not letras or sum(1 for c in letras if c.isupper()) < len(letras) * 0.7:
        return texto

    resultado = []
    inicio_de_oracion = True
    for caracter in texto.lower():
        resultado.append(caracter.upper() if inicio_de_oracion and caracter.isalpha() else caracter)
        if caracter.isalpha() or caracter.isdigit():
            inicio_de_oracion = False
        elif caracter in '.!?¡¿\n':
            inicio_de_oracion = True
    return ''.join(resultado)


def _dia_y_fecha(fecha):
    return f'{DIAS[fecha.weekday()]} {fecha.strftime("%d/%m")}'


def _cuando(pedido):
    """Cuándo sale el pedido, con la hora elegida cuando el cliente retira."""
    if pedido.tipo_envio == 'retiro' and pedido.hora_retiro:
        return pedido.hora_retiro.strftime('%H:%M')
    return pedido.get_franja_horaria_display() or 'A coordinar'


def _modalidad(pedido):
    return {
        'retiro': 'RETIRA EN EL LOCAL',
        'express': 'ENVÍO EXPRESS',
        'programado': 'ENVÍO PROGRAMADO',
    }.get(pedido.tipo_envio, 'ENVÍO')


def _direccion_de_entrega(pedido):
    """La dirección a la que hay que ir: la del local cuando el pedido se retira."""
    if pedido.tipo_envio == 'retiro':
        config = ShippingConfig.get_config()
        local = getattr(config, 'store_address', '') or 'Solano Vera 480'
        if 'tucum' not in local.lower():
            local = f'{local}, Yerba Buena, Tucumán'
        return local
    partes = [pedido.direccion or '', pedido.ciudad or '', 'Tucumán, Argentina']
    return ', '.join(parte for parte in partes if parte)


def _linea_de_corte(estilo):
    """Dos milímetros de tijera: lo que está debajo se corta y viaja solo."""
    return [
        Spacer(1, 0.35 * cm),
        HRFlowable(width='100%', thickness=0.7, color=BORDE, dash=(3, 3)),
        Paragraph('cortar por aquí', estilo),
    ]


def _codigo_qr(url, lado):
    """QR con la dirección: el repartidor la abre en el mapa sin tipear nada."""
    if not url:
        return None
    widget = qr.QrCodeWidget(url, barLevel='M')
    limites = widget.getBounds()
    ancho = limites[2] - limites[0]
    alto = limites[3] - limites[1]
    dibujo = Drawing(lado, lado, transform=[lado / ancho, 0, 0, lado / alto, 0, 0])
    dibujo.add(widget)
    return dibujo


def _mapa_estatico(direccion, lado):
    """Mini mapa impreso para ubicarse antes de salir; sin API key no se imprime."""
    clave = getattr(settings, 'GOOGLE_MAPS_API_KEY', '') or ''
    if not clave or not direccion:
        return None
    destino = quote_plus(direccion)
    url = (
        'https://maps.googleapis.com/maps/api/staticmap'
        f'?center={destino}&zoom=15&size=320x320&scale=2&maptype=roadmap'
        f'&markers=color:0xc53030%7C{destino}&key={clave}'
    )
    return _imagen_remota(url, lado)


def generar_pdf_pedido(pedido):
    """Hoja de trabajo del pedido: taller arriba, tarjeta al medio, talón abajo."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title=f'Pedido {pedido.numero}',
    )

    base = getSampleStyleSheet()['Normal']
    manuscrita = _fuente_manuscrita()

    numero_style = ParagraphStyle(
        'Numero', parent=base, fontName='Helvetica-Bold', fontSize=26, leading=28, textColor=TINTA,
    )
    cuando_style = ParagraphStyle(
        'Cuando', parent=base, fontName='Helvetica-Bold', fontSize=16, leading=19,
        alignment=TA_RIGHT, textColor=TINTA,
    )
    producto_style = ParagraphStyle(
        'Producto', parent=base, fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=TINTA,
    )
    normal_style = ParagraphStyle(
        'Cuerpo', parent=base, fontName='Helvetica', fontSize=10, leading=14, textColor=TINTA,
    )
    etiqueta_style = ParagraphStyle(
        'Etiqueta', parent=base, fontName='Helvetica-Bold', fontSize=8, leading=11,
        textColor=TINTA_SUAVE,
    )
    corte_style = ParagraphStyle(
        'Corte', parent=base, fontName='Helvetica', fontSize=7, leading=9,
        alignment=TA_LEFT, textColor=TINTA_SUAVE, spaceBefore=1,
    )
    dedicatoria_style = ParagraphStyle(
        'Dedicatoria', parent=base, fontName=manuscrita, fontSize=19, leading=25,
        alignment=TA_CENTER, textColor=TINTA,
    )
    firma_style = ParagraphStyle(
        'Firma', parent=dedicatoria_style, fontSize=17, leading=21, alignment=TA_RIGHT,
    )
    talon_style = ParagraphStyle(
        'Talon', parent=base, fontName='Helvetica', fontSize=11, leading=15, textColor=TINTA,
    )
    telefono_style = ParagraphStyle(
        'Telefono', parent=base, fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=TINTA,
    )
    recibo_style = ParagraphStyle(
        'Recibo', parent=base, fontName='Helvetica', fontSize=9, leading=14,
        textColor=TINTA_SUAVE,
    )
    cobro_style = ParagraphStyle(
        'Cobro', parent=base, fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=COBRO,
    )

    story = []

    # === TALLER: qué armar y para cuándo (sin precios: esta parte queda en la mesa) ===
    story.append(Table(
        [[
            Paragraph(f'PEDIDO #{escape(pedido.numero)}', numero_style),
            Paragraph(
                f'{_dia_y_fecha(pedido.fecha_entrega)}<br/>{escape(_cuando(pedido))}',
                cuando_style,
            ),
        ]],
        colWidths=[ANCHO_UTIL * 0.55, ANCHO_UTIL * 0.45],
        style=TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('LINEBELOW', (0, 0), (-1, -1), 1.5, TINTA),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]),
    ))
    story.append(Spacer(1, 0.4 * cm))

    items = list(pedido.items.all())
    lado_foto = 6 * cm if len(items) == 1 else 3.6 * cm
    filas = []
    for item in items:
        producto = item.producto
        foto = _imagen_remota(getattr(producto, 'get_primary_image_url', ''), lado_foto)
        detalle = [Paragraph(escape(producto.nombre), producto_style)]
        if item.cantidad > 1:
            detalle.append(Paragraph(f'<b>{item.cantidad} unidades</b>', normal_style))
        descriptor = (getattr(producto, 'descripcion', '') or '').strip()
        if descriptor:
            detalle.append(Paragraph(escape(descriptor[:180]), normal_style))
        filas.append([foto or Paragraph('(sin foto)', etiqueta_style), detalle])

    story.append(Table(
        filas,
        colWidths=[lado_foto + 0.4 * cm, ANCHO_UTIL - lado_foto - 0.4 * cm],
        style=TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (0, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]),
    ))

    entrega = [
        Paragraph(
            f'<b>{_modalidad(pedido)}</b> &nbsp;·&nbsp; para {escape(pedido.nombre_destinatario)}',
            normal_style,
        ),
    ]
    if pedido.instrucciones:
        entrega.append(Paragraph(f'Instrucciones: {escape(pedido.instrucciones)}', normal_style))
    story.append(Table(
        [[entrega]],
        colWidths=[ANCHO_UTIL],
        style=TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.7, BORDE),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]),
    ))

    # === TARJETA: se corta, se dobla y viaja con el ramo ===
    if pedido.dedicatoria:
        contenido = [Paragraph(escape(_texto_de_tarjeta(pedido.dedicatoria)), dedicatoria_style)]
        if pedido.firmado_como and not (pedido.anonimo or pedido.regalo_anonimo):
            contenido.append(Paragraph(escape(pedido.firmado_como), firma_style))
        elif pedido.anonimo or pedido.regalo_anonimo:
            contenido.append(Paragraph('De alguien que te quiere', firma_style))

        # Una tarjeta corta sigue siendo una tarjeta: se rellena hasta ALTO_TARJETA
        # repartiendo el aire arriba y abajo del texto.
        ancho_texto = ANCHO_UTIL - 2 * 24
        usado = sum(bloque.wrap(ancho_texto, ALTO_TARJETA)[1] for bloque in contenido)
        aire = max(0.0, (ALTO_TARJETA - usado) / 2)
        contenido = [Spacer(1, aire)] + contenido + [Spacer(1, aire)]

        story.extend(_linea_de_corte(corte_style))
        story.append(KeepTogether(Table(
            [[contenido]],
            colWidths=[ANCHO_UTIL],
            style=TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), ROSA),
                ('BOX', (0, 0), (-1, -1), 0.7, BORDE),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ('LEFTPADDING', (0, 0), (-1, -1), 24),
                ('RIGHTPADDING', (0, 0), (-1, -1), 24),
            ]),
        )))

    # === TALÓN: se corta y va en el bolsillo de quien lleva el pedido ===
    direccion = _direccion_de_entrega(pedido)
    datos = [
        Paragraph(
            f'<b>#{escape(pedido.numero)}</b> &nbsp;·&nbsp; {_dia_y_fecha(pedido.fecha_entrega)}'
            f' &nbsp;·&nbsp; {escape(_cuando(pedido))}',
            talon_style,
        ),
        Paragraph(f'<b>{escape(pedido.nombre_destinatario)}</b>', producto_style),
        Paragraph(escape(pedido.telefono_destinatario or 'Sin teléfono'), telefono_style),
        Paragraph(escape(direccion), talon_style),
    ]
    if pedido.instrucciones:
        datos.append(Paragraph(f'<i>{escape(pedido.instrucciones)}</i>', talon_style))
    if pedido.estado_pago != 'approved':
        datos.append(Spacer(1, 0.2 * cm))
        datos.append(Paragraph(
            f'COBRAR ${pedido.total:,.0f}'.replace(',', '.')
            + f' &nbsp;({escape(pedido.get_medio_pago_display())})',
            cobro_style,
        ))
    datos.append(Spacer(1, 0.2 * cm))
    datos.append(Paragraph(
        '[&nbsp;&nbsp;&nbsp;&nbsp;] Entregado &nbsp;&nbsp;&nbsp;&nbsp;'
        '[&nbsp;&nbsp;&nbsp;&nbsp;] No estaba &nbsp;&nbsp;&nbsp;&nbsp; Hora: ______',
        talon_style,
    ))
    datos.append(Spacer(1, 0.7 * cm))
    datos.append(Paragraph(
        'Recibí conforme: ____________________ &nbsp;&nbsp;'
        'Aclaración: ____________________',
        recibo_style,
    ))

    mapa = _mapa_estatico(direccion, 4.6 * cm)
    codigo = _codigo_qr(
        f'https://www.google.com/maps/search/?api=1&query={quote_plus(direccion)}',
        3.2 * cm,
    )
    columna_mapa = [[mapa or Paragraph('', etiqueta_style)]] if mapa else []
    columna_mapa.append([codigo or Paragraph('', etiqueta_style)])
    columna_mapa.append([Paragraph('Escaneá para ir', etiqueta_style)])

    story.extend(_linea_de_corte(corte_style))
    story.append(KeepTogether(Table(
        [[
            datos,
            Table(columna_mapa, style=TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ])),
        ]],
        colWidths=[ANCHO_UTIL - 5.2 * cm, 5.2 * cm],
        style=TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 0.7, BORDE),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (0, -1), 10),
        ]),
    )))

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf


def _fila_hoja_de_ruta(pedido, estilo, estilo_chico):
    """Una línea del reparto: cuándo, a quién, dónde y qué lleva."""
    if pedido.tipo_envio == 'retiro':
        cuando = pedido.hora_retiro.strftime('%H:%M') if pedido.hora_retiro else 'A coordinar'
    else:
        cuando = pedido.get_franja_horaria_display() or 'Sin franja'

    destino = (
        f'<b>{escape(pedido.nombre_destinatario)}</b><br/>'
        f'{escape(pedido.telefono_destinatario or "")}'
    )
    if pedido.tipo_envio == 'retiro':
        direccion = 'Retira en el local'
    else:
        direccion = escape(pedido.direccion or 'Sin dirección')
        if pedido.ciudad:
            direccion += f'<br/>{escape(pedido.ciudad)}'
    if pedido.instrucciones:
        direccion += f'<br/><i>{escape(pedido.instrucciones)}</i>'

    productos = '<br/>'.join(
        f'{item.cantidad}× '
        f'{escape(item.producto.nombre) if item.producto else "Producto"}'
        for item in pedido.items.all()
    )

    pago = pedido.get_estado_pago_display()
    if pedido.estado_pago != 'approved':
        pago = f'<b>COBRAR ${pedido.total:,.0f}</b><br/>{pedido.get_medio_pago_display()}'

    return [
        Paragraph(cuando, estilo),
        Paragraph(f'#{pedido.numero}', estilo_chico),
        Paragraph(destino, estilo),
        Paragraph(direccion, estilo),
        Paragraph(productos, estilo_chico),
        Paragraph(pago, estilo_chico),
    ]


def generar_hoja_de_ruta(fecha, retiros, grupos):
    """Hoja de ruta del día: una tabla por franja, pensada para imprimir y salir."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm,
    )

    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle(
        'HojaTitulo', parent=styles['Heading1'], fontSize=16,
        textColor=colors.HexColor('#2d3748'), alignment=TA_CENTER, spaceAfter=0.2*cm,
    )
    franja_style = ParagraphStyle(
        'HojaFranja', parent=styles['Heading2'], fontSize=12,
        textColor=colors.HexColor('#276749'), spaceBefore=0.4*cm, spaceAfter=0.15*cm,
    )
    celda_style = ParagraphStyle(
        'HojaCelda', parent=styles['Normal'], fontSize=8, leading=10, alignment=TA_LEFT,
    )
    celda_chica_style = ParagraphStyle(
        'HojaCeldaChica', parent=celda_style, fontSize=7, leading=9,
        textColor=colors.HexColor('#4a5568'),
    )

    story = [
        Paragraph('FLORERÍA CRISTINA — HOJA DE RUTA', titulo_style),
        Paragraph(
            fecha.strftime('%d/%m/%Y'),
            ParagraphStyle('HojaFecha', parent=styles['Normal'], alignment=TA_CENTER),
        ),
    ]

    encabezado = ['Hora', 'Pedido', 'Destinatario', 'Dirección', 'Lleva', 'Pago']
    anchos = [2*cm, 2*cm, 4*cm, 5.5*cm, 4*cm, 2.5*cm]
    estilo_tabla = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e6fffa')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#cbd5e0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])

    bloques = []
    if retiros:
        bloques.append(('Retiros en tienda', retiros))
    for grupo in grupos:
        bloques.append((grupo['etiqueta'], grupo['pedidos']))

    if not bloques:
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph('No hay entregas agendadas para este día.', celda_style))

    for etiqueta, pedidos in bloques:
        story.append(Paragraph(f'{etiqueta} ({len(pedidos)})', franja_style))
        filas = [encabezado]
        filas.extend(
            _fila_hoja_de_ruta(pedido, celda_style, celda_chica_style)
            for pedido in pedidos
        )
        tabla = Table(filas, colWidths=anchos, repeatRows=1)
        tabla.setStyle(estilo_tabla)
        story.append(tabla)

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
