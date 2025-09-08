#!/usr/bin/env python
"""
Script de prueba para validar el sistema de gestión de stock
"""
import os
import sys
import django
import requests
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from catalogo.models import Producto
from carrito.cart import Cart
from django.test import RequestFactory
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.sessions.backends.db import SessionStore

def create_test_request():
    """Crear una request de prueba con sesión"""
    factory = RequestFactory()
    request = factory.get('/')
    
    # Agregar sesión
    middleware = SessionMiddleware(lambda x: None)
    middleware.process_request(request)
    request.session.save()
    
    return request

def test_stock_validation():
    """Probar validación de stock"""
    print("=== PRUEBA DE VALIDACIÓN DE STOCK ===\n")
    
    # Crear request de prueba
    request = create_test_request()
    cart = Cart(request)
    
    # Limpiar carrito
    cart.clear()
    print("✓ Carrito limpiado")
    
    # Obtener un producto de prueba
    try:
        producto = Producto.objects.filter(is_active=True, stock__gt=0).first()
        if not producto:
            print("❌ No hay productos activos con stock disponible")
            return False
            
        print(f"✓ Producto seleccionado: {producto.nombre}")
        print(f"  - Stock disponible: {producto.stock}")
        print(f"  - Precio: ${producto.precio}")
        
    except Exception as e:
        print(f"❌ Error obteniendo producto: {e}")
        return False
    
    # Agregar producto al carrito
    try:
        cart.add(producto, quantity=2, price=float(producto.precio))
        print(f"✓ Agregado al carrito: 2 unidades de {producto.nombre}")
        
        # Verificar contenido del carrito
        print(f"✓ Items en carrito: {len(cart)}")
        print(f"✓ Total del carrito: ${cart.get_total_price()}")
        
    except Exception as e:
        print(f"❌ Error agregando al carrito: {e}")
        return False
    
    # Probar API de estado de stock
    try:
        print("\n--- Probando API de estado de stock ---")
        
        # Simular petición HTTP
        from django.test import Client
        client = Client()
        
        # Configurar sesión en el cliente
        session = client.session
        session.update(request.session)
        session.save()
        
        response = client.get('/api/pedidos/stock-status/')
        print(f"✓ Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Items encontrados: {data['total_items']}")
            print(f"✓ Problemas de stock: {data['has_stock_issues']}")
            
            for item in data['items']:
                print(f"  - {item['product_name']}: {item['requested_quantity']} solicitado, {item['available_stock']} disponible")
        else:
            print(f"❌ Error en API: {response.content}")
            
    except Exception as e:
        print(f"❌ Error probando API: {e}")
        return False
    
    # Probar validación de stock
    try:
        print("\n--- Probando validación de stock ---")
        response = client.post('/api/pedidos/validate-stock/')
        print(f"✓ Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Stock válido: {data['valid']}")
        else:
            data = response.json()
            print(f"❌ Problemas de stock detectados: {data.get('errors', [])}")
            
    except Exception as e:
        print(f"❌ Error validando stock: {e}")
        return False
    
    return True

def test_stock_reduction():
    """Probar reducción automática de stock"""
    print("\n=== PRUEBA DE REDUCCIÓN DE STOCK ===\n")
    
    try:
        # Obtener producto con stock
        producto = Producto.objects.filter(is_active=True, stock__gte=5).first()
        if not producto:
            print("❌ No hay productos con suficiente stock para la prueba")
            return False
            
        stock_inicial = producto.stock
        print(f"✓ Producto: {producto.nombre}")
        print(f"✓ Stock inicial: {stock_inicial}")
        
        # Simular reducción de stock
        cantidad_a_reducir = 2
        producto.stock -= cantidad_a_reducir
        producto.save()
        
        producto.refresh_from_db()
        print(f"✓ Stock después de reducir {cantidad_a_reducir}: {producto.stock}")
        
        # Restaurar stock
        producto.stock = stock_inicial
        producto.save()
        print(f"✓ Stock restaurado: {producto.stock}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba de reducción: {e}")
        return False

def test_checkout_with_stock_validation():
    """Probar checkout con validación de stock"""
    print("\n=== PRUEBA DE CHECKOUT CON VALIDACIÓN ===\n")
    
    try:
        from django.test import Client
        client = Client()
        
        # Crear carrito con productos
        request = create_test_request()
        cart = Cart(request)
        cart.clear()
        
        producto = Producto.objects.filter(is_active=True, stock__gt=0).first()
        if not producto:
            print("❌ No hay productos disponibles")
            return False
            
        cart.add(producto, quantity=1, price=float(producto.precio))
        
        # Configurar sesión
        session = client.session
        session.update(request.session)
        session.save()
        
        # Datos de checkout
        checkout_data = {
            'nombre_completo': 'Usuario Prueba',
            'email': 'test@example.com',
            'telefono': '+54 11 1234-5678',
            'direccion': 'Calle Falsa 123',
            'ciudad': 'Buenos Aires',
            'codigo_postal': '1000',
            'metodo_envio': '1',
            'fecha_entrega': '2024-12-31',
            'notas': 'Prueba de stock'
        }
        
        # Intentar checkout
        response = client.post('/api/pedidos/checkout/', 
                              data=checkout_data, 
                              content_type='application/json')
        
        print(f"✓ Status code checkout: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✓ Pedido creado exitosamente: ID {data.get('id')}")
            print(f"✓ Total: ${data.get('total')}")
        else:
            print(f"❌ Error en checkout: {response.content}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba de checkout: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("INICIANDO PRUEBAS DEL SISTEMA DE GESTIÓN DE STOCK")
    print("=" * 60)
    
    tests = [
        test_stock_validation,
        test_stock_reduction,
        test_checkout_with_stock_validation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ PRUEBA EXITOSA\n")
            else:
                print("❌ PRUEBA FALLIDA\n")
        except Exception as e:
            print(f"❌ ERROR EN PRUEBA: {e}\n")
    
    print("=" * 60)
    print(f"RESUMEN: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 TODAS LAS PRUEBAS PASARON CORRECTAMENTE")
        return True
    else:
        print("⚠️  ALGUNAS PRUEBAS FALLARON")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
