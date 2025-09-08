#!/usr/bin/env python3
"""
Script final para probar el carrito con el nuevo endpoint simple
"""

import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.test import Client
from catalogo.models import Producto
import json

def test_carrito_final():
    """Prueba final del carrito con endpoint simple"""
    print("🧪 Probando carrito con endpoint simple...")
    
    # Crear cliente de prueba
    client = Client()
    
    # 1. Verificar productos disponibles
    productos = Producto.objects.filter(is_active=True)[:3]
    print(f"✅ {productos.count()} productos activos encontrados")
    
    if not productos:
        print("❌ No hay productos activos")
        return False
    
    # 2. Probar endpoint simple de obtener carrito
    print("\n📋 Probando GET /api/carrito/simple/")
    response = client.get('/api/carrito/simple/')
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        cart_data = response.json()
        print(f"✅ Carrito obtenido: {cart_data['total_items']} items")
    else:
        print(f"❌ Error al obtener carrito: {response.content.decode()}")
        return False
    
    # 3. Probar agregar productos al carrito
    success_count = 0
    for i, producto in enumerate(productos, 1):
        print(f"\n🛒 Probando agregar producto {i}: {producto.nombre}")
        
        data = {
            'product_id': producto.id,
            'quantity': 1
        }
        
        response = client.post(
            '/api/carrito/simple/add/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result.get('message')}")
            print(f"Items en carrito: {result.get('cart', {}).get('total_items', 0)}")
            success_count += 1
        else:
            print(f"❌ Error: {response.content.decode()}")
    
    # 4. Verificar estado final del carrito
    print(f"\n📊 Resumen final:")
    response = client.get('/api/carrito/simple/')
    if response.status_code == 200:
        cart_data = response.json()
        print(f"✅ Total items en carrito: {cart_data['total_items']}")
        print(f"✅ Total precio: ${cart_data['total_price']}")
        print(f"✅ Productos agregados exitosamente: {success_count}/{len(productos)}")
        
        if success_count == len(productos):
            print("\n🎉 ¡CARRITO FUNCIONANDO PERFECTAMENTE!")
            return True
        else:
            print(f"\n⚠️ Solo {success_count} de {len(productos)} productos se agregaron correctamente")
            return False
    else:
        print("❌ Error al verificar estado final del carrito")
        return False

if __name__ == "__main__":
    success = test_carrito_final()
    if success:
        print("\n✅ PRUEBA EXITOSA: El carrito está completamente funcional")
        print("🚀 El frontend ahora puede usar /api/carrito/simple/add/ sin error 403")
    else:
        print("\n❌ PRUEBA FALLIDA: Revisar configuración del carrito")
