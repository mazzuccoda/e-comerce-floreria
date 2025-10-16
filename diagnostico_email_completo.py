#!/usr/bin/env python
"""
Diagnóstico Completo de Email con Gmail SMTP
Este script prueba TODAS las posibles causas de fallo
"""
import os
import sys
import django
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

print("=" * 100)
print("🔍 DIAGNÓSTICO COMPLETO DE EMAIL - GMAIL SMTP")
print("=" * 100)

# ============================================================================
# PASO 1: VERIFICAR CONFIGURACIÓN
# ============================================================================
print("\n" + "=" * 100)
print("📋 PASO 1: VERIFICACIÓN DE CONFIGURACIÓN")
print("=" * 100)

config_ok = True

print(f"\n1. EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
if settings.EMAIL_BACKEND != 'django.core.mail.backends.smtp.EmailBackend':
    print("   ❌ ERROR: Debe ser 'django.core.mail.backends.smtp.EmailBackend'")
    config_ok = False
else:
    print("   ✅ Correcto")

print(f"\n2. EMAIL_HOST: {settings.EMAIL_HOST}")
if settings.EMAIL_HOST != 'smtp.gmail.com':
    print("   ❌ ERROR: Debe ser 'smtp.gmail.com'")
    config_ok = False
else:
    print("   ✅ Correcto")

print(f"\n3. EMAIL_PORT: {settings.EMAIL_PORT}")
if settings.EMAIL_PORT not in [587, 465]:
    print("   ❌ ERROR: Debe ser 587 (TLS) o 465 (SSL)")
    config_ok = False
else:
    print(f"   ✅ Correcto (Puerto {settings.EMAIL_PORT})")

print(f"\n4. EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
if settings.EMAIL_PORT == 587 and not settings.EMAIL_USE_TLS:
    print("   ❌ ERROR: TLS debe estar activado para puerto 587")
    config_ok = False
else:
    print("   ✅ Correcto")

print(f"\n5. EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
if not settings.EMAIL_HOST_USER:
    print("   ❌ ERROR: Email de usuario no configurado")
    config_ok = False
elif not settings.EMAIL_HOST_USER.endswith('@gmail.com'):
    print("   ⚠️  ADVERTENCIA: No es una cuenta @gmail.com")
else:
    print("   ✅ Correcto")

print(f"\n6. EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NO CONFIGURADO'}")
if not settings.EMAIL_HOST_PASSWORD:
    print("   ❌ ERROR: Contraseña no configurada")
    config_ok = False
else:
    password_len = len(settings.EMAIL_HOST_PASSWORD)
    print(f"   📏 Longitud: {password_len} caracteres")
    
    # Verificar formato de contraseña de aplicación
    password_clean = settings.EMAIL_HOST_PASSWORD.replace(' ', '')
    if password_len == 16 or len(password_clean) == 16:
        print("   ✅ Longitud correcta para contraseña de aplicación (16 caracteres)")
    else:
        print(f"   ⚠️  ADVERTENCIA: Longitud inusual ({password_len} caracteres)")
        print("      Las contraseñas de aplicación de Gmail tienen 16 caracteres")

print(f"\n7. DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print("   ℹ️  Este es el remitente que aparecerá en los emails")

if not config_ok:
    print("\n" + "=" * 100)
    print("❌ CONFIGURACIÓN INCORRECTA - Corrige los errores antes de continuar")
    print("=" * 100)
    sys.exit(1)

print("\n✅ CONFIGURACIÓN BÁSICA CORRECTA")

# ============================================================================
# PASO 2: PRUEBA DE CONEXIÓN SMTP
# ============================================================================
print("\n" + "=" * 100)
print("🔌 PASO 2: PRUEBA DE CONEXIÓN SMTP")
print("=" * 100)

try:
    print(f"\n1. Conectando a {settings.EMAIL_HOST}:{settings.EMAIL_PORT}...")
    server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
    print("   ✅ Conexión establecida")
    
    print("\n2. Iniciando modo debug...")
    server.set_debuglevel(2)  # Mostrar toda la comunicación SMTP
    
    print("\n3. Enviando EHLO...")
    server.ehlo()
    print("   ✅ EHLO exitoso")
    
    print("\n4. Iniciando TLS...")
    server.starttls()
    print("   ✅ TLS iniciado")
    
    print("\n5. Enviando EHLO nuevamente después de TLS...")
    server.ehlo()
    print("   ✅ EHLO post-TLS exitoso")
    
    print("\n6. Autenticando...")
    print(f"   Usuario: {settings.EMAIL_HOST_USER}")
    print(f"   Password: {'*' * 16}")
    
    try:
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        print("   ✅ AUTENTICACIÓN EXITOSA")
        auth_ok = True
    except smtplib.SMTPAuthenticationError as e:
        print(f"   ❌ ERROR DE AUTENTICACIÓN: {e}")
        print("\n   💡 POSIBLES CAUSAS:")
        print("      1. Contraseña de aplicación incorrecta")
        print("      2. Verificación en 2 pasos no activada")
        print("      3. Contraseña de aplicación revocada")
        print("\n   🔧 SOLUCIÓN:")
        print("      1. Ve a: https://myaccount.google.com/apppasswords")
        print("      2. Genera una NUEVA contraseña de aplicación")
        print("      3. Actualiza EMAIL_HOST_PASSWORD en Railway")
        auth_ok = False
    
    if auth_ok:
        print("\n7. Cerrando conexión...")
        server.quit()
        print("   ✅ Conexión cerrada correctamente")
    
except smtplib.SMTPConnectError as e:
    print(f"   ❌ ERROR DE CONEXIÓN: {e}")
    print("\n   💡 POSIBLES CAUSAS:")
    print("      1. Firewall bloqueando puerto 587")
    print("      2. Gmail SMTP no disponible")
    print("      3. Problema de red")
    
except smtplib.SMTPServerDisconnected as e:
    print(f"   ❌ SERVIDOR DESCONECTADO: {e}")
    
except Exception as e:
    print(f"   ❌ ERROR INESPERADO: {e}")
    import traceback
    traceback.print_exc()
    auth_ok = False

if not auth_ok:
    print("\n" + "=" * 100)
    print("❌ AUTENTICACIÓN FALLIDA - No se pueden enviar emails")
    print("=" * 100)
    sys.exit(1)

# ============================================================================
# PASO 3: ENVÍO DE EMAIL DE PRUEBA CON SMTPLIB PURO
# ============================================================================
print("\n" + "=" * 100)
print("📧 PASO 3: ENVÍO DE EMAIL DE PRUEBA (SMTPLIB PURO)")
print("=" * 100)

try:
    print("\n1. Creando mensaje...")
    msg = MIMEMultipart()
    msg['From'] = settings.DEFAULT_FROM_EMAIL
    msg['To'] = 'mazzucoda@gmail.com'
    msg['Subject'] = '🧪 Prueba SMTP Directa - Diagnóstico Completo'
    
    body = """Este es un email de prueba usando smtplib directamente.

Si recibes este mensaje, significa que:
✅ La conexión SMTP funciona
✅ La autenticación es correcta
✅ Gmail acepta y ENVÍA el email

Timestamp: """ + str(os.popen('date').read())
    
    msg.attach(MIMEText(body, 'plain'))
    print("   ✅ Mensaje creado")
    
    print("\n2. Conectando a Gmail SMTP...")
    server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
    server.set_debuglevel(1)
    server.starttls()
    server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
    print("   ✅ Conectado y autenticado")
    
    print("\n3. Enviando email...")
    print(f"   De: {msg['From']}")
    print(f"   Para: {msg['To']}")
    print(f"   Asunto: {msg['Subject']}")
    
    result = server.send_message(msg)
    
    print("\n   📊 RESULTADO DEL ENVÍO:")
    if result:
        print(f"   ⚠️  Algunos destinatarios rechazados: {result}")
    else:
        print("   ✅ EMAIL ENVIADO EXITOSAMENTE")
        print("\n   🎯 ACCIÓN REQUERIDA:")
        print("      1. Revisa la bandeja de entrada de mazzucoda@gmail.com")
        print("      2. Revisa también la carpeta de SPAM")
        print("      3. Si NO llega en 2 minutos, el problema es de Gmail")
    
    server.quit()
    
except Exception as e:
    print(f"\n   ❌ ERROR ENVIANDO EMAIL: {e}")
    import traceback
    traceback.print_exc()

# ============================================================================
# PASO 4: ENVÍO CON DJANGO send_mail()
# ============================================================================
print("\n" + "=" * 100)
print("📧 PASO 4: ENVÍO DE EMAIL DE PRUEBA (DJANGO send_mail)")
print("=" * 100)

try:
    print("\n1. Enviando con Django send_mail()...")
    
    result = send_mail(
        subject='🧪 Prueba Django - Diagnóstico Completo',
        message='''Este es un email de prueba usando Django send_mail().

Si recibes este mensaje, significa que Django está configurado correctamente.

Timestamp: ''' + str(os.popen('date').read()),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['mazzucoda@gmail.com'],
        fail_silently=False
    )
    
    print(f"\n   📊 RESULTADO: {result}")
    if result == 1:
        print("   ✅ Django reporta envío exitoso")
        print("\n   🎯 ACCIÓN REQUERIDA:")
        print("      1. Revisa mazzucoda@gmail.com en 1-2 minutos")
        print("      2. Si NO llega, el problema NO es de código")
        print("      3. El problema sería de Gmail bloqueando el envío")
    else:
        print("   ❌ Django reporta fallo en el envío")
    
except Exception as e:
    print(f"\n   ❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# ============================================================================
# PASO 5: VERIFICACIONES ADICIONALES
# ============================================================================
print("\n" + "=" * 100)
print("🔍 PASO 5: VERIFICACIONES ADICIONALES")
print("=" * 100)

print("\n1. Verificar límites de Gmail:")
print("   ℹ️  Gmail tiene límites de envío:")
print("      - Cuentas gratuitas: 500 emails/día")
print("      - Con SMTP: 100-500 emails/día")
print("      - Por hora: ~100 emails")
print("\n   🎯 ACCIÓN: Verifica en Gmail si has excedido límites")

print("\n2. Verificar reputación del remitente:")
print(f"   📧 Remitente: {settings.EMAIL_HOST_USER}")
print("   ℹ️  Si Gmail detecta spam, puede bloquear silenciosamente")
print("\n   🎯 ACCIÓN: Revisa https://postmaster.google.com/")

print("\n3. Verificar configuración de seguridad:")
print("   🔐 Verificación en 2 pasos: DEBE estar activada")
print("   🔑 Contraseña de aplicación: DEBE ser válida")
print("\n   🎯 ACCIÓN: Ve a https://myaccount.google.com/security")

print("\n4. Verificar actividad reciente:")
print("   📊 Gmail puede bloquear si detecta actividad sospechosa")
print("\n   🎯 ACCIÓN: Ve a https://myaccount.google.com/notifications")

# ============================================================================
# RESUMEN FINAL
# ============================================================================
print("\n" + "=" * 100)
print("📊 RESUMEN Y PRÓXIMOS PASOS")
print("=" * 100)

print("\n✅ VERIFICACIONES COMPLETADAS:")
print("   1. Configuración de Django")
print("   2. Conexión SMTP")
print("   3. Autenticación")
print("   4. Envío de emails de prueba")

print("\n🎯 PRÓXIMOS PASOS:")
print("\n   A. SI LOS EMAILS DE PRUEBA LLEGARON:")
print("      → El sistema funciona correctamente")
print("      → El problema era temporal o de caché")
print("      → Puedes seguir usando Gmail SMTP")

print("\n   B. SI LOS EMAILS NO LLEGARON:")
print("      → La autenticación funciona PERO Gmail bloquea el envío")
print("      → Posibles causas:")
print("         1. Gmail detecta la app como spam")
print("         2. Falta configuración SPF/DKIM")
print("         3. Límites de envío excedidos")
print("         4. Cuenta marcada como sospechosa")
print("      → Soluciones:")
print("         1. Usar SendGrid (100 emails/día gratis)")
print("         2. Usar Mailgun (5000 emails/mes gratis)")
print("         3. Configurar dominio propio con SPF/DKIM")

print("\n   C. VERIFICACIONES MANUALES:")
print("      1. Revisa mazzucoda@gmail.com (inbox y spam)")
print("      2. Espera 2-3 minutos para que lleguen")
print("      3. Si no llegan, el problema es de Gmail")

print("\n" + "=" * 100)
print("✅ DIAGNÓSTICO COMPLETADO")
print("=" * 100)
