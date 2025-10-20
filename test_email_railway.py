#!/usr/bin/env python
"""
Script simple para probar emails en Railway
Ejecutar: railway run python test_email_railway.py
O en el contenedor: python test_email_railway.py
"""

import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

print("\n" + "="*60)
print("🧪 PRUEBA RÁPIDA DE EMAIL")
print("="*60)

# Mostrar configuración
print(f"\n📋 Configuración:")
print(f"   Backend: {settings.EMAIL_BACKEND}")
print(f"   Host: {settings.EMAIL_HOST}")
print(f"   Port: {settings.EMAIL_PORT}")
print(f"   User: {settings.EMAIL_HOST_USER}")
print(f"   From: {settings.DEFAULT_FROM_EMAIL}")

# Email de destino (cambiar por tu email)
EMAIL_DESTINO = "mazzucoda@gmail.com"  # ⚠️ CAMBIAR POR TU EMAIL

print(f"\n📤 Enviando email de prueba a: {EMAIL_DESTINO}")

try:
    resultado = send_mail(
        subject='🌸 Prueba desde Railway - Florería Cristina',
        message=f'''
¡Hola!

Este es un email de prueba desde Railway.

Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
Backend: {settings.EMAIL_BACKEND}
Host: {settings.EMAIL_HOST}

Si recibes este email, ¡la configuración funciona! ✅

Saludos,
Florería Cristina
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[EMAIL_DESTINO],
        fail_silently=False
    )
    
    if resultado == 1:
        print("✅ Email enviado exitosamente!")
        print(f"📬 Verifica tu bandeja: {EMAIL_DESTINO}")
        print("💡 Si no lo ves, revisa SPAM")
    else:
        print("⚠️  Email enviado pero sin confirmación")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    print("\nPosibles causas:")
    print("- App Password incorrecta")
    print("- Variables mal configuradas en Railway")
    print("- Firewall bloqueando puerto 587")

print("\n" + "="*60 + "\n")
