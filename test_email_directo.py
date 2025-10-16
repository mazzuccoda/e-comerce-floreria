#!/usr/bin/env python
"""
Script de prueba directa de envío de email
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

print("=" * 80)
print("🧪 PRUEBA DIRECTA DE EMAIL CON DETALLES COMPLETOS")
print("=" * 80)

# 1. Verificar configuración
print("\n📋 CONFIGURACIÓN ACTUAL:")
print(f"Backend: {settings.EMAIL_BACKEND}")
print(f"Host: {settings.EMAIL_HOST}")
print(f"Port: {settings.EMAIL_PORT}")
print(f"TLS: {settings.EMAIL_USE_TLS}")
print(f"User: {settings.EMAIL_HOST_USER}")
print(f"Password configurado: {'✅ Sí' if settings.EMAIL_HOST_PASSWORD else '❌ No'}")
print(f"From: {settings.DEFAULT_FROM_EMAIL}")

# 2. Prueba con Django send_mail
print("\n" + "=" * 80)
print("📧 PRUEBA 1: Envío con Django send_mail()")
print("=" * 80)

try:
    result = send_mail(
        subject='🧪 Prueba Directa - Florería Cristina',
        message='Este es un email de prueba directa.\n\nSi recibes este mensaje, el sistema funciona.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['dmazzucco@sanmiguelglobal.com'],
        fail_silently=False
    )
    print(f"✅ Django send_mail() retornó: {result}")
    print("   (1 = éxito, 0 = fallo)")
except Exception as e:
    print(f"❌ ERROR en Django send_mail(): {e}")
    import traceback
    traceback.print_exc()

# 3. Prueba directa con smtplib
print("\n" + "=" * 80)
print("📧 PRUEBA 2: Envío directo con smtplib (más detallado)")
print("=" * 80)

try:
    # Crear mensaje
    msg = MIMEMultipart()
    msg['From'] = settings.DEFAULT_FROM_EMAIL
    msg['To'] = 'dmazzucco@sanmiguelglobal.com'
    msg['Subject'] = '🧪 Prueba SMTP Directa - Florería Cristina'
    
    body = """Este es un email de prueba usando smtplib directamente.

Si recibes este mensaje, significa que:
✅ La conexión SMTP funciona
✅ La autenticación es correcta
✅ Gmail acepta el envío

Saludos,
Sistema de Pruebas"""
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Conectar a Gmail
    print(f"🔌 Conectando a {settings.EMAIL_HOST}:{settings.EMAIL_PORT}...")
    server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
    server.set_debuglevel(1)  # Mostrar debug completo
    
    print("🔐 Iniciando TLS...")
    server.starttls()
    
    print(f"👤 Autenticando como {settings.EMAIL_HOST_USER}...")
    server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
    
    print("📤 Enviando email...")
    server.send_message(msg)
    
    print("✅ EMAIL ENVIADO EXITOSAMENTE")
    server.quit()
    
except smtplib.SMTPAuthenticationError as e:
    print(f"❌ ERROR DE AUTENTICACIÓN: {e}")
    print("\n💡 POSIBLES CAUSAS:")
    print("   1. Contraseña de aplicación incorrecta")
    print("   2. Verificación en 2 pasos no activada en Gmail")
    print("   3. Contraseña de aplicación no generada correctamente")
    
except smtplib.SMTPException as e:
    print(f"❌ ERROR SMTP: {e}")
    
except Exception as e:
    print(f"❌ ERROR GENERAL: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("✅ PRUEBA COMPLETADA")
print("=" * 80)
print("\n💡 PRÓXIMOS PASOS:")
print("1. Revisa la salida arriba para ver errores específicos")
print("2. Si hay error de autenticación, regenera la contraseña de aplicación")
print("3. Si no hay errores, revisa SPAM en dmazzucco@sanmiguelglobal.com")
print("4. Prueba también con mazzucoda@gmail.com")
