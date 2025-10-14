#!/usr/bin/env python
"""
Script para descargar automáticamente imágenes de flores y agregarlas a los productos
"""

import os
import sys
import django
import urllib.request
from pathlib import Path

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from catalogo.models import Producto

# URLs de imágenes de alta calidad de Unsplash
IMAGENES_POR_PRODUCTO = {
    'rosas': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
    'tulipanes': 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80',
    'mixto': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&q=80',
    'girasoles': 'https://images.unsplash.com/photo-1597848212624-e530d5f5cd16?w=800&q=80',
}

def descargar_imagen(url, nombre_archivo):
    """Descarga una imagen desde URL"""
    try:
        print(f"   📥 Descargando imagen desde: {url[:50]}...")
        
        # Crear directorio temporal si no existe
        temp_dir = Path('/tmp/flores_temp')
        temp_dir.mkdir(exist_ok=True)
        
        # Descargar imagen
        img_temp = NamedTemporaryFile(delete=False, dir=temp_dir, suffix='.jpg')
        urllib.request.urlretrieve(url, img_temp.name)
        
        print(f"   ✅ Descarga completada")
        return img_temp
        
    except Exception as e:
        print(f"   ❌ Error descargando imagen: {e}")
        return None

def agregar_imagenes_a_productos():
    """Agrega imágenes descargadas a cada producto"""
    
    # Crear directorio media/productos si no existe
    media_path = Path('/app/media/productos')
    media_path.mkdir(parents=True, exist_ok=True)
    
    productos = Producto.objects.all()
    print(f"\n📦 Encontrados {productos.count()} productos\n")
    print("=" * 60)
    
    for producto in productos:
        print(f"\n🌸 Procesando: {producto.nombre}")
        nombre_lower = producto.nombre.lower()
        
        # Determinar qué tipo de imagen usar
        if 'rosa' in nombre_lower:
            url = IMAGENES_POR_PRODUCTO['rosas']
            tipo = 'rosas'
        elif 'tulipan' in nombre_lower or 'tulipán' in nombre_lower:
            url = IMAGENES_POR_PRODUCTO['tulipanes']
            tipo = 'tulipanes'
        elif 'girasol' in nombre_lower:
            url = IMAGENES_POR_PRODUCTO['girasoles']
            tipo = 'girasoles'
        elif 'mixto' in nombre_lower or 'arreglo' in nombre_lower:
            url = IMAGENES_POR_PRODUCTO['mixto']
            tipo = 'mixto'
        else:
            url = IMAGENES_POR_PRODUCTO['rosas']
            tipo = 'default'
        
        print(f"   Tipo detectado: {tipo}")
        
        # Verificar si el producto ya tiene imagen
        if producto.imagen:
            print(f"   ⚠️  El producto ya tiene una imagen: {producto.imagen.name}")
            print(f"   ⏭️  Saltando...")
            continue
        
        # Descargar imagen
        img_temp = descargar_imagen(url, f"{tipo}_{producto.id}.jpg")
        
        if img_temp:
            try:
                # Guardar imagen en el producto
                with open(img_temp.name, 'rb') as f:
                    producto.imagen.save(
                        f"{tipo}_{producto.id}.jpg",
                        File(f),
                        save=True
                    )
                
                print(f"   ✅ Imagen guardada correctamente")
                print(f"   📁 Ruta: {producto.imagen.name}")
                
                # Eliminar archivo temporal
                os.unlink(img_temp.name)
                
            except Exception as e:
                print(f"   ❌ Error guardando imagen: {e}")
                if os.path.exists(img_temp.name):
                    os.unlink(img_temp.name)
    
    print("\n" + "=" * 60)
    print("\n✅ PROCESO COMPLETADO")
    print(f"\n📊 Estadísticas:")
    total = Producto.objects.count()
    con_imagen = Producto.objects.exclude(imagen='').count()
    print(f"   Total productos: {total}")
    print(f"   Con imagen: {con_imagen}")
    print(f"   Sin imagen: {total - con_imagen}")
    
    print(f"\n🌐 Verifica los productos en:")
    print(f"   Admin: http://localhost/admin/catalogo/producto/")
    print(f"   Sitio: http://localhost/")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🌸 DESCARGA AUTOMÁTICA DE IMÁGENES PARA PRODUCTOS")
    print("=" * 60)
    
    try:
        agregar_imagenes_a_productos()
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        import traceback
        traceback.print_exc()
