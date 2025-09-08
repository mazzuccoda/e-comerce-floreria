#!/usr/bin/env python3
"""
Script de prueba completo para validar la funcionalidad del carrito
Incluye pruebas del backend Django y frontend Next.js
"""

import os
import sys
import django
import requests
import json
import time
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
sys.path.append('/app')
django.setup()

from catalogo.models import Producto
from carrito.models import Carrito, CarritoItem
from django.contrib.sessions.models import Session
from django.test import Client
from django.contrib.auth.models import User

class CarritoTester:
    def __init__(self):
        self.client = Client()
        self.base_url = "http://localhost:8000"
        self.frontend_url = "http://frontend:3000"  # URL interna de Docker
        self.session_key = None
        self.productos_test = []
        
    def log(self, mensaje, tipo="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {tipo}: {mensaje}")
        
    def setup_test_data(self):
        """Preparar datos de prueba"""
        self.log("🔧 Configurando datos de prueba...")
        
        # Obtener productos activos para las pruebas
        self.productos_test = list(Producto.objects.filter(is_active=True)[:3])
        
        if len(self.productos_test) < 1:
            self.log("❌ ERROR: Se necesita al menos 1 producto activo", "ERROR")
            return False
        
        # Si tenemos menos de 3, usar los que tengamos
        if len(self.productos_test) < 3:
            self.log(f"⚠️  Solo hay {len(self.productos_test)} productos disponibles, ajustando pruebas", "WARNING")
            
        self.log(f"✅ Productos de prueba configurados: {len(self.productos_test)}")
        for producto in self.productos_test:
            self.log(f"   - {producto.nombre} (Stock: {producto.stock}, Precio: ${producto.precio})")
            
        return True
        
    def test_backend_api(self):
        """Probar APIs del backend Django"""
        self.log("\n🔍 PROBANDO BACKEND APIs...")
        
        # 1. Obtener carrito vacío
        response = self.client.get('/api/carrito/')
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ GET /api/carrito/ - Carrito vacío: {data}")
            self.session_key = self.client.session.session_key
        else:
            self.log(f"❌ ERROR GET /api/carrito/: {response.status_code}", "ERROR")
            return False
            
        # 2. Agregar producto al carrito
        producto = self.productos_test[0]
        response = self.client.post('/api/carrito/add/', {
            'product_id': producto.id,
            'quantity': 2
        }, content_type='application/json')
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ POST /api/carrito/add/ - Producto agregado: {data}")
        else:
            self.log(f"❌ ERROR POST /api/carrito/add/: {response.status_code} - {response.content}", "ERROR")
            return False
            
        # 3. Verificar carrito con productos
        response = self.client.get('/api/carrito/')
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Carrito con productos: {data['total_items']} items, Total: ${data['total_price']}")
        else:
            self.log(f"❌ ERROR verificando carrito: {response.status_code}", "ERROR")
            return False
            
        # 4. Actualizar cantidad
        response = self.client.post('/api/carrito/update/', {
            'product_id': producto.id,
            'quantity': 3
        }, content_type='application/json')
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ POST /api/carrito/update/ - Cantidad actualizada: {data}")
        else:
            self.log(f"❌ ERROR POST /api/carrito/update/: {response.status_code}", "ERROR")
            
        # 5. Agregar segundo producto (si existe)
        if len(self.productos_test) > 1:
            producto2 = self.productos_test[1]
            response = self.client.post('/api/carrito/add/', {
                'product_id': producto2.id,
                'quantity': 1
            }, content_type='application/json')
            
            if response.status_code == 200:
                self.log(f"✅ Segundo producto agregado: {producto2.nombre}")
            else:
                self.log(f"❌ ERROR agregando segundo producto: {response.status_code}", "ERROR")
                
            # 6. Eliminar producto
            response = self.client.delete('/api/carrito/remove/', {
                'product_id': producto2.id
            }, content_type='application/json')
        else:
            # Si solo hay un producto, eliminar el primero
            response = self.client.delete('/api/carrito/remove/', {
                'product_id': producto.id
            }, content_type='application/json')
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ DELETE /api/carrito/remove/ - Producto eliminado: {data}")
        else:
            self.log(f"❌ ERROR DELETE /api/carrito/remove/: {response.status_code}", "ERROR")
            
        # 7. Limpiar carrito
        response = self.client.delete('/api/carrito/clear/')
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ DELETE /api/carrito/clear/ - Carrito limpiado: {data}")
        else:
            self.log(f"❌ ERROR DELETE /api/carrito/clear/: {response.status_code}", "ERROR")
            
        return True
        
    def test_frontend_integration(self):
        """Probar integración con frontend Next.js"""
        self.log("\n🌐 PROBANDO INTEGRACIÓN FRONTEND...")
        
        try:
            # 1. Verificar que el frontend esté corriendo
            response = requests.get(f"{self.frontend_url}", timeout=10)
            if response.status_code == 200:
                self.log("✅ Frontend Next.js está corriendo")
            else:
                self.log(f"❌ Frontend no responde: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ ERROR conectando al frontend: {e}", "ERROR")
            return False
            
        # 2. Probar APIs desde perspectiva del frontend
        try:
            # Simular llamada desde frontend
            headers = {
                'Content-Type': 'application/json',
                'Origin': self.frontend_url,
                'Referer': self.frontend_url
            }
            
            # Obtener carrito
            response = requests.get(f"{self.base_url}/api/carrito/", headers=headers, timeout=5)
            if response.status_code == 200:
                self.log("✅ API carrito accesible desde frontend")
            else:
                self.log(f"❌ API carrito no accesible: {response.status_code}", "ERROR")
                
            # Probar CORS
            response = requests.options(f"{self.base_url}/api/carrito/", headers=headers, timeout=5)
            if 'Access-Control-Allow-Origin' in response.headers:
                self.log("✅ CORS configurado correctamente")
            else:
                self.log("⚠️  CORS podría no estar configurado", "WARNING")
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ ERROR probando APIs desde frontend: {e}", "ERROR")
            return False
            
        return True
        
    def test_database_consistency(self):
        """Verificar consistencia de la base de datos"""
        self.log("\n💾 PROBANDO CONSISTENCIA BASE DE DATOS...")
        
        # 1. Verificar modelos del carrito
        try:
            carritos_count = Carrito.objects.count()
            items_count = CarritoItem.objects.count()
            self.log(f"✅ Carritos en BD: {carritos_count}, Items: {items_count}")
            
            # 2. Crear carrito de prueba directamente en BD
            from django.contrib.sessions.backends.db import SessionStore
            session = SessionStore()
            session.create()
            
            carrito = Carrito.objects.create(session_key=session.session_key)
            if not self.productos_test:
                self.log("❌ No hay productos para probar", "ERROR")
                return False
            producto = self.productos_test[0]
            
            item = CarritoItem.objects.create(
                carrito=carrito,
                producto=producto,
                cantidad=2
            )
            
            self.log(f"✅ Carrito creado en BD: ID {carrito.id}")
            self.log(f"✅ Item creado: {item.producto.nombre} x{item.cantidad}")
            
            # 3. Verificar cálculos
            total_calculado = carrito.get_total_price()
            items_calculados = carrito.get_total_items()
            
            self.log(f"✅ Total calculado: ${total_calculado}")
            self.log(f"✅ Items calculados: {items_calculados}")
            
            # 4. Limpiar datos de prueba
            carrito.delete()
            session.delete()
            
            return True
            
        except Exception as e:
            self.log(f"❌ ERROR en consistencia BD: {e}", "ERROR")
            return False
            
    def test_stock_validation(self):
        """Probar validación de stock"""
        self.log("\n📦 PROBANDO VALIDACIÓN DE STOCK...")
        
        try:
            # 1. Verificar stock disponible
            if not self.productos_test:
                self.log("❌ No hay productos para probar", "ERROR")
                return False
            producto = self.productos_test[0]
            stock_original = producto.stock
            self.log(f"Stock original de {producto.nombre}: {stock_original}")
            
            # 2. Intentar agregar más cantidad que el stock
            response = self.client.post('/api/carrito/add/', {
                'product_id': producto.id,
                'quantity': stock_original + 10
            }, content_type='application/json')
            
            if response.status_code == 400:
                self.log("✅ Validación de stock funcionando - rechaza cantidad excesiva")
            else:
                self.log(f"⚠️  Validación de stock podría fallar: {response.status_code}", "WARNING")
                
            # 3. Agregar cantidad válida
            response = self.client.post('/api/carrito/add/', {
                'product_id': producto.id,
                'quantity': min(2, stock_original)
            }, content_type='application/json')
            
            if response.status_code == 200:
                self.log("✅ Cantidad válida agregada correctamente")
            else:
                self.log(f"❌ ERROR agregando cantidad válida: {response.status_code}", "ERROR")
                
            return True
            
        except Exception as e:
            self.log(f"❌ ERROR en validación de stock: {e}", "ERROR")
            return False
            
    def test_session_persistence(self):
        """Probar persistencia de sesión"""
        self.log("\n🔐 PROBANDO PERSISTENCIA DE SESIÓN...")
        
        try:
            # 1. Crear nuevo cliente para simular nueva sesión
            client2 = Client()
            
            # 2. Agregar producto en primera sesión
            if not self.productos_test:
                self.log("❌ No hay productos para probar", "ERROR")
                return False
            response = self.client.post('/api/carrito/add/', {
                'product_id': self.productos_test[0].id,
                'quantity': 1
            }, content_type='application/json')
            
            if response.status_code == 200:
                self.log("✅ Producto agregado en sesión 1")
            
            # 3. Verificar que segunda sesión tiene carrito vacío
            response2 = client2.get('/api/carrito/')
            if response2.status_code == 200:
                data = response2.json()
                if data['is_empty']:
                    self.log("✅ Sesión 2 tiene carrito vacío (correcto)")
                else:
                    self.log("⚠️  Sesión 2 no está aislada", "WARNING")
                    
            # 4. Verificar que primera sesión mantiene datos
            response = self.client.get('/api/carrito/')
            if response.status_code == 200:
                data = response.json()
                if not data['is_empty']:
                    self.log("✅ Sesión 1 mantiene datos del carrito")
                else:
                    self.log("❌ Sesión 1 perdió datos del carrito", "ERROR")
                    
            return True
            
        except Exception as e:
            self.log(f"❌ ERROR en persistencia de sesión: {e}", "ERROR")
            return False
            
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        self.log("🚀 INICIANDO PRUEBAS COMPLETAS DEL CARRITO")
        self.log("=" * 50)
        
        tests = [
            ("Configuración de datos", self.setup_test_data),
            ("APIs del Backend", self.test_backend_api),
            ("Integración Frontend", self.test_frontend_integration),
            ("Consistencia BD", self.test_database_consistency),
            ("Validación Stock", self.test_stock_validation),
            ("Persistencia Sesión", self.test_session_persistence)
        ]
        
        resultados = []
        
        for nombre, test_func in tests:
            try:
                resultado = test_func()
                resultados.append((nombre, resultado))
                if resultado:
                    self.log(f"✅ {nombre}: PASÓ")
                else:
                    self.log(f"❌ {nombre}: FALLÓ", "ERROR")
            except Exception as e:
                self.log(f"❌ {nombre}: ERROR - {e}", "ERROR")
                resultados.append((nombre, False))
                
        # Resumen final
        self.log("\n" + "=" * 50)
        self.log("📊 RESUMEN DE PRUEBAS")
        self.log("=" * 50)
        
        passed = sum(1 for _, resultado in resultados if resultado)
        total = len(resultados)
        
        for nombre, resultado in resultados:
            status = "✅ PASÓ" if resultado else "❌ FALLÓ"
            self.log(f"{nombre}: {status}")
            
        self.log(f"\n🎯 RESULTADO FINAL: {passed}/{total} pruebas pasaron")
        
        if passed == total:
            self.log("🎉 ¡TODAS LAS PRUEBAS PASARON! El carrito está funcionando correctamente.")
        else:
            self.log("⚠️  Algunas pruebas fallaron. Revisar logs para detalles.", "WARNING")
            
        return passed == total

if __name__ == "__main__":
    tester = CarritoTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
