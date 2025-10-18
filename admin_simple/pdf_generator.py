"""
Generador de PDF minimalista para pedidos
Diseñado para caber en una hoja A4
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


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
    
    # Tabla de productos
    productos_data = [['Producto', 'Cant.', 'Precio', 'Subtotal']]
    
    for item in pedido.items.all():
        productos_data.append([
            Paragraph(item.producto.nombre, normal_style),
            str(item.cantidad),
            f"${item.precio:,.0f}".replace(',', '.'),
            f"${item.precio * item.cantidad:,.0f}".replace(',', '.')
        ])
    
    productos_table = Table(productos_data, colWidths=[8*cm, 2*cm, 3*cm, 3*cm])
    productos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f7fafc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
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
        ['Horario:', 'Mañana (9-12hs)' if pedido.franja_horaria == 'mañana' else 'Tarde (16-20hs)'],
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
        
        dedicatoria_data = [[Paragraph(f'"{pedido.dedicatoria}"', normal_style)]]
        dedicatoria_table = Table(dedicatoria_data, colWidths=[16*cm])
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
