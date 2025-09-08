#!/usr/bin/env python3
"""
Script para probar las APIs de usuarios
"""

import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json

def test_usuarios_api():
    """Prueba las APIs de usuarios"""
    print("🧪 Probando APIs de usuarios...")
    
    # Crear cliente de prueba
    client = Client()
    
    # 1. Probar registro de usuario
    print("\n📝 Probando registro de usuario...")
    
    registro_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'password_confirm': 'TestPassword123!',
        'first_name': 'Test',
        'last_name': 'User',
        'telefono': '1234567890',
        'ciudad': 'Buenos Aires'
    }
    
    response = client.post(
        '/api/usuarios/registro/',
        data=json.dumps(registro_data),
        content_type='application/json'
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Usuario registrado: {result.get('user', {}).get('username')}")
        token = result.get('token')
        print(f"✅ Token generado: {token[:20]}...")
        
        # 2. Probar login
        print("\n🔐 Probando login...")
        
        login_data = {
            'username': 'testuser',
            'password': 'TestPassword123!'
        }
        
        response = client.post(
            '/api/usuarios/login/',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Login exitoso: {result.get('message')}")
            token = result.get('token')
            
            # 3. Probar obtener perfil
            print("\n👤 Probando obtener perfil...")
            
            response = client.get(
                '/api/usuarios/perfil/',
                HTTP_AUTHORIZATION=f'Token {token}'
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                perfil = response.json()
                print(f"✅ Perfil obtenido: {perfil.get('username')}")
                print(f"Email: {perfil.get('email')}")
                print(f"Teléfono: {perfil.get('perfil', {}).get('telefono')}")
                
                # 4. Probar verificaciones
                print("\n🔍 Probando verificaciones...")
                
                # Verificar usuario existente
                response = client.get('/api/usuarios/verificar-usuario/testuser/')
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Usuario existe: {result.get('exists')}")
                
                # Verificar email existente
                response = client.get('/api/usuarios/verificar-email/test@example.com/')
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Email existe: {result.get('exists')}")
                
                # 5. Probar logout
                print("\n🚪 Probando logout...")
                
                response = client.post(
                    '/api/usuarios/logout/',
                    HTTP_AUTHORIZATION=f'Token {token}'
                )
                
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Logout exitoso: {result.get('message')}")
                    
                    print("\n🎉 ¡TODAS LAS APIS DE USUARIOS FUNCIONAN CORRECTAMENTE!")
                    return True
                else:
                    print(f"❌ Error en logout: {response.content.decode()}")
            else:
                print(f"❌ Error al obtener perfil: {response.content.decode()}")
        else:
            print(f"❌ Error en login: {response.content.decode()}")
    else:
        print(f"❌ Error en registro: {response.content.decode()}")
    
    return False

if __name__ == "__main__":
    success = test_usuarios_api()
    if success:
        print("\n✅ PRUEBA EXITOSA: Sistema de usuarios completamente funcional")
        print("🚀 Listo para integrar en el frontend")
    else:
        print("\n❌ PRUEBA FALLIDA: Revisar configuración de usuarios")
