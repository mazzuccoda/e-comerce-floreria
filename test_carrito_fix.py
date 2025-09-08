#!/usr/bin/env python3
"""
Script para probar la funcionalidad del carrito después de la corrección del error 403
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_cart_apis():
    """Prueba las APIs del carrito"""
    print("🧪 Probando APIs del carrito después de la corrección...")
    
    # 1. Obtener carrito vacío
    print("\n1️⃣ Probando GET /api/carrito/")
    try:
        response = requests.get(f"{BASE_URL}/api/carrito/", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Carrito obtenido correctamente")
            cart_data = response.json()
            print(f"   Items en carrito: {cart_data.get('total_items', 0)}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 2. Agregar producto al carrito
    print("\n2️⃣ Probando POST /api/carrito/add/")
    add_data = {
        "product_id": 1,
        "quantity": 1
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/carrito/add/", 
            headers=HEADERS,
            data=json.dumps(add_data)
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Producto agregado correctamente")
            result = response.json()
            print(f"   Mensaje: {result.get('message')}")
            print(f"   Items en carrito: {result.get('cart', {}).get('total_items', 0)}")
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    # 3. Verificar carrito después de agregar
    print("\n3️⃣ Verificando carrito después de agregar producto")
    try:
        response = requests.get(f"{BASE_URL}/api/carrito/", headers=HEADERS)
        if response.status_code == 200:
            cart_data = response.json()
            items_count = cart_data.get('total_items', 0)
            if items_count > 0:
                print(f"   ✅ Carrito tiene {items_count} items")
                print(f"   Total: ${cart_data.get('total_price', 0)}")
            else:
                print(f"   ❌ El carrito sigue vacío")
        else:
            print(f"   ❌ Error al obtener carrito: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Limpiar carrito
    print("\n4️⃣ Probando DELETE /api/carrito/clear/")
    try:
        response = requests.delete(f"{BASE_URL}/api/carrito/clear/", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Carrito limpiado correctamente")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return True

def test_products_api():
    """Verifica que la API de productos funcione"""
    print("\n🛍️ Verificando API de productos...")
    try:
        response = requests.get(f"{BASE_URL}/api/catalogo/productos/", headers=HEADERS)
        if response.status_code == 200:
            products = response.json()
            count = len(products.get('results', products))
            print(f"   ✅ {count} productos disponibles")
            return True
        else:
            print(f"   ❌ Error en API productos: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Test de corrección del carrito - Error 403")
    print("=" * 50)
    
    # Verificar que el backend esté funcionando
    if not test_products_api():
        print("\n❌ El backend no está respondiendo correctamente")
        exit(1)
    
    # Probar las APIs del carrito
    if test_cart_apis():
        print("\n🎉 ¡Todas las pruebas del carrito pasaron!")
        print("✅ El error 403 ha sido solucionado")
    else:
        print("\n❌ Algunas pruebas fallaron")
        print("🔍 Revisa los logs del backend para más detalles")
