#!/usr/bin/env python
"""
Script para verificar la configuración de email en Railway
Ejecutar: python manage.py shell < verificar_email_config.py
"""

import os
from django.conf import settings

print("\n" + "="*80)
print("🔍 VERIFICACIÓN DE CONFIGURACIÓN DE EMAIL")
print("="*80)

print("\n📋 VARIABLES DE ENTORNO:")
print(f"   EMAIL_BACKEND (env): {os.environ.get('EMAIL_BACKEND', 'NO CONFIGURADO')}")
print(f"   EMAIL_HOST (env): {os.environ.get('EMAIL_HOST', 'NO CONFIGURADO')}")
print(f"   EMAIL_PORT (env): {os.environ.get('EMAIL_PORT', 'NO CONFIGURADO')}")
print(f"   EMAIL_USE_TLS (env): {os.environ.get('EMAIL_USE_TLS', 'NO CONFIGURADO')}")
print(f"   EMAIL_HOST_USER (env): {os.environ.get('EMAIL_HOST_USER', 'NO CONFIGURADO')}")
print(f"   EMAIL_HOST_PASSWORD (env): {'✅ Configurado' if os.environ.get('EMAIL_HOST_PASSWORD') else '❌ NO CONFIGURADO'}")
print(f"   DEFAULT_FROM_EMAIL (env): {os.environ.get('DEFAULT_FROM_EMAIL', 'NO CONFIGURADO')}")

print("\n📋 CONFIGURACIÓN DE DJANGO (settings):")
print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"   EMAIL_HOST_PASSWORD: {'✅ Configurado' if settings.EMAIL_HOST_PASSWORD else '❌ NO CONFIGURADO'}")
print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

print("\n🧪 PRUEBA DE ENVÍO:")
try:
    from django.core.mail import send_mail
    
    print("   📤 Intentando enviar email de prueba...")
    
    resultado = send_mail(
        subject='🧪 Prueba desde Railway - Verificación',
        message='Este es un email de prueba para verificar la configuración SMTP.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['mazzucoda@gmail.com'],
        fail_silently=False
    )
    
    print(f"   ✅ Resultado: {resultado}")
    print("   📬 Verifica tu bandeja de entrada en mazzucoda@gmail.com")
    
except Exception as e:
    print(f"   ❌ ERROR: {str(e)}")
    print(f"   📝 Tipo de error: {type(e).__name__}")
    
    import traceback
    print("\n   Stack trace completo:")
    traceback.print_exc()

print("\n" + "="*80)
print("✅ Verificación completada")
print("="*80 + "\n")
