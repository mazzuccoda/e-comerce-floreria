#!/usr/bin/env python3
"""
Script para probar directamente el carrito desde el navegador
"""

import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.test import Client
from django.contrib.sessions.models import Session
from catalogo.models import Producto
import json

def test_carrito_directo():
    """Prueba el carrito directamente sin middleware problemático"""
    print("🧪 Probando carrito directamente...")
    
    # Crear cliente de prueba
    client = Client()
    
    # 1. Verificar que hay productos
    productos = Producto.objects.filter(is_active=True)[:5]
    print(f"✅ {productos.count()} productos activos encontrados")
    
    if not productos:
        print("❌ No hay productos activos")
        return False
    
    # 2. Probar agregar al carrito
    producto = productos.first()
    print(f"🛒 Probando agregar: {producto.nombre}")
    
    data = {
        'product_id': producto.id,
        'quantity': 1
    }
    
    response = client.post(
        '/api/carrito/add/',
        data=json.dumps(data),
        content_type='application/json'
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Carrito funcionando correctamente")
        result = response.json()
        print(f"Mensaje: {result.get('message')}")
        print(f"Items en carrito: {result.get('cart', {}).get('total_items', 0)}")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Contenido: {response.content.decode()}")
        return False

if __name__ == "__main__":
    success = test_carrito_directo()
    if success:
        print("\n🎉 El carrito funciona correctamente a nivel de Django")
        print("El problema está en la comunicación frontend-backend")
    else:
        print("\n❌ Hay un problema en el backend de Django")
