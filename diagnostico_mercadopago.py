#!/usr/bin/env python
"""
Script para diagnosticar problemas con MercadoPago
Ejecutar: python diagnostico_mercadopago.py
"""

import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
import mercadopago

print("\n" + "="*70)
print("🔍 DIAGNÓSTICO DE MERCADOPAGO")
print("="*70)

# 1. Verificar configuración
print("\n📋 1. CONFIGURACIÓN:")
access_token = settings.MERCADOPAGO.get('ACCESS_TOKEN')
public_key = settings.MERCADOPAGO.get('PUBLIC_KEY')

if access_token:
    token_preview = f"{access_token[:15]}...{access_token[-10:]}" if len(access_token) > 25 else "TOKEN_TOO_SHORT"
    print(f"   Access Token: {token_preview}")
    print(f"   Token Length: {len(access_token)}")
    
    # Determinar tipo de token
    if access_token.startswith('TEST-'):
        print(f"   Tipo: ✅ TEST (Sandbox)")
    elif access_token.startswith('APP_USR-'):
        print(f"   Tipo: ✅ PRODUCCIÓN")
    else:
        print(f"   Tipo: ⚠️ DESCONOCIDO (puede ser inválido)")
else:
    print("   ❌ ACCESS_TOKEN no configurado")

if public_key:
    key_preview = f"{public_key[:15]}...{public_key[-10:]}" if len(public_key) > 25 else "KEY_TOO_SHORT"
    print(f"   Public Key: {key_preview}")
else:
    print("   ❌ PUBLIC_KEY no configurado")

# 2. Probar conexión con MercadoPago
print("\n🧪 2. PRUEBA DE CONEXIÓN:")

if not access_token:
    print("   ❌ No se puede probar: falta ACCESS_TOKEN")
else:
    try:
        sdk = mercadopago.SDK(access_token)
        print("   ✅ SDK inicializado")
        
        # Intentar crear una preferencia mínima
        print("\n   📤 Creando preferencia de prueba...")
        
        test_preference = {
            "items": [
                {
                    "id": "test-001",
                    "title": "Producto de Prueba",
                    "description": "Test",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": 100.00
                }
            ],
            "payer": {
                "name": "Test User",
                "email": "test@test.com"
            }
        }
        
        response = sdk.preference().create(test_preference)
        
        print(f"\n   📥 Response Status: {response.get('status')}")
        
        if response.get('status') == 201:
            print("   ✅ CONEXIÓN EXITOSA!")
            print(f"   Preference ID: {response['response']['id']}")
            print(f"   Init Point: {response['response']['init_point'][:50]}...")
        else:
            print("   ❌ ERROR EN LA RESPUESTA:")
            print(f"\n   Response completo:")
            print(json.dumps(response, indent=2, ensure_ascii=False))
            
            # Analizar el error
            if response.get('status') == 400:
                print("\n   ⚠️ Error 400: Datos inválidos en la preferencia")
            elif response.get('status') == 401:
                print("\n   ⚠️ Error 401: Credenciales inválidas o expiradas")
            elif response.get('status') == 403:
                print("\n   ⚠️ Error 403: Acceso denegado")
            elif response.get('status') >= 500:
                print("\n   ⚠️ Error 5xx: Problema en los servidores de MercadoPago")
                
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        import traceback
        print("\n   Stack trace:")
        traceback.print_exc()

# 3. Verificar último pedido
print("\n📦 3. VERIFICAR ÚLTIMO PEDIDO:")

try:
    from pedidos.models import Pedido
    
    ultimo_pedido = Pedido.objects.order_by('-creado').first()
    
    if ultimo_pedido:
        print(f"   Pedido: #{ultimo_pedido.numero_pedido or ultimo_pedido.id}")
        print(f"   Total: ${ultimo_pedido.total}")
        print(f"   Tipo envío: {ultimo_pedido.tipo_envio}")
        print(f"   Estado pago: {ultimo_pedido.estado_pago}")
        print(f"   Items: {ultimo_pedido.items.count()}")
        
        # Intentar crear preferencia para este pedido
        print("\n   🧪 Intentando crear preferencia para este pedido...")
        
        try:
            from pedidos.mercadopago_service import MercadoPagoService
            from django.test import RequestFactory
            
            mp_service = MercadoPagoService()
            factory = RequestFactory()
            request = factory.get('/')
            
            result = mp_service.create_preference(ultimo_pedido, request)
            
            if result['success']:
                print("   ✅ Preferencia creada exitosamente!")
                print(f"   Preference ID: {result['preference_id']}")
            else:
                print(f"   ❌ Error: {result['error']}")
                
        except Exception as e:
            print(f"   ❌ Error creando preferencia: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("   ⚠️ No hay pedidos en la base de datos")
        
except Exception as e:
    print(f"   ❌ Error: {str(e)}")

# 4. Resumen
print("\n" + "="*70)
print("📊 RESUMEN:")
print("="*70)

issues = []

if not access_token:
    issues.append("ACCESS_TOKEN no configurado")
elif not access_token.startswith(('TEST-', 'APP_USR-')):
    issues.append("ACCESS_TOKEN tiene formato inválido")

if not public_key:
    issues.append("PUBLIC_KEY no configurado")

if issues:
    print("\n⚠️ PROBLEMAS ENCONTRADOS:")
    for i, issue in enumerate(issues, 1):
        print(f"   {i}. {issue}")
    print("\n💡 SOLUCIÓN:")
    print("   1. Verifica las credenciales en Railway")
    print("   2. Genera nuevas credenciales en MercadoPago si es necesario")
    print("   3. Asegúrate de usar credenciales de TEST para pruebas")
else:
    print("\n✅ Configuración básica correcta")
    print("   Si ves errores arriba, revisa los detalles")

print("\n" + "="*70 + "\n")
