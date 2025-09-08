#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.test import Client
from catalogo.models import Producto

def test_carrito():
    print("=== PRUEBA COMPLETA DEL CARRITO ===")
    
    client = Client()
    producto = Producto.objects.first()
    
    if not producto:
        print("ERROR: No hay productos en la base de datos")
        return
    
    print(f"Producto de prueba: {producto.nombre} (ID: {producto.id})")
    print(f"Precio: ${producto.get_precio_final}")
    
    # 1. Carrito vacío
    print("\n1. Obteniendo carrito vacío...")
    response = client.get('/api/carrito/')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Carrito vacío: {data}")
    
    # 2. Agregar producto
    print("\n2. Agregando producto al carrito...")
    response = client.post('/api/carrito/add/', {
        'product_id': producto.id,
        'quantity': 2
    }, content_type='application/json')
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("SUCCESS: Producto agregado")
        print(f"Message: {data.get('message')}")
        cart_data = data.get('cart', {})
        print(f"Items en carrito: {len(cart_data.get('items', []))}")
        print(f"Total items: {cart_data.get('total_items')}")
        print(f"Total price: {cart_data.get('total_price')}")
    else:
        print(f"ERROR: {response.content.decode()}")
        return
    
    # 3. Verificar carrito
    print("\n3. Verificando carrito final...")
    response = client.get('/api/carrito/')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Items: {len(data.get('items', []))}")
        print(f"Total items: {data.get('total_items')}")
        print(f"Total price: {data.get('total_price')}")
        print(f"Is empty: {data.get('is_empty')}")
        
        # Mostrar detalles de items
        for i, item in enumerate(data.get('items', [])):
            if 'producto' in item:
                print(f"  Item {i+1}: {item['producto']['nombre']} x{item['quantity']} = ${item['total_price']}")
    
    print("\n=== PRUEBA COMPLETADA ===")

if __name__ == '__main__':
    test_carrito()
