#!/usr/bin/env python3
"""
Script para probar el checkout completo con sesiones mantenidas
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
session = requests.Session()

def test_checkout_flow():
    print("Iniciando prueba del checkout completo...")
    
    # 1. Agregar producto al carrito
    print("\n1. Agregando producto al carrito...")
    add_to_cart_data = {
        "product_id": 18,
        "quantity": 2
    }
    
    response = session.post(
        f"{BASE_URL}/api/carrito/add/",
        json=add_to_cart_data,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        print("OK - Producto agregado exitosamente")
        print(f"   Respuesta: {response.json()}")
    else:
        print(f"ERROR - Error agregando producto: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return
    
    # 2. Verificar carrito
    print("\n2. Verificando estado del carrito...")
    cart_response = session.get(f"{BASE_URL}/api/carrito/")
    
    if cart_response.status_code == 200:
        cart_data = cart_response.json()
        print(f"OK - Carrito verificado: {cart_data['total_items']} items, Total: ${cart_data['total_price']}")
        
        if cart_data['is_empty']:
            print("ERROR - El carrito esta vacio despues de agregar productos")
            return
    else:
        print(f"ERROR - Error verificando carrito: {cart_response.status_code}")
        return
    
    # 3. Crear pedido usando simple-checkout
    print("\n3. Creando pedido...")
    # Calcular fecha futura (mañana)
    from datetime import datetime, timedelta
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    checkout_data = {
        "nombre_comprador": "Usuario Test",
        "email_comprador": "test@test.com",
        "telefono_comprador": "123456789",
        "nombre_destinatario": "Destinatario Test",
        "telefono_destinatario": "987654321",
        "direccion": "Direccion Test 123",
        "ciudad": "Buenos Aires",
        "codigo_postal": "1000",
        "fecha_entrega": tomorrow,
        "franja_horaria": "mañana",  # Con tilde
        "metodo_envio_id": 1,  # ID válido que acabamos de crear
        "dedicatoria": "Pedido de prueba",
        "instrucciones": "",
        "regalo_anonimo": False,
        "medio_pago": "mercadopago"
    }
    
    checkout_response = session.post(
        f"{BASE_URL}/api/pedidos/simple-checkout/",
        json=checkout_data,
        headers={'Content-Type': 'application/json'}
    )
    
    if checkout_response.status_code == 201:
        result = checkout_response.json()
        print("SUCCESS - Pedido creado exitosamente!")
        print(f"   Numero de pedido: {result.get('numero_pedido')}")
        print(f"   ID del pedido: {result.get('pedido_id')}")
    else:
        print(f"ERROR - Error creando pedido: {checkout_response.status_code}")
        print(f"   Respuesta: {checkout_response.text}")
        return
    
    # 4. Verificar que el carrito se vació
    print("\n4. Verificando que el carrito se vacio...")
    final_cart_response = session.get(f"{BASE_URL}/api/carrito/")
    
    if final_cart_response.status_code == 200:
        final_cart_data = final_cart_response.json()
        if final_cart_data['is_empty']:
            print("OK - Carrito vaciado correctamente despues del pedido")
        else:
            print(f"WARNING - El carrito aun tiene {final_cart_data['total_items']} items")
    
    print("\nPrueba del checkout completada!")

if __name__ == "__main__":
    test_checkout_flow()
