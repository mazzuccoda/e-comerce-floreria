"""
Generador de PDF minimalista para pedidos
Diseñado para caber en una hoja A4
"""
from html import escape
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import requests
from PIL import Image as PILImage


def generar_pdf_pedido(pedido):
    """
    Genera un PDF minimalista del pedido que cabe en una hoja A4
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para título
    titulo_style = ParagraphStyle(
        'Titulo',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=0.3*cm,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para subtítulos
    subtitulo_style = ParagraphStyle(
        'Subtitulo',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#4a5568'),
        spaceAfter=0.2*cm,
        spaceBefore=0.3*cm,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para texto normal
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica'
    )
    
    # Estilo para texto pequeño
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        fontName='Helvetica'
    )
    
    # Contenido del PDF
    story = []
    
    # === ENCABEZADO ===
    story.append(Paragraph("🌸 FLORERÍA CRISTINA", titulo_style))
    story.append(Paragraph(f"Pedido #{pedido.numero_pedido or pedido.id}", subtitulo_style))
    story.append(Paragraph(f"{pedido.creado.strftime('%d/%m/%Y %H:%M')}", small_style))
    story.append(Spacer(1, 0.5*cm))
    
    # === PRODUCTOS ===
    story.append(Paragraph("PRODUCTOS", subtitulo_style))
    
    # Tabla de productos con imágenes
    productos_data = [['Imagen', 'Producto', 'Cant.', 'Precio', 'Subtotal']]
    
    for item in pedido.items.all():
        # Intentar obtener la imagen del producto
        img = None
        try:
            # Obtener la URL de la imagen principal del producto
            image_url = item.producto.get_primary_image_url
            
            if image_url and not image_url.startswith('https://via.placeholder.com'):
                # Descargar la imagen desde Cloudinary o cualquier URL
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    img_buffer = BytesIO(response.content)
                    img = Image(img_buffer, width=1.5*cm, height=1.5*cm)
        except Exception as e:
            # Si falla, usar un placeholder de texto
            pass
        
        if img is None:
            img = Paragraph("📦", normal_style)
        
        productos_data.append([
            img,
            Paragraph(item.producto.nombre, normal_style),
            str(item.cantidad),
            f"${item.precio:,.0f}".replace(',', '.'),
            f"${item.precio * item.cantidad:,.0f}".replace(',', '.')
        ])
    
    productos_table = Table(productos_data, colWidths=[2*cm, 6.5*cm, 1.5*cm, 3*cm, 3*cm])
    productos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f7fafc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Imagen centrada
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),    # Producto a la izquierda
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'), # Resto centrado
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),   # Subtotal a la derecha
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), # Alineación vertical
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#cbd5e0')),
    ]))
    
    story.append(productos_table)
    story.append(Spacer(1, 0.3*cm))
    
    # === TOTALES ===
    subtotal = sum(item.precio * item.cantidad for item in pedido.items.all())
    
    # Calcular costo de envío
    costo_envio = 0
    if pedido.tipo_envio == 'express':
        costo_envio = 10000
    elif pedido.tipo_envio == 'programado':
        costo_envio = 5000
    
    totales_data = [
        ['Subtotal:', f"${subtotal:,.0f}".replace(',', '.')],
    ]
    
    if costo_envio > 0:
        totales_data.append(['Envío:', f"${costo_envio:,.0f}".replace(',', '.')])
    
    totales_data.append(['TOTAL:', f"${pedido.total:,.0f}".replace(',', '.')])
    
    totales_table = Table(totales_data, colWidths=[13*cm, 3*cm])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 9),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#2d3748')),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
    ]))
    
    story.append(totales_table)
    story.append(Spacer(1, 0.5*cm))
    
    # === INFORMACIÓN DE ENTREGA ===
    story.append(Paragraph("INFORMACIÓN DE ENTREGA", subtitulo_style))
    
    entrega_data = [
        ['Destinatario:', pedido.nombre_destinatario],
        ['Teléfono:', pedido.telefono_destinatario],
        ['Dirección:', pedido.direccion],
        ['Fecha:', pedido.fecha_entrega.strftime('%d/%m/%Y')],
        ['Horario:', 'Mañana (9-12hs)' if pedido.franja_horaria == 'mañana' else ('Tarde (16-20hs)' if pedido.franja_horaria == 'tarde' else 'Durante el día')],
    ]
    
    if pedido.tipo_envio:
        tipo_envio_display = {
            'retiro': '🏪 Retiro en tienda',
            'express': '⚡ Envío Express (2-4 horas)',
            'programado': '📅 Envío Programado'
        }.get(pedido.tipo_envio, pedido.tipo_envio)
        entrega_data.append(['Tipo de Envío:', tipo_envio_display])
    
    if pedido.instrucciones:
        entrega_data.append(['Instrucciones:', pedido.instrucciones])
    
    entrega_table = Table(entrega_data, colWidths=[4*cm, 12*cm])
    entrega_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    story.append(entrega_table)
    
    # === DEDICATORIA ===
    if pedido.dedicatoria:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("DEDICATORIA", subtitulo_style))
        
        # Crear contenido de dedicatoria con firma si existe
        dedicatoria_text = f'"{pedido.dedicatoria}"'
        if pedido.firmado_como:
            # Estilo para la firma (alineado a la derecha)
            firma_style = ParagraphStyle(
                'Firma',
                parent=normal_style,
                alignment=TA_RIGHT,
                fontSize=9,
                textColor=colors.HexColor('#4a5568')
            )
            dedicatoria_content = [
                [Paragraph(dedicatoria_text, normal_style)],
                [Paragraph(f'— {pedido.firmado_como}', firma_style)]
            ]
            dedicatoria_table = Table(dedicatoria_content, colWidths=[16*cm])
        else:
            dedicatoria_table = Table([[Paragraph(dedicatoria_text, normal_style)]], colWidths=[16*cm])
        
        dedicatoria_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef5f5')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#feb2b2')),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        story.append(dedicatoria_table)
    
    story.append(Spacer(1, 0.5*cm))
    
    # === CLIENTE ===
    story.append(Paragraph("CLIENTE", subtitulo_style))
    
    cliente_data = []
    if pedido.cliente:
        cliente_data.append(['Nombre:', pedido.cliente.get_full_name() or pedido.cliente.username])
        cliente_data.append(['Email:', pedido.cliente.email])
    else:
        if pedido.nombre_comprador:
            cliente_data.append(['Nombre:', pedido.nombre_comprador])
        if pedido.email_comprador:
            cliente_data.append(['Email:', pedido.email_comprador])
        if pedido.telefono_comprador:
            cliente_data.append(['Teléfono:', pedido.telefono_comprador])
    
    if cliente_data:
        cliente_table = Table(cliente_data, colWidths=[4*cm, 12*cm])
        cliente_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(cliente_table)
    
    story.append(Spacer(1, 0.3*cm))
    
    # === ESTADO Y PAGO ===
    info_data = [
        ['Estado:', pedido.get_estado_display()],
        ['Estado Pago:', pedido.get_estado_pago_display() if hasattr(pedido, 'estado_pago') else 'N/A'],
        ['Método Pago:', pedido.get_medio_pago_display() if hasattr(pedido, 'medio_pago') else 'N/A'],
    ]
    
    info_table = Table(info_data, colWidths=[4*cm, 12*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    story.append(info_table)
    
    # === PIE DE PÁGINA ===
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "Florería Cristina - Yerba Buena, Tucumán",
        ParagraphStyle('Footer', parent=small_style, alignment=TA_CENTER)
    ))
    
    # Construir PDF
    doc.build(story)
    
    # Obtener el valor del buffer
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
        Paragraph(f'#{pedido.numero_pedido or pedido.id}', estilo_chico),
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
