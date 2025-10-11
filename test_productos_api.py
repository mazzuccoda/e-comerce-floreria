#!/usr/bin/env python
"""
Script para verificar y poblar productos en la API
"""
import os
import django
import sys

# Configurar Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from catalogo.models import Producto, Categoria, TipoFlor, Ocasion
from decimal import Decimal

def verificar_productos():
    """Verificar productos existentes"""
    productos = Producto.objects.filter(is_active=True)
    print(f"\n{'='*60}")
    print(f"PRODUCTOS ACTIVOS EN LA BASE DE DATOS: {productos.count()}")
    print(f"{'='*60}\n")
    
    for p in productos:
        print(f"✅ {p.nombre}")
        print(f"   - Precio: ${p.precio}")
        print(f"   - Stock: {p.stock}")
        print(f"   - Destacado: {'Sí' if p.is_featured else 'No'}")
        print(f"   - Envío gratis: {'Sí' if p.envio_gratis else 'No'}")
        print()
    
    return productos.count()

def poblar_productos():
    """Poblar base de datos con productos de ejemplo"""
    print("\n🌸 Poblando base de datos con productos de ejemplo...\n")
    
    # Obtener o crear categoría
    categoria_ramos, _ = Categoria.objects.get_or_create(
        slug='ramos',
        defaults={
            'nombre': 'Ramos',
            'descripcion': 'Ramos florales frescos'
        }
    )
    
    categoria_arreglos, _ = Categoria.objects.get_or_create(
        slug='arreglos',
        defaults={
            'nombre': 'Arreglos',
            'descripcion': 'Arreglos florales en base'
        }
    )
    
    # Obtener o crear tipos de flor
    tipo_rosas, _ = TipoFlor.objects.get_or_create(
        nombre='Rosas',
        defaults={'descripcion': 'Rosas frescas'}
    )
    
    tipo_mixto, _ = TipoFlor.objects.get_or_create(
        nombre='Mixto',
        defaults={'descripcion': 'Flores mixtas'}
    )
    
    tipo_girasoles, _ = TipoFlor.objects.get_or_create(
        nombre='Girasoles',
        defaults={'descripcion': 'Girasoles radiantes'}
    )
    
    # Obtener o crear ocasiones
    ocasion_amor, _ = Ocasion.objects.get_or_create(
        nombre='Amor',
        defaults={'descripcion': 'Para expresar amor'}
    )
    
    ocasion_cumple, _ = Ocasion.objects.get_or_create(
        nombre='Cumpleaños',
        defaults={'descripcion': 'Para celebrar cumpleaños'}
    )
    
    # Productos de ejemplo
    productos_ejemplo = [
        {
            'nombre': 'Ramo de 12 Rosas Rojas Premium',
            'slug': 'ramo-12-rosas-rojas-premium',
            'descripcion': 'Hermoso ramo de 12 rosas rojas frescas, perfectas para expresar amor y pasión.',
            'descripcion_corta': 'Ramo de 12 rosas rojas',
            'categoria': categoria_ramos,
            'tipo_flor': tipo_rosas,
            'precio': Decimal('45.99'),
            'stock': 20,
            'is_featured': True,
            'envio_gratis': True,
            'sku': 'RAMO-ROSAS-12'
        },
        {
            'nombre': 'Arreglo Floral Mixto Premium',
            'slug': 'arreglo-floral-mixto-premium',
            'descripcion': 'Elegante arreglo con flores variadas de temporada en base de cerámica.',
            'descripcion_corta': 'Arreglo floral mixto',
            'categoria': categoria_arreglos,
            'tipo_flor': tipo_mixto,
            'precio': Decimal('75.00'),
            'precio_descuento': Decimal('65.00'),
            'stock': 15,
            'is_featured': True,
            'envio_gratis': True,
            'sku': 'ARR-MIXTO-01'
        },
        {
            'nombre': 'Bouquet de Girasoles Alegres',
            'slug': 'bouquet-girasoles-alegres',
            'descripcion': 'Radiante bouquet de girasoles que transmite alegría y energía positiva.',
            'descripcion_corta': 'Bouquet de girasoles',
            'categoria': categoria_ramos,
            'tipo_flor': tipo_girasoles,
            'precio': Decimal('42.50'),
            'stock': 18,
            'is_featured': False,
            'envio_gratis': False,
            'sku': 'BOUQ-GIRA-01'
        },
        {
            'nombre': 'Ramo de 24 Rosas Rojas Especial',
            'slug': 'ramo-24-rosas-rojas-especial',
            'descripcion': 'Impresionante ramo de 24 rosas rojas para ocasiones especiales.',
            'descripcion_corta': 'Ramo de 24 rosas rojas',
            'categoria': categoria_ramos,
            'tipo_flor': tipo_rosas,
            'precio': Decimal('89.99'),
            'stock': 10,
            'is_featured': True,
            'envio_gratis': True,
            'sku': 'RAMO-ROSAS-24'
        },
        {
            'nombre': 'Arreglo Floral Romántico',
            'slug': 'arreglo-floral-romantico',
            'descripcion': 'Arreglo romántico con rosas rosadas y blancas en base elegante.',
            'descripcion_corta': 'Arreglo romántico',
            'categoria': categoria_arreglos,
            'tipo_flor': tipo_rosas,
            'precio': Decimal('68.00'),
            'stock': 12,
            'is_featured': True,
            'envio_gratis': True,
            'sku': 'ARR-ROM-01'
        },
        {
            'nombre': 'Ramo de Girasoles y Rosas',
            'slug': 'ramo-girasoles-rosas',
            'descripcion': 'Combinación perfecta de girasoles y rosas para un regalo especial.',
            'descripcion_corta': 'Ramo mixto girasoles y rosas',
            'categoria': categoria_ramos,
            'tipo_flor': tipo_mixto,
            'precio': Decimal('55.00'),
            'stock': 14,
            'is_featured': False,
            'envio_gratis': True,
            'sku': 'RAMO-MIX-01'
        }
    ]
    
    creados = 0
    actualizados = 0
    
    for prod_data in productos_ejemplo:
        producto, created = Producto.objects.update_or_create(
            sku=prod_data['sku'],
            defaults=prod_data
        )
        
        if created:
            creados += 1
            print(f"✅ Creado: {producto.nombre}")
        else:
            actualizados += 1
            print(f"🔄 Actualizado: {producto.nombre}")
        
        # Agregar ocasiones
        if producto.tipo_flor and producto.tipo_flor.nombre == 'Rosas':
            producto.ocasiones.add(ocasion_amor)
        producto.ocasiones.add(ocasion_cumple)
    
    print(f"\n{'='*60}")
    print(f"✅ Productos creados: {creados}")
    print(f"🔄 Productos actualizados: {actualizados}")
    print(f"{'='*60}\n")

def main():
    print("\n" + "="*60)
    print("VERIFICACIÓN Y POBLACIÓN DE PRODUCTOS")
    print("="*60)
    
    # Verificar productos existentes
    count = verificar_productos()
    
    # Si hay pocos productos, poblar
    if count < 5:
        print("⚠️ Pocos productos en la base de datos. Poblando...")
        poblar_productos()
        verificar_productos()
    else:
        print("✅ La base de datos tiene suficientes productos.")
    
    # Verificar API
    print("\n" + "="*60)
    print("VERIFICANDO API")
    print("="*60 + "\n")
    
    try:
        import requests
        response = requests.get('http://localhost:8000/api/catalogo/productos/')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API funcionando correctamente")
            print(f"📦 Productos en API: {len(data)}")
        else:
            print(f"❌ Error en API: {response.status_code}")
    except Exception as e:
        print(f"❌ Error conectando con API: {e}")

if __name__ == '__main__':
    main()
