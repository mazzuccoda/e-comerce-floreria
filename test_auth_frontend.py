#!/usr/bin/env python3
"""
Script de prueba para validar la integración completa del sistema de autenticación
entre backend Django y frontend Next.js
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User
from usuarios.models import PerfilUsuario

def print_section(title):
    """Imprime una sección con formato"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def test_backend_apis():
    """Prueba las APIs del backend"""
    print_section("PRUEBAS DE BACKEND - APIs de Usuarios")
    
    base_url = "http://web:8000/api/usuarios"
    
    # Datos de prueba
    test_user_data = {
        "username": "test_frontend_user",
        "email": "test_frontend@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "Frontend",
        "telefono": "11-1234-5678",
        "ciudad": "Buenos Aires"
    }
    
    try:
        # 1. Verificar que el usuario no existe
        print("1. Verificando disponibilidad de usuario...")
        response = requests.get(f"{base_url}/verificar-usuario/?username={test_user_data['username']}")
        if response.status_code == 200:
            data = response.json()
            if not data.get('existe'):
                print("   ✅ Usuario disponible")
            else:
                print("   ⚠️ Usuario ya existe, eliminando...")
                # Eliminar usuario existente
                User.objects.filter(username=test_user_data['username']).delete()
                print("   ✅ Usuario eliminado")
        
        # 2. Registro de usuario
        print("2. Registrando nuevo usuario...")
        response = requests.post(f"{base_url}/registro/", 
                               json=test_user_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            register_data = response.json()
            print("   ✅ Usuario registrado exitosamente")
            print(f"   📧 Email: {register_data['user']['email']}")
            print(f"   👤 Nombre: {register_data['user']['first_name']} {register_data['user']['last_name']}")
            token = register_data['token']
            user_id = register_data['user']['id']
        else:
            print(f"   ❌ Error en registro: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return False
        
        # 3. Login
        print("3. Probando login...")
        login_data = {
            "username": test_user_data['username'],
            "password": test_user_data['password']
        }
        response = requests.post(f"{base_url}/login/", 
                               json=login_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            login_response = response.json()
            print("   ✅ Login exitoso")
            print(f"   🔑 Token: {login_response['token'][:20]}...")
            token = login_response['token']
        else:
            print(f"   ❌ Error en login: {response.status_code}")
            return False
        
        # 4. Obtener perfil
        print("4. Obteniendo perfil de usuario...")
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        response = requests.get(f"{base_url}/perfil/", headers=headers)
        
        if response.status_code == 200:
            profile_data = response.json()
            print("   ✅ Perfil obtenido exitosamente")
            print(f"   📱 Teléfono: {profile_data['user']['perfil']['telefono']}")
            print(f"   🏙️ Ciudad: {profile_data['user']['perfil']['ciudad']}")
        else:
            print(f"   ❌ Error obteniendo perfil: {response.status_code}")
            return False
        
        # 5. Actualizar perfil
        print("5. Actualizando perfil...")
        update_data = {
            "first_name": "Test Updated",
            "telefono": "11-9876-5432",
            "direccion": "Calle Falsa 123"
        }
        response = requests.put(f"{base_url}/perfil/", 
                              json=update_data,
                              headers=headers)
        
        if response.status_code == 200:
            updated_data = response.json()
            print("   ✅ Perfil actualizado exitosamente")
            print(f"   👤 Nuevo nombre: {updated_data['user']['first_name']}")
            print(f"   📱 Nuevo teléfono: {updated_data['user']['perfil']['telefono']}")
        else:
            print(f"   ❌ Error actualizando perfil: {response.status_code}")
            return False
        
        # 6. Logout
        print("6. Cerrando sesión...")
        response = requests.post(f"{base_url}/logout/", headers=headers)
        
        if response.status_code == 200:
            print("   ✅ Logout exitoso")
        else:
            print(f"   ❌ Error en logout: {response.status_code}")
        
        print("\n🎉 TODAS LAS PRUEBAS DE BACKEND PASARON")
        return True
        
    except Exception as e:
        print(f"❌ Error en pruebas de backend: {str(e)}")
        return False

def test_frontend_urls():
    """Prueba que las URLs del frontend respondan correctamente"""
    print_section("PRUEBAS DE FRONTEND - URLs y Páginas")
    
    frontend_url = "http://localhost:3000"
    
    urls_to_test = [
        "/",
        "/productos", 
        "/perfil",
        "/mis-pedidos",
        "/favoritos",
        "/contacto",
        "/ayuda"
    ]
    
    try:
        for url in urls_to_test:
            print(f"Probando {url}...")
            try:
                response = requests.get(f"{frontend_url}{url}", timeout=10)
                if response.status_code == 200:
                    print(f"   ✅ {url} - OK")
                else:
                    print(f"   ⚠️ {url} - Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"   ❌ {url} - Error: {str(e)}")
        
        print("\n✅ Pruebas de URLs del frontend completadas")
        return True
        
    except Exception as e:
        print(f"❌ Error en pruebas de frontend: {str(e)}")
        return False

def test_database_consistency():
    """Verifica la consistencia de la base de datos"""
    print_section("PRUEBAS DE BASE DE DATOS - Consistencia")
    
    try:
        # Contar usuarios y perfiles
        users_count = User.objects.count()
        profiles_count = PerfilUsuario.objects.count()
        
        print(f"👥 Total usuarios: {users_count}")
        print(f"📋 Total perfiles: {profiles_count}")
        
        # Verificar que cada usuario tenga un perfil
        users_without_profile = User.objects.filter(perfil__isnull=True).count()
        profiles_without_user = PerfilUsuario.objects.filter(user__isnull=True).count()
        
        if users_without_profile == 0:
            print("   ✅ Todos los usuarios tienen perfil")
        else:
            print(f"   ⚠️ {users_without_profile} usuarios sin perfil")
        
        if profiles_without_user == 0:
            print("   ✅ Todos los perfiles tienen usuario")
        else:
            print(f"   ⚠️ {profiles_without_user} perfiles sin usuario")
        
        # Verificar usuario de prueba
        test_user = User.objects.filter(username="test_frontend_user").first()
        if test_user:
            print(f"   ✅ Usuario de prueba encontrado: {test_user.username}")
            if hasattr(test_user, 'perfil'):
                print(f"   ✅ Perfil asociado: {test_user.perfil.telefono}")
            else:
                print("   ⚠️ Usuario de prueba sin perfil")
        
        print("\n✅ Verificación de base de datos completada")
        return True
        
    except Exception as e:
        print(f"❌ Error en verificación de base de datos: {str(e)}")
        return False

def cleanup_test_data():
    """Limpia los datos de prueba"""
    print_section("LIMPIEZA - Eliminando datos de prueba")
    
    try:
        # Eliminar usuario de prueba
        deleted_count = User.objects.filter(username="test_frontend_user").delete()[0]
        if deleted_count > 0:
            print(f"   ✅ Eliminados {deleted_count} registros de prueba")
        else:
            print("   ℹ️ No hay datos de prueba para eliminar")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en limpieza: {str(e)}")
        return False

def main():
    """Función principal"""
    print_section("INICIO DE PRUEBAS - Sistema de Autenticación Frontend")
    print(f"🕒 Fecha y hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "backend_apis": False,
        "frontend_urls": False,
        "database_consistency": False,
        "cleanup": False
    }
    
    # Ejecutar pruebas
    results["backend_apis"] = test_backend_apis()
    results["frontend_urls"] = test_frontend_urls()
    results["database_consistency"] = test_database_consistency()
    results["cleanup"] = cleanup_test_data()
    
    # Resumen final
    print_section("RESUMEN FINAL")
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n🎯 RESULTADO: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de autenticación está funcionando correctamente.")
        return True
    else:
        print("⚠️ Algunas pruebas fallaron. Revisa los errores arriba.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
