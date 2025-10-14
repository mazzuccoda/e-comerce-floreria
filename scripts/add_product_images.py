#!/usr/bin/env python
"""
Script para agregar URLs de imágenes de flores a los productos existentes
Usa imágenes de Unsplash como placeholders realistas
"""

import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from catalogo.models import Producto

# URLs de imágenes de flores de alta calidad (Unsplash)
IMAGENES_FLORES = {
    'rosas': [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800',  # Rosas rojas
        'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800',  # Ramo de rosas
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',  # Rosa roja individual
    ],
    'tulipanes': [
        'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800',  # Tulipanes mixtos
        'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800',  # Tulipanes amarillos
    ],
    'girasoles': [
        'https://images.unsplash.com/photo-1597848212624-e530d5f5cd16?w=800',  # Girasoles
        'https://images.unsplash.com/photo-1595429812044-44d84f35b1b5?w=800',  # Campo girasoles
    ],
    'mixto': [
        'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800',  # Arreglo mixto
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',  # Flores variadas
    ]
}

def actualizar_productos_con_imagenes():
    """Actualiza los productos existentes con URLs de imágenes"""
    
    productos = Producto.objects.all()
    print(f"📦 Encontrados {productos.count()} productos\n")
    
    for producto in productos:
        nombre_lower = producto.nombre.lower()
        
        # Determinar qué tipo de imagen usar basado en el nombre
        if 'rosa' in nombre_lower:
            imagen_url = IMAGENES_FLORES['rosas'][0]
            tipo = 'rosas'
        elif 'tulipan' in nombre_lower or 'tulipán' in nombre_lower:
            imagen_url = IMAGENES_FLORES['tulipanes'][0]
            tipo = 'tulipanes'
        elif 'girasol' in nombre_lower:
            imagen_url = IMAGENES_FLORES['girasoles'][0]
            tipo = 'girasoles'
        elif 'mixto' in nombre_lower or 'arreglo' in nombre_lower:
            imagen_url = IMAGENES_FLORES['mixto'][0]
            tipo = 'mixto'
        else:
            imagen_url = IMAGENES_FLORES['rosas'][0]  # Por defecto
            tipo = 'default'
        
        # Actualizar el producto (si el modelo tiene campo imagen_url)
        # Por ahora solo mostrar lo que haríamos
        print(f"🌸 {producto.nombre}")
        print(f"   Tipo detectado: {tipo}")
        print(f"   Imagen: {imagen_url}")
        print(f"   ID: {producto.id}\n")

if __name__ == '__main__':
    print("🌸 AGREGANDO IMÁGENES A PRODUCTOS\n")
    print("=" * 50)
    actualizar_productos_con_imagenes()
    print("=" * 50)
    print("\n✅ Para usar imágenes reales:")
    print("   1. Accede a http://localhost/admin/")
    print("   2. Login: admin / admin123")
    print("   3. Ve a 'Productos'")
    print("   4. Edita cada producto y sube una imagen")
