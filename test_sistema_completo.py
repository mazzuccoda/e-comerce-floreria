#!/usr/bin/env python
"""
Script de prueba integral para validar el sistema completo de Florería Cristina
Incluye: Backend, Frontend, Notificaciones, Carrito, Autenticación y SEO
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User
from catalogo.models import Producto, TipoFlor, Ocasion
from carrito.models import Carrito, CarritoItem
from pedidos.models import Pedido
from notificaciones.models import Notificacion, PlantillaNotificacion
from usuarios.models import PerfilUsuario

class SistemaCompletoTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.resultados = []
        
    def log_resultado(self, test_name, success, message="", details=None):
        """Registra el resultado de una prueba"""
        status = "[PASO]" if success else "[FALLO]"
        self.resultados.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Detalles: {details}")
    
    def test_backend_apis(self):
        """Prueba las APIs principales del backend"""
        print("\nPROBANDO BACKEND APIs...")
        
        try:
            # Test API productos
            response = requests.get(f"{self.base_url}/api/catalogo/productos/")
            if response.status_code == 200:
                productos = response.json()
                count = productos.get('count', 0)
                self.log_resultado("API Productos", True, f"{count} productos disponibles")
            else:
                self.log_resultado("API Productos", False, f"Status: {response.status_code}")
            
            # Test API tipos de flor
            response = requests.get(f"{self.base_url}/api/catalogo/tipos-flor/")
            if response.status_code == 200:
                tipos = response.json()
                self.log_resultado("API Tipos de Flor", True, f"{len(tipos)} tipos disponibles")
            else:
                self.log_resultado("API Tipos de Flor", False, f"Status: {response.status_code}")
            
            # Test API carrito
            response = requests.get(f"{self.base_url}/api/carrito/")
            if response.status_code == 200:
                self.log_resultado("API Carrito", True, "Carrito accesible")
            else:
                self.log_resultado("API Carrito", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_resultado("Backend APIs", False, "Error de conexión", str(e))
    
    def test_frontend_accesibilidad(self):
        """Prueba la accesibilidad del frontend"""
        print("\nPROBANDO FRONTEND...")
        
        try:
            # Test página principal
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                self.log_resultado("Frontend Homepage", True, "Página principal accesible")
            else:
                self.log_resultado("Frontend Homepage", False, f"Status: {response.status_code}")
            
            # Test página de productos
            response = requests.get(f"{self.frontend_url}/productos", timeout=10)
            if response.status_code == 200:
                self.log_resultado("Frontend Productos", True, "Página de productos accesible")
            else:
                self.log_resultado("Frontend Productos", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_resultado("Frontend", False, "Error de conexión", str(e))
    
    def test_base_datos(self):
        """Prueba la integridad de la base de datos"""
        print("\nPROBANDO BASE DE DATOS...")
        
        try:
            # Test productos
            productos_count = Producto.objects.filter(is_active=True).count()
            self.log_resultado("BD Productos", productos_count > 0, 
                             f"{productos_count} productos activos en BD")
            
            # Test tipos de flor
            tipos_count = TipoFlor.objects.count()
            self.log_resultado("BD Tipos de Flor", tipos_count > 0, 
                             f"{tipos_count} tipos de flor en BD")
            
            # Test usuarios
            usuarios_count = User.objects.count()
            self.log_resultado("BD Usuarios", usuarios_count > 0, 
                             f"{usuarios_count} usuarios en BD")
            
            # Test plantillas de notificaciones
            plantillas_count = PlantillaNotificacion.objects.count()
            self.log_resultado("BD Plantillas Notificaciones", plantillas_count > 0, 
                             f"{plantillas_count} plantillas en BD")
                             
        except Exception as e:
            self.log_resultado("Base de Datos", False, "Error de BD", str(e))
    
    def test_sistema_notificaciones(self):
        """Prueba el sistema de notificaciones"""
        print("\nPROBANDO SISTEMA DE NOTIFICACIONES...")
        
        try:
            from notificaciones.services import NotificacionService
            
            # Verificar plantillas
            plantillas = PlantillaNotificacion.objects.all()
            if plantillas.exists():
                self.log_resultado("Plantillas Notificaciones", True, 
                                 f"{plantillas.count()} plantillas configuradas")
            else:
                self.log_resultado("Plantillas Notificaciones", False, 
                                 "No hay plantillas configuradas")
            
            # Test servicio de notificaciones
            service = NotificacionService()
            self.log_resultado("Servicio Notificaciones", True, 
                             "Servicio inicializado correctamente")
                             
        except Exception as e:
            self.log_resultado("Sistema Notificaciones", False, "Error", str(e))
    
    def test_sistema_carrito(self):
        """Prueba el sistema de carrito"""
        print("\nPROBANDO SISTEMA DE CARRITO...")
        
        try:
            # Verificar modelo de carrito
            carritos_count = Carrito.objects.count()
            self.log_resultado("Modelo Carrito", True, 
                             f"{carritos_count} carritos en BD")
            
            # Test API agregar al carrito (simulado)
            if Producto.objects.exists():
                producto = Producto.objects.first()
                self.log_resultado("Carrito - Producto Test", True, 
                                 f"Producto disponible: {producto.nombre}")
            else:
                self.log_resultado("Carrito - Producto Test", False, 
                                 "No hay productos para probar carrito")
                                 
        except Exception as e:
            self.log_resultado("Sistema Carrito", False, "Error", str(e))
    
    def test_seo_optimizaciones(self):
        """Prueba las optimizaciones SEO"""
        print("\nPROBANDO OPTIMIZACIONES SEO...")
        
        try:
            # Verificar archivos SEO en frontend
            import os
            frontend_path = os.path.join(os.path.dirname(__file__), 'frontend', 'app')
            
            # Verificar sitemap
            sitemap_path = os.path.join(frontend_path, 'sitemap.ts')
            if os.path.exists(sitemap_path):
                self.log_resultado("SEO Sitemap", True, "Sitemap configurado")
            else:
                self.log_resultado("SEO Sitemap", False, "Sitemap no encontrado")
            
            # Verificar robots.txt
            robots_path = os.path.join(frontend_path, 'robots.txt')
            if os.path.exists(robots_path):
                self.log_resultado("SEO Robots.txt", True, "Robots.txt configurado")
            else:
                self.log_resultado("SEO Robots.txt", False, "Robots.txt no encontrado")
            
            # Verificar manifest
            manifest_path = os.path.join(frontend_path, 'manifest.ts')
            if os.path.exists(manifest_path):
                self.log_resultado("SEO Manifest", True, "Manifest configurado")
            else:
                self.log_resultado("SEO Manifest", False, "Manifest no encontrado")
                
        except Exception as e:
            self.log_resultado("SEO Optimizaciones", False, "Error", str(e))
    
    def test_estilos_ui(self):
        """Prueba los estilos y UI mejorados"""
        print("\nPROBANDO ESTILOS Y UI...")
        
        try:
            # Verificar archivos CSS
            frontend_path = os.path.join(os.path.dirname(__file__), 'frontend', 'app')
            
            # Verificar globals.css
            globals_path = os.path.join(frontend_path, 'globals.css')
            if os.path.exists(globals_path):
                with open(globals_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if '--floreria-pink' in content and '--floreria-rose' in content:
                        self.log_resultado("UI Estilos Globales", True, 
                                         "Variables CSS de Florería Cristina configuradas")
                    else:
                        self.log_resultado("UI Estilos Globales", False, 
                                         "Variables CSS no encontradas")
            else:
                self.log_resultado("UI Estilos Globales", False, "globals.css no encontrado")
            
            # Verificar componentes con estilos
            components_path = os.path.join(frontend_path, 'components')
            if os.path.exists(components_path):
                css_files = [f for f in os.listdir(components_path) if f.endswith('.module.css')]
                self.log_resultado("UI Componentes CSS", len(css_files) > 0, 
                                 f"{len(css_files)} archivos CSS modulares encontrados")
            else:
                self.log_resultado("UI Componentes CSS", False, "Directorio components no encontrado")
                
        except Exception as e:
            self.log_resultado("Estilos UI", False, "Error", str(e))
    
    def generar_reporte(self):
        """Genera un reporte final de todas las pruebas"""
        print("\n" + "="*80)
        print("REPORTE FINAL DEL SISTEMA FLORERIA CRISTINA")
        print("="*80)
        
        total_tests = len(self.resultados)
        tests_exitosos = sum(1 for r in self.resultados if r['success'])
        tests_fallidos = total_tests - tests_exitosos
        
        print(f"\nESTADISTICAS:")
        print(f"   Total de pruebas: {total_tests}")
        print(f"   Exitosas: {tests_exitosos}")
        print(f"   Fallidas: {tests_fallidos}")
        print(f"   Porcentaje de exito: {(tests_exitosos/total_tests)*100:.1f}%")
        
        if tests_fallidos > 0:
            print(f"\nPRUEBAS FALLIDAS:")
            for resultado in self.resultados:
                if not resultado['success']:
                    print(f"   - {resultado['test']}: {resultado['message']}")
        
        print(f"\nESTADO DEL SISTEMA:")
        if tests_exitosos >= total_tests * 0.8:  # 80% o más
            print("   SISTEMA EN BUEN ESTADO - Listo para produccion")
        elif tests_exitosos >= total_tests * 0.6:  # 60% o más
            print("   SISTEMA FUNCIONAL - Algunas mejoras necesarias")
        else:
            print("   SISTEMA REQUIERE ATENCION - Problemas criticos detectados")
        
        print(f"\nReporte generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
    
    def ejecutar_todas_las_pruebas(self):
        """Ejecuta todas las pruebas del sistema"""
        print("INICIANDO PRUEBAS INTEGRALES DEL SISTEMA FLORERIA CRISTINA")
        print("="*80)
        
        # Ejecutar todas las pruebas
        self.test_base_datos()
        self.test_backend_apis()
        self.test_frontend_accesibilidad()
        self.test_sistema_notificaciones()
        self.test_sistema_carrito()
        self.test_seo_optimizaciones()
        self.test_estilos_ui()
        
        # Generar reporte final
        self.generar_reporte()

if __name__ == "__main__":
    tester = SistemaCompletoTester()
    tester.ejecutar_todas_las_pruebas()
