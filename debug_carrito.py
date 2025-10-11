#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from carrito.models import Carrito, CarritoItem

print("=== DEBUG CARRITO ===")
print(f"Carritos en BD: {Carrito.objects.count()}")

for carrito in Carrito.objects.all():
    print(f"\nCarrito ID: {carrito.id}")
    print(f"Usuario: {carrito.usuario}")
    print(f"Session Key: {carrito.session_key}")
    print(f"Total items: {carrito.get_total_items()}")
    print(f"Total price: {carrito.get_total_price()}")
    # print(f"Creado: {carrito.created_at}")
    # print(f"Actualizado: {carrito.updated_at}")
    
    items = CarritoItem.objects.filter(carrito=carrito)
    print(f"Items en este carrito: {items.count()}")
    
    for item in items:
        print(f"  - Producto: {item.producto.nombre}")
        print(f"    Cantidad: {item.cantidad}")
        print(f"    Precio: {item.precio_unitario}")
        print(f"    Total: {item.get_total_precio()}")

print("\n=== ITEMS HUÉRFANOS ===")
items_huerfanos = CarritoItem.objects.filter(carrito__isnull=True)
print(f"Items sin carrito: {items_huerfanos.count()}")

print("\n=== TODOS LOS ITEMS ===")
all_items = CarritoItem.objects.all()
print(f"Total items en BD: {all_items.count()}")

for item in all_items:
    print(f"Item ID: {item.id}, Carrito: {item.carrito_id}, Producto: {item.producto.nombre}, Cantidad: {item.quantity}")
