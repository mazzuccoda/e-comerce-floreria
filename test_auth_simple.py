#!/usr/bin/env python3
"""
Script de prueba simple para validar las APIs de autenticación
"""

import os
import sys
import django
import requests
import json

# Configurar Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User

def test_auth_apis():
    """Prueba las APIs de autenticación"""
    print("🔐 PRUEBAS DE AUTENTICACIÓN - APIs Backend")
    print("=" * 50)
    
    base_url = "http://web:8000/api/usuarios"
    
    # Datos de prueba
    test_data = {
        "username": "test_auth_user",
        "email": "test_auth@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "Auth"
    }
    
    try:
        # Limpiar usuario existente
        User.objects.filter(username=test_data['username']).delete()
        
        # 1. Registro
        print("1. 📝 Registrando usuario...")
        response = requests.post(f"{base_url}/registro/", 
                               json=test_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            register_data = response.json()
            print(f"   ✅ Usuario registrado: {register_data['user']['username']}")
            token = register_data['token']
        else:
            print(f"   ❌ Error en registro: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return False
        
        # 2. Login
        print("2. 🔑 Probando login...")
        login_data = {
            "username": test_data['username'],
            "password": test_data['password']
        }
        response = requests.post(f"{base_url}/login/", 
                               json=login_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            login_response = response.json()
            print(f"   ✅ Login exitoso")
            token = login_response['token']
        else:
            print(f"   ❌ Error en login: {response.status_code}")
            return False
        
        # 3. Verificar perfil
        print("3. 👤 Obteniendo perfil...")
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        response = requests.get(f"{base_url}/perfil/", headers=headers)
        
        if response.status_code == 200:
            profile_data = response.json()
            print(f"   ✅ Perfil obtenido: {profile_data['user']['email']}")
        else:
            print(f"   ❌ Error obteniendo perfil: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return False
        
        # 4. Logout
        print("4. 🚪 Cerrando sesión...")
        response = requests.post(f"{base_url}/logout/", headers=headers)
        
        if response.status_code == 200:
            print("   ✅ Logout exitoso")
        else:
            print(f"   ❌ Error en logout: {response.status_code}")
        
        # Limpiar
        User.objects.filter(username=test_data['username']).delete()
        
        print("\n🎉 TODAS LAS PRUEBAS DE AUTENTICACIÓN PASARON")
        return True
        
    except Exception as e:
        print(f"❌ Error en pruebas: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_auth_apis()
    print(f"\n{'✅ ÉXITO' if success else '❌ FALLÓ'}")
    sys.exit(0 if success else 1)
