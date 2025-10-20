#!/usr/bin/env python
"""
Script para verificar la configuración de email
Ejecutar: python verificar_email.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail
from notificaciones.models import PlantillaNotificacion, CanalNotificacion

print("\n" + "="*60)
print("🔍 DIAGNÓSTICO DE CONFIGURACIÓN DE EMAIL")
print("="*60)

# 1. Verificar configuración de Django
print("\n📋 1. CONFIGURACIÓN DE DJANGO:")
print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '❌ NO CONFIGURADO'}")
print(f"   EMAIL_HOST_PASSWORD: {'✅ Configurado' if settings.EMAIL_HOST_PASSWORD else '❌ NO CONFIGURADO'}")
print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# 2. Verificar si es console backend
if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    print("\n⚠️  ADVERTENCIA:")
    print("   EMAIL_BACKEND está configurado como 'console'")
    print("   Los emails NO se enviarán, solo se imprimirán en consola")
    print("\n   Para enviar emails reales, configura en Railway:")
    print("   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")

# 3. Verificar plantillas de email
print("\n📧 2. PLANTILLAS DE EMAIL:")
plantillas_email = PlantillaNotificacion.objects.filter(
    canal=CanalNotificacion.EMAIL,
    activa=True
)
if plantillas_email.exists():
    print(f"   ✅ {plantillas_email.count()} plantillas activas encontradas:")
    for plantilla in plantillas_email:
        print(f"      - {plantilla.get_tipo_display()}")
else:
    print("   ❌ No hay plantillas de email activas")

# 4. Verificar si se puede enviar email de prueba
print("\n🧪 3. PRUEBA DE ENVÍO:")
if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    print("   ⏭️  Saltando prueba (backend es console)")
elif not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
    print("   ❌ No se puede probar: faltan credenciales")
    print("   Configura EMAIL_HOST_USER y EMAIL_HOST_PASSWORD en Railway")
else:
    email_prueba = input("\n   Ingresa un email para prueba (o Enter para saltar): ").strip()
    if email_prueba:
        try:
            print(f"   📤 Enviando email de prueba a {email_prueba}...")
            send_mail(
                subject='🌸 Prueba de Email - Florería Cristina',
                message='Este es un email de prueba del sistema de notificaciones.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_prueba],
                fail_silently=False
            )
            print("   ✅ Email enviado exitosamente!")
            print("   Verifica tu bandeja de entrada (y SPAM)")
        except Exception as e:
            print(f"   ❌ Error enviando email: {str(e)}")
            print("\n   Posibles causas:")
            print("   - App Password incorrecta")
            print("   - Cuenta sin autenticación de 2 factores")
            print("   - Credenciales incorrectas")
    else:
        print("   ⏭️  Prueba saltada")

# 5. Resumen
print("\n" + "="*60)
print("📊 RESUMEN:")
print("="*60)

issues = []
if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    issues.append("EMAIL_BACKEND es 'console' (no envía emails reales)")
if not settings.EMAIL_HOST_USER:
    issues.append("EMAIL_HOST_USER no configurado")
if not settings.EMAIL_HOST_PASSWORD:
    issues.append("EMAIL_HOST_PASSWORD no configurado")
if not plantillas_email.exists():
    issues.append("No hay plantillas de email activas")

if issues:
    print("\n⚠️  PROBLEMAS ENCONTRADOS:")
    for i, issue in enumerate(issues, 1):
        print(f"   {i}. {issue}")
    print("\n📖 Consulta CONFIGURACION_EMAIL_RAILWAY.md para solucionar")
else:
    print("\n✅ Configuración correcta!")
    print("   El sistema debería enviar emails sin problemas")

print("\n" + "="*60)
