#!/usr/bin/env python
"""
Script para cargar imágenes de productos de forma masiva
Uso: python manage.py shell < upload_product_images.py
"""
import os
import django
from django.core.files import File
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from catalogo.models import Producto, ProductoImagen

def upload_product_images():
    """
    Carga imágenes desde una carpeta local
    Estructura esperada:
    media/productos_temp/
    ├── producto-1.jpg
    ├── producto-2.jpg
    └── ...
    """
    
    # Ruta donde tienes las imágenes
    images_path = os.path.join(settings.BASE_DIR, 'media', 'productos_temp')
    
    if not os.path.exists(images_path):
        print(f"❌ Carpeta no encontrada: {images_path}")
        print("📁 Crea la carpeta 'media/productos_temp/' y coloca tus imágenes ahí")
        return
    
    # Obtener todos los productos
    productos = Producto.objects.all()
    
    for producto in productos:
        # Buscar imagen que coincida con el nombre del producto o SKU
        possible_names = [
            f"{producto.slug}.jpg",
            f"{producto.slug}.jpeg", 
            f"{producto.slug}.png",
            f"{producto.sku}.jpg",
            f"{producto.sku}.jpeg",
            f"{producto.sku}.png",
            f"producto-{producto.id}.jpg",
            f"producto-{producto.id}.jpeg",
            f"producto-{producto.id}.png",
        ]
        
        for filename in possible_names:
            filepath = os.path.join(images_path, filename)
            
            if os.path.exists(filepath):
                # Verificar si ya tiene imagen principal
                if not producto.imagenes.filter(is_primary=True).exists():
                    with open(filepath, 'rb') as f:
                        django_file = File(f)
                        
                        # Crear imagen del producto
                        imagen = ProductoImagen.objects.create(
                            producto=producto,
                            is_primary=True,
                            orden=1
                        )
                        imagen.imagen.save(filename, django_file, save=True)
                        
                        print(f"✅ Imagen agregada a: {producto.nombre}")
                        break
                else:
                    print(f"⚠️  {producto.nombre} ya tiene imagen principal")
                    break
        else:
            print(f"❌ No se encontró imagen para: {producto.nombre}")

if __name__ == "__main__":
    print("🚀 Iniciando carga de imágenes...")
    upload_product_images()
    print("✅ Proceso completado!")
