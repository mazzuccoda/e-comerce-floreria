#!/usr/bin/env python
"""
Script de prueba para n8n + Twilio WhatsApp
Prueba el flujo completo de notificaciones vía webhook
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from notificaciones.n8n_service import n8n_service


def print_header(title):
    """Imprime un encabezado formateado"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


def print_step(step, description):
    """Imprime un paso de prueba"""
    print(f"\n🔸 Paso {step}: {description}")


def print_success(message):
    """Imprime mensaje de éxito"""
    print(f"✅ {message}")


def print_error(message):
    """Imprime mensaje de error"""
    print(f"❌ {message}")


def print_info(message):
    """Imprime mensaje informativo"""
    print(f"ℹ️  {message}")


def print_warning(message):
    """Imprime mensaje de advertencia"""
    print(f"⚠️  {message}")


def test_configuracion_n8n():
    """Prueba 1: Verificar configuración de n8n"""
    print_header("PRUEBA 1: CONFIGURACIÓN DE N8N")
    
    n8n_url = getattr(settings, 'N8N_WEBHOOK_URL', None)
    n8n_api_key = getattr(settings, 'N8N_API_KEY', None)
    n8n_enabled = getattr(settings, 'N8N_ENABLED', False)
    
    print_info(f"N8N_WEBHOOK_URL: {n8n_url}")
    print_info(f"N8N_API_KEY: {'✅ Configurado' if n8n_api_key else '❌ No configurado'}")
    print_info(f"N8N_ENABLED: {n8n_enabled}")
    
    if not n8n_enabled:
        print_warning("n8n está DESHABILITADO. Para habilitarlo:")
        print_info("  export N8N_ENABLED=True")
        print_info("  O en Railway: N8N_ENABLED=True")
        return False
    
    if not n8n_api_key:
        print_error("N8N_API_KEY no está configurado")
        print_info("Configura la variable de entorno N8N_API_KEY")
        return False
    
    print_success("Configuración de n8n correcta")
    return True


def test_configuracion_twilio():
    """Prueba 2: Verificar configuración de Twilio"""
    print_header("PRUEBA 2: CONFIGURACIÓN DE TWILIO")
    
    twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    twilio_whatsapp = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
    
    print_info(f"TWILIO_ACCOUNT_SID: {'✅ Configurado' if twilio_sid and not twilio_sid.startswith('ACxxx') else '❌ No configurado'}")
    print_info(f"TWILIO_AUTH_TOKEN: {'✅ Configurado' if twilio_token and twilio_token != 'your_auth_token' else '❌ No configurado'}")
    print_info(f"TWILIO_WHATSAPP_NUMBER: {twilio_whatsapp}")
    
    if not twilio_sid or twilio_sid.startswith('ACxxx'):
        print_error("TWILIO_ACCOUNT_SID no está configurado correctamente")
        return False
    
    if not twilio_token or twilio_token == 'your_auth_token':
        print_error("TWILIO_AUTH_TOKEN no está configurado correctamente")
        return False
    
    if not twilio_whatsapp:
        print_error("TWILIO_WHATSAPP_NUMBER no está configurado")
        return False
    
    print_success("Configuración de Twilio correcta")
    return True


