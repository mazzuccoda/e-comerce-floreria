"""
Utilidades para optimización de imágenes
"""
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
import os


def optimize_image(image_field, max_width=1200, max_height=1200, quality=85):
    """
    Optimiza una imagen reduciendo su tamaño y calidad sin perder demasiada definición.
    
    Args:
        image_field: Campo ImageField de Django
        max_width: Ancho máximo en píxeles
        max_height: Alto máximo en píxeles
        quality: Calidad de compresión (1-100)
    
    Returns:
        InMemoryUploadedFile: Imagen optimizada
    """
    if not image_field:
        return None
    
    try:
        # Abrir la imagen
        img = Image.open(image_field)
        
        # Convertir RGBA a RGB si es necesario
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Obtener dimensiones originales
        width, height = img.size
        
        # Calcular nuevas dimensiones manteniendo aspect ratio
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            # Redimensionar con alta calidad
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Guardar en buffer
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        # Obtener nombre del archivo
        file_name = os.path.splitext(image_field.name)[0] + '.jpg'
        
        # Crear nuevo archivo
        return InMemoryUploadedFile(
            output,
            'ImageField',
            file_name,
            'image/jpeg',
            sys.getsizeof(output),
            None
        )
    except Exception as e:
        print(f"Error optimizando imagen: {e}")
        return image_field


def create_thumbnail(image_field, size=(400, 400)):
    """
    Crea un thumbnail de una imagen.
    
    Args:
        image_field: Campo ImageField de Django
        size: Tupla (width, height) para el thumbnail
    
    Returns:
        InMemoryUploadedFile: Thumbnail generado
    """
    if not image_field:
        return None
    
    try:
        img = Image.open(image_field)
        
        # Convertir RGBA a RGB si es necesario
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Crear thumbnail manteniendo aspect ratio
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Guardar en buffer
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        # Obtener nombre del archivo
        file_name = 'thumb_' + os.path.splitext(image_field.name)[0] + '.jpg'
        
        return InMemoryUploadedFile(
            output,
            'ImageField',
            file_name,
            'image/jpeg',
            sys.getsizeof(output),
            None
        )
    except Exception as e:
        print(f"Error creando thumbnail: {e}")
        return None


def convert_to_webp(image_field, quality=85):
    """
    Convierte una imagen a formato WebP para mejor compresión.
    
    Args:
        image_field: Campo ImageField de Django
        quality: Calidad de compresión (1-100)
    
    Returns:
        InMemoryUploadedFile: Imagen en formato WebP
    """
    if not image_field:
        return None
    
    try:
        img = Image.open(image_field)
        
        # Guardar en buffer como WebP
        output = BytesIO()
        img.save(output, format='WEBP', quality=quality, method=6)
        output.seek(0)
        
        # Obtener nombre del archivo
        file_name = os.path.splitext(image_field.name)[0] + '.webp'
        
        return InMemoryUploadedFile(
            output,
            'ImageField',
            file_name,
            'image/webp',
            sys.getsizeof(output),
            None
        )
    except Exception as e:
        print(f"Error convirtiendo a WebP: {e}")
        return image_field
