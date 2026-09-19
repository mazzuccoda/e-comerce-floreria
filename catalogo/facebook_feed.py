from django.http import HttpResponse
from django.utils import timezone
from .models import Producto
import xml.etree.ElementTree as ET

# URL pública final del sitio (Next.js sirve las fichas bajo /es para evitar redirects)
SITE_URL = 'https://floreriacristina.com.ar'
PRODUCT_URL_TEMPLATE = SITE_URL + '/es/productos/{slug}'

# Costo de envío más bajo de las zonas reales (Yerba Buena Centro).
# Meta exige un valor fijo por feed; el costo definitivo se calcula en el checkout.
SHIPPING_COST_ARS = 7000


def _producto_url(producto):
    return PRODUCT_URL_TEMPLATE.format(slug=producto.slug)


def _shipping_cost(producto):
    return 0 if producto.envio_gratis else SHIPPING_COST_ARS


def facebook_product_feed(request):
    """
    Genera un feed XML de productos para Facebook Commerce Manager.
    Facebook leerá este feed automáticamente cada 24 horas.
    
    Formato: RSS 2.0 con namespace de Facebook
    Documentación: https://developers.facebook.com/docs/commerce-platform/catalog/products
    """
    
    # Obtener productos activos con stock, precio, SKU y slug válidos
    productos = Producto.objects.filter(
        is_active=True,
        stock__gt=0,
        precio__gt=0,
        sku__isnull=False,
        slug__isnull=False,
    ).exclude(
        sku='',
        slug='',
    ).prefetch_related('imagenes', 'categoria', 'tipo_flor')
    
    # Crear estructura XML
    rss = ET.Element('rss', {
        'version': '2.0',
        'xmlns:g': 'http://base.google.com/ns/1.0'
    })
    
    channel = ET.SubElement(rss, 'channel')
    
    # Información del canal
    ET.SubElement(channel, 'title').text = 'Florería Cristina - Catálogo de Productos'
    ET.SubElement(channel, 'link').text = SITE_URL
    ET.SubElement(channel, 'description').text = 'Catálogo completo de flores y arreglos florales'
    
    # Agregar cada producto
    for producto in productos:
        # Saltar productos sin SKU
        if not producto.sku:
            continue
        
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
        
        # Precio de lista (saltar productos sin precio)
        if not producto.precio or float(producto.precio) <= 0:
            continue
        ET.SubElement(item, 'g:price').text = f'{int(float(producto.precio))} ARS'
        
        # Cantidad en stock
        ET.SubElement(item, 'g:quantity_to_sell_on_facebook').text = str(max(producto.stock, 1))
        
        # Precio de oferta (sólo si es realmente menor al de lista)
        if producto.precio_descuento and 0 < float(producto.precio_descuento) < float(producto.precio):
            ET.SubElement(item, 'g:sale_price').text = f'{int(float(producto.precio_descuento))} ARS'
        
        # Link al producto
        if not producto.slug:
            continue
        ET.SubElement(item, 'g:link').text = _producto_url(producto)
        
        # Imagen principal
        imagen_principal = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
        if not imagen_principal:
            continue
        ET.SubElement(item, 'g:image_link').text = imagen_principal.imagen.url
        
        # Imágenes adicionales (máximo 10)
        imagenes_adicionales = producto.imagenes.exclude(id=imagen_principal.id)[:10]
        for img in imagenes_adicionales:
            ET.SubElement(item, 'g:additional_image_link').text = img.imagen.url
        
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
        
        # Envío (siempre incluir con país Argentina)
        shipping = ET.SubElement(item, 'g:shipping')
        ET.SubElement(shipping, 'g:country').text = 'AR'
        ET.SubElement(shipping, 'g:price').text = f'{_shipping_cost(producto)} ARS'
    
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
    
    # Obtener productos activos con stock, precio, SKU y slug válidos
    productos = Producto.objects.filter(
        is_active=True,
        stock__gt=0,
        precio__gt=0,
        sku__isnull=False,
        slug__isnull=False,
    ).exclude(
        sku='',
        slug='',
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
        'additional_image_link',
        'quantity_to_sell_on_facebook',
        'shipping'
    ])
    
    # Agregar cada producto
    for producto in productos:
        # Precio de lista (saltar productos sin precio)
        if not producto.precio or float(producto.precio) <= 0:
            continue
        precio_lista = int(float(producto.precio))
        precio_oferta = (
            int(float(producto.precio_descuento))
            if producto.precio_descuento and 0 < float(producto.precio_descuento) < float(producto.precio)
            else None
        )
        
        # Imagen principal
        imagen_principal = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
        image_link = imagen_principal.imagen.url if imagen_principal else ''
        
        # Imágenes adicionales
        imagenes_adicionales = producto.imagenes.exclude(id=imagen_principal.id)[:10] if imagen_principal else []
        additional_images = ','.join([img.imagen.url for img in imagenes_adicionales])
        
        # Disponibilidad
        availability = 'in stock' if producto.stock > 0 else 'out of stock'
        
        # Descripción
        descripcion = producto.descripcion_corta or producto.descripcion
        
        # URL del producto
        producto_url = _producto_url(producto)
        
        # Escribir fila
        writer.writerow([
            producto.sku,
            producto.nombre[:150],
            descripcion[:5000],
            availability,
            'new',
            f'{precio_lista} ARS',
            producto_url,
            image_link,
            'Florería Cristina',
            producto.categoria.nombre if producto.categoria else '',
            '985',  # Categoría de Google para Flores
            f'{precio_oferta} ARS' if precio_oferta else '',
            additional_images,
            str(max(producto.stock, 1)),
            f'AR::{_shipping_cost(producto)} ARS'
        ])
    
    # Retornar respuesta HTTP
    response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'inline; filename="facebook_product_feed.csv"'
    
    return response
