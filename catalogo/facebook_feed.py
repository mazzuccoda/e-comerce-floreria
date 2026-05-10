from django.http import HttpResponse
from django.utils import timezone
from .models import Producto
import xml.etree.ElementTree as ET


def facebook_product_feed(request):
    """
    Genera un feed XML de productos para Facebook Commerce Manager.
    Facebook leerá este feed automáticamente cada 24 horas.
    
    Formato: RSS 2.0 con namespace de Facebook
    Documentación: https://developers.facebook.com/docs/commerce-platform/catalog/products
    """
    
    # Obtener productos activos con stock
    productos = Producto.objects.filter(
        is_active=True,
        stock__gt=0
    ).prefetch_related('imagenes', 'categoria', 'tipo_flor')
    
    # Crear estructura XML
    rss = ET.Element('rss', {
        'version': '2.0',
        'xmlns:g': 'http://base.google.com/ns/1.0'
    })
    
    channel = ET.SubElement(rss, 'channel')
    
    # Información del canal
    ET.SubElement(channel, 'title').text = 'Florería Cristina - Catálogo de Productos'
    ET.SubElement(channel, 'link').text = 'https://www.floreriacristina.com.ar'
    ET.SubElement(channel, 'description').text = 'Catálogo completo de flores y arreglos florales'
    
    # Agregar cada producto
    for producto in productos:
        item = ET.SubElement(channel, 'item')
        
        # ID único (SKU)
        ET.SubElement(item, 'g:id').text = str(producto.sku)
        
        # Título
        ET.SubElement(item, 'g:title').text = producto.nombre[:150]  # Max 150 caracteres
        
        # Descripción
        descripcion = producto.descripcion_corta or producto.descripcion
        ET.SubElement(item, 'g:description').text = descripcion[:5000]  # Max 5000 caracteres
        
        # Disponibilidad
        availability = 'in stock' if producto.stock > 0 else 'out of stock'
        ET.SubElement(item, 'g:availability').text = availability
        
        # Condición (siempre nuevo para flores)
        ET.SubElement(item, 'g:condition').text = 'new'
        
        # Precio
        precio = producto.precio_descuento if producto.precio_descuento else producto.precio
        ET.SubElement(item, 'g:price').text = f'{precio} ARS'
        
        # Precio de oferta (si hay descuento)
        if producto.precio_descuento:
            ET.SubElement(item, 'g:sale_price').text = f'{producto.precio_descuento} ARS'
        
        # Link al producto
        producto_url = f'https://www.floreriacristina.com.ar/productos/{producto.slug}'
        ET.SubElement(item, 'g:link').text = producto_url
        
        # Imagen principal
        imagen_principal = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
        if imagen_principal:
            ET.SubElement(item, 'g:image_link').text = imagen_principal.url
            
            # Imágenes adicionales (máximo 10)
            imagenes_adicionales = producto.imagenes.exclude(id=imagen_principal.id)[:10]
            for img in imagenes_adicionales:
                ET.SubElement(item, 'g:additional_image_link').text = img.url
        
        # Marca
        ET.SubElement(item, 'g:brand').text = 'Florería Cristina'
        
        # Categoría del producto
        if producto.categoria:
            ET.SubElement(item, 'g:product_type').text = producto.categoria.nombre
        
        # Categoría de Google (Flores y Plantas)
        ET.SubElement(item, 'g:google_product_category').text = '985'  # Home & Garden > Plants > Flowers
        
        # GTIN (opcional, pero recomendado)
        # Si tienes códigos de barras, agrégalos aquí
        # ET.SubElement(item, 'g:gtin').text = producto.gtin
        
        # Envío gratis
        if producto.envio_gratis:
            shipping = ET.SubElement(item, 'g:shipping')
            ET.SubElement(shipping, 'g:price').text = '0 ARS'
    
    # Convertir a string XML
    xml_string = ET.tostring(rss, encoding='utf-8', method='xml')
    
    # Agregar declaración XML
    xml_declaration = b'<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content = xml_declaration + xml_string
    
    # Retornar respuesta HTTP
    response = HttpResponse(xml_content, content_type='application/xml; charset=utf-8')
    response['Content-Disposition'] = 'inline; filename="facebook_product_feed.xml"'
    
    return response


def facebook_product_feed_csv(request):
    """
    Genera un feed CSV de productos para Facebook Commerce Manager.
    Alternativa más simple al XML.
    """
    import csv
    from io import StringIO
    
    # Obtener productos activos con stock
    productos = Producto.objects.filter(
        is_active=True,
        stock__gt=0
    ).prefetch_related('imagenes', 'categoria', 'tipo_flor')
    
    # Crear CSV en memoria
    output = StringIO()
    writer = csv.writer(output)
    
    # Encabezados (campos requeridos por Facebook)
    writer.writerow([
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'product_type',
        'google_product_category',
        'sale_price',
        'additional_image_link'
    ])
    
    # Agregar cada producto
    for producto in productos:
        # Precio
        precio = producto.precio_descuento if producto.precio_descuento else producto.precio
        
        # Imagen principal
        imagen_principal = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
        image_link = imagen_principal.url if imagen_principal else ''
        
        # Imágenes adicionales
        imagenes_adicionales = producto.imagenes.exclude(id=imagen_principal.id)[:10] if imagen_principal else []
        additional_images = ','.join([img.url for img in imagenes_adicionales])
        
        # Disponibilidad
        availability = 'in stock' if producto.stock > 0 else 'out of stock'
        
        # Descripción
        descripcion = producto.descripcion_corta or producto.descripcion
        
        # URL del producto
        producto_url = f'https://www.floreriacristina.com.ar/productos/{producto.slug}'
        
        # Escribir fila
        writer.writerow([
            producto.sku,
            producto.nombre[:150],
            descripcion[:5000],
            availability,
            'new',
            f'{precio} ARS',
            producto_url,
            image_link,
            'Florería Cristina',
            producto.categoria.nombre if producto.categoria else '',
            '985',  # Categoría de Google para Flores
            f'{producto.precio_descuento} ARS' if producto.precio_descuento else '',
            additional_images
        ])
    
    # Retornar respuesta HTTP
    response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'inline; filename="facebook_product_feed.csv"'
    
    return response