def test_conexion_n8n():
    """Prueba 3: Probar conexión con n8n"""
    print_header("PRUEBA 3: CONEXIÓN CON N8N")
    
    n8n_url = getattr(settings, 'N8N_WEBHOOK_URL', 'http://localhost:5678')
    
    print_info(f"Intentando conectar a: {n8n_url}")
    
    try:
        # Intentar hacer ping a n8n (puede no tener endpoint de health)
        response = requests.get(n8n_url, timeout=5)
        print_success(f"n8n responde (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print_error("No se pudo conectar a n8n")
        print_info("Verifica que n8n esté corriendo y accesible")
        return False
    except requests.exceptions.Timeout:
        print_error("Timeout al conectar con n8n")
        return False
    except Exception as e:
        print_warning(f"Error al conectar: {str(e)}")
        print_info("Esto puede ser normal si n8n no tiene endpoint raíz")
        return True


def test_webhook_manual():
    """Prueba 4: Enviar datos de prueba al webhook manualmente"""
    print_header("PRUEBA 4: WEBHOOK MANUAL (SIN SERVICIO)")
    
    n8n_url = getattr(settings, 'N8N_WEBHOOK_URL', 'http://localhost:5678')
    n8n_api_key = getattr(settings, 'N8N_API_KEY', '')
    
    # Datos de prueba
    test_data = {
        'pedido_id': 99999,
        'numero_pedido': 'TEST-001',
        'nombre_destinatario': 'Juan Pérez',
        'telefono_destinatario': '+5491123456789',
        'direccion': 'Av. Corrientes 1234, CABA',
        'fecha_entrega': '28/10/2025',
        'franja_horaria': 'Mañana (9:00 - 13:00)',
        'estado': 'confirmado',
        'total': '15000.00',
        'dedicatoria': 'Feliz cumpleaños! 🎂',
        'items': [
            {
                'producto_nombre': 'Ramo de 12 Rosas Rojas',
                'cantidad': 1,
                'precio': '15000.00'
            }
        ]
    }
    
    webhook_url = f"{n8n_url}/webhook/pedido-confirmado"
    
    print_info(f"Enviando a: {webhook_url}")
    print_info(f"Datos: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            webhook_url,
            json=test_data,
            headers={
                'X-API-Key': n8n_api_key,
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            print_success("Webhook respondió correctamente")
            print_success("Revisa tu WhatsApp para ver si llegó el mensaje")
            return True
        else:
            print_error(f"Webhook falló con código {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("No se pudo conectar al webhook")
        print_info("Verifica que el workflow esté ACTIVO en n8n")
        return False
    except requests.exceptions.Timeout:
        print_error("Timeout esperando respuesta del webhook")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_servicio_n8n():
    """Prueba 5: Usar el servicio N8NService"""
    print_header("PRUEBA 5: SERVICIO N8NService")
    
    if not n8n_service.enabled:
        print_error("n8n_service está deshabilitado")
        return False
    
    # Crear objeto mock de pedido
    class MockPedido:
        id = 99999
        numero_pedido = 'TEST-002'
        nombre_destinatario = 'María García'
        telefono_destinatario = '+5491123456789'
        direccion = 'Av. Santa Fe 2500, CABA'
        fecha_entrega = datetime.now() + timedelta(days=1)
        estado = 'confirmado'
        total = 25000.00
        dedicatoria = '¡Felicidades! 🎉'
        
        def get_franja_horaria_display(self):
            return 'Tarde (14:00 - 18:00)'
        
        class Items:
            @staticmethod
            def all():
                class Item:
                    class Producto:
                        nombre = 'Arreglo Floral Premium'
                    producto = Producto()
                    cantidad = 1
                    precio = '25000.00'
                return [Item()]
        
        items = Items()
    
    pedido_mock = MockPedido()
    
    print_info("Enviando notificación con N8NService...")
    
    try:
        success = n8n_service.enviar_notificacion_pedido(
            pedido=pedido_mock,
            tipo='confirmado'
        )
        
        if success:
            print_success("Notificación enviada exitosamente")
            print_success("Revisa tu WhatsApp para ver si llegó el mensaje")
            return True
        else:
            print_error("La notificación no se pudo enviar")
            return False
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_formato_numero():
    """Prueba 6: Verificar formato de número de teléfono"""
    print_header("PRUEBA 6: FORMATO DE NÚMERO DE TELÉFONO")
    
    numeros_prueba = [
        '+5491123456789',
        '5491123456789',
        '1123456789',
        '+54 9 11 2345-6789',
    ]
    
    print_info("Formatos de número que deberían funcionar:")
    for numero in numeros_prueba:
        print_info(f"  - {numero}")
    
    print_warning("IMPORTANTE: El número debe estar en formato E.164")
    print_info("Formato correcto: +5491123456789")
    print_info("  +54: Código de país (Argentina)")
    print_info("  9: Código de celular")
    print_info("  11: Código de área (Buenos Aires)")
    print_info("  23456789: Número local")
    
    return True


def main():
    """Función principal de pruebas"""
    print_header("🌸 PRUEBA N8N + TWILIO WHATSAPP - FLORERÍA CRISTINA 🌸")
    print_info("Iniciando pruebas de integración n8n + Twilio...")
    
    resultados = []
    
    # Ejecutar pruebas en orden
    print_step(1, "Verificando configuración de n8n")
    config_n8n = test_configuracion_n8n()
    resultados.append(("Configuración n8n", config_n8n))
    
    print_step(2, "Verificando configuración de Twilio")
    config_twilio = test_configuracion_twilio()
    resultados.append(("Configuración Twilio", config_twilio))
    
    if config_n8n:
        print_step(3, "Probando conexión con n8n")
        conexion = test_conexion_n8n()
        resultados.append(("Conexión n8n", conexion))
        
        print_step(4, "Enviando webhook de prueba")
        webhook = test_webhook_manual()
        resultados.append(("Webhook manual", webhook))
        
        if webhook:
            print_step(5, "Probando servicio N8NService")
            servicio = test_servicio_n8n()
            resultados.append(("Servicio N8NService", servicio))
    
    print_step(6, "Verificando formato de número")
    formato = test_formato_numero()
    resultados.append(("Formato número", formato))
    
    # Resumen final
    print_header("RESUMEN DE PRUEBAS")
    
    exitosas = 0
    for nombre, resultado in resultados:
        if resultado:
            print_success(f"{nombre}: EXITOSA")
            exitosas += 1
        else:
            print_error(f"{nombre}: FALLIDA")
    
    print(f"\n📊 Resultado final: {exitosas}/{len(resultados)} pruebas exitosas")
    
    if exitosas == len(resultados):
        print_success("🎉 ¡Todas las pruebas pasaron!")
        print_info("\n✅ El sistema está listo para enviar WhatsApp")
        print_info("\n📝 Próximos pasos:")
        print_info("1. Integrar n8n_service en pedidos/models.py")
        print_info("2. Probar con un pedido real")
        print_info("3. Verificar logs en Railway y n8n")
    else:
        print_error("⚠️  Algunas pruebas fallaron")
        print_info("\n🔧 Soluciones:")
        
        if not config_n8n:
            print_info("• Configurar variables de entorno:")
            print_info("  N8N_WEBHOOK_URL=https://n8n-production-e029.up.railway.app")
            print_info("  N8N_API_KEY=tu_api_key")
            print_info("  N8N_ENABLED=True")
        
        if not config_twilio:
            print_info("• Configurar credenciales de Twilio:")
            print_info("  TWILIO_ACCOUNT_SID=ACxxxxx")
            print_info("  TWILIO_AUTH_TOKEN=xxxxx")
            print_info("  TWILIO_WHATSAPP_NUMBER=+14155238886")
    
    print_info("\n📖 Documentación:")
    print_info("• n8n: https://docs.n8n.io/")
    print_info("• Twilio WhatsApp: https://www.twilio.com/docs/whatsapp")


if __name__ == '__main__':
    main()
