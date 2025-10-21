#!/usr/bin/env python
"""
Script de diagnóstico para verificar configuración de email en Railway
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail
import socket

def verificar_configuracion():
    """Verifica la configuración de email"""
    print("\n" + "="*80)
    print("🔍 DIAGNÓSTICO DE CONFIGURACIÓN DE EMAIL EN RAILWAY")
    print("="*80 + "\n")
    
    # 1. Verificar variables de entorno
    print("📋 VARIABLES DE ENTORNO:")
    print("-" * 80)
    
    variables = {
        'EMAIL_BACKEND': getattr(settings, 'EMAIL_BACKEND', 'NO CONFIGURADO'),
        'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', 'NO CONFIGURADO'),
        'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', 'NO CONFIGURADO'),
        'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', 'NO CONFIGURADO'),
        'EMAIL_USE_SSL': getattr(settings, 'EMAIL_USE_SSL', 'NO CONFIGURADO'),
        'EMAIL_HOST_USER': getattr(settings, 'EMAIL_HOST_USER', 'NO CONFIGURADO'),
        'EMAIL_HOST_PASSWORD': '***' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else 'NO CONFIGURADO',
        'DEFAULT_FROM_EMAIL': getattr(settings, 'DEFAULT_FROM_EMAIL', 'NO CONFIGURADO'),
    }
    
    for key, value in variables.items():
        status = "✅" if value != 'NO CONFIGURADO' else "❌"
        print(f"{status} {key}: {value}")
    
    # 2. Verificar conectividad SMTP
    print("\n" + "="*80)
    print("🌐 VERIFICANDO CONECTIVIDAD SMTP")
    print("="*80 + "\n")
    
    host = getattr(settings, 'EMAIL_HOST', None)
    port = getattr(settings, 'EMAIL_PORT', None)
    
    if host and port:
        try:
            print(f"🔌 Intentando conectar a {host}:{port}...")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((host, int(port)))
            sock.close()
            
            if result == 0:
                print(f"✅ Puerto {port} está ABIERTO y accesible")
            else:
                print(f"❌ Puerto {port} está CERRADO o bloqueado")
                print(f"   Error code: {result}")
        except socket.timeout:
            print(f"⏱️ TIMEOUT: No se pudo conectar en 10 segundos")
            print(f"   Posible causa: Railway está bloqueando el puerto {port}")
        except Exception as e:
            print(f"❌ Error de conexión: {str(e)}")
    else:
        print("❌ EMAIL_HOST o EMAIL_PORT no configurados")
    
    # 3. Intentar enviar email de prueba
    print("\n" + "="*80)
    print("📧 INTENTANDO ENVIAR EMAIL DE PRUEBA")
    print("="*80 + "\n")
    
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'test@test.com')
        to_email = 'dmazzucco@sanmiguelglobal.com'
        
        print(f"📮 Desde: {from_email}")
        print(f"📬 Para: {to_email}")
        print(f"📋 Asunto: Test desde Railway - {os.environ.get('RAILWAY_ENVIRONMENT', 'local')}")
        print("\n⏳ Enviando email (timeout: 15 segundos)...\n")
        
        # Configurar timeout
        original_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(15)
        
        try:
            send_mail(
                subject=f"✅ Test Email Railway - {os.environ.get('RAILWAY_ENVIRONMENT', 'local')}",
                message=f"""
Este es un email de prueba desde Railway.

Configuración:
- Backend: {getattr(settings, 'EMAIL_BACKEND', 'N/A')}
- Host: {getattr(settings, 'EMAIL_HOST', 'N/A')}
- Port: {getattr(settings, 'EMAIL_PORT', 'N/A')}
- TLS: {getattr(settings, 'EMAIL_USE_TLS', 'N/A')}
- User: {getattr(settings, 'EMAIL_HOST_USER', 'N/A')}

Timestamp: {os.environ.get('RAILWAY_DEPLOYMENT_ID', 'N/A')}
                """,
                from_email=from_email,
                recipient_list=[to_email],
                fail_silently=False
            )
            
            print("✅ EMAIL ENVIADO EXITOSAMENTE!")
            print("\n📬 Revisa tu bandeja de entrada (o spam) en:")
            print(f"   {to_email}")
            
        finally:
            socket.setdefaulttimeout(original_timeout)
            
    except socket.timeout:
        print("❌ TIMEOUT: El servidor SMTP no respondió en 15 segundos")
        print("\n🔍 POSIBLES CAUSAS:")
        print("   1. Railway está bloqueando el puerto 587 (SMTP)")
        print("   2. SendGrid está rechazando la conexión")
        print("   3. Firewall o configuración de red")
        print("\n💡 SOLUCIONES:")
        print("   1. Verificar que EMAIL_HOST_USER='apikey' (literal)")
        print("   2. Verificar que EMAIL_HOST_PASSWORD sea tu API Key de SendGrid")
        print("   3. Intentar con puerto 465 (SSL) en lugar de 587 (TLS)")
        print("   4. Contactar soporte de Railway si el problema persiste")
        
    except Exception as e:
        print(f"❌ ERROR ENVIANDO EMAIL: {str(e)}")
        print(f"\n🔍 Tipo de error: {type(e).__name__}")
        
        if "Authentication" in str(e) or "535" in str(e):
            print("\n💡 ERROR DE AUTENTICACIÓN:")
            print("   - Verifica que EMAIL_HOST_USER='apikey' (literal, no tu email)")
            print("   - Verifica que EMAIL_HOST_PASSWORD sea tu API Key de SendGrid")
            print("   - La API Key debe empezar con 'SG.'")
            
        elif "Connection refused" in str(e):
            print("\n💡 CONEXIÓN RECHAZADA:")
            print("   - El puerto 587 puede estar bloqueado por Railway")
            print("   - Intenta usar puerto 465 con EMAIL_USE_SSL=True")
            
        import traceback
        print("\n📋 TRACEBACK COMPLETO:")
        print("-" * 80)
        traceback.print_exc()
    
    # 4. Verificar notificaciones pendientes
    print("\n" + "="*80)
    print("📬 NOTIFICACIONES PENDIENTES EN BASE DE DATOS")
    print("="*80 + "\n")
    
    try:
        from notificaciones.models import Notificacion, EstadoNotificacion
        
        pendientes = Notificacion.objects.filter(
            estado=EstadoNotificacion.PENDIENTE
        ).count()
        
        fallidas = Notificacion.objects.filter(
            estado=EstadoNotificacion.FALLIDA
        ).count()
        
        enviadas = Notificacion.objects.filter(
            estado=EstadoNotificacion.ENVIADA
        ).count()
        
        print(f"📊 Estadísticas:")
        print(f"   ⏳ Pendientes: {pendientes}")
        print(f"   ❌ Fallidas: {fallidas}")
        print(f"   ✅ Enviadas: {enviadas}")
        
        if fallidas > 0:
            print(f"\n⚠️ Hay {fallidas} notificaciones fallidas")
            ultimas_fallidas = Notificacion.objects.filter(
                estado=EstadoNotificacion.FALLIDA
            ).order_by('-fecha_creacion')[:5]
            
            print("\n📋 Últimas 5 notificaciones fallidas:")
            for notif in ultimas_fallidas:
                print(f"   - ID: {notif.id} | Error: {notif.error_mensaje[:100]}")
                
    except Exception as e:
        print(f"❌ Error consultando notificaciones: {str(e)}")
    
    print("\n" + "="*80)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("="*80 + "\n")

if __name__ == '__main__':
    verificar_configuracion()
