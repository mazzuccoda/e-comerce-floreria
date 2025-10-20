#!/usr/bin/env python
"""
Script para probar el envío de emails
Ejecutar: python test_envio_email.py
"""

import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from notificaciones.models import PlantillaNotificacion, CanalNotificacion, TipoNotificacion
from notificaciones.services import NotificacionService

print("\n" + "="*70)
print("🧪 PRUEBA DE ENVÍO DE EMAILS - FLORERÍA CRISTINA")
print("="*70)

# 1. Verificar configuración
print("\n📋 1. VERIFICANDO CONFIGURACIÓN:")
print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"   EMAIL_HOST_PASSWORD: {'✅ Configurado' if settings.EMAIL_HOST_PASSWORD else '❌ NO CONFIGURADO'}")
print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    print("\n⚠️  ADVERTENCIA: EMAIL_BACKEND es 'console'")
    print("   Los emails se imprimirán en consola, no se enviarán realmente")
    print("\n   ¿Continuar de todas formas? (s/n): ", end='')
    if input().lower() != 's':
        print("   Prueba cancelada")
        exit(0)

# 2. Verificar plantillas
print("\n📧 2. VERIFICANDO PLANTILLAS DE EMAIL:")
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
    print("   Creando plantilla de prueba...")
    
    # Crear plantilla de prueba si no existe
    PlantillaNotificacion.objects.get_or_create(
        tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
        canal=CanalNotificacion.EMAIL,
        defaults={
            'nombre': 'Confirmación de Pedido (Email)',
            'asunto': '🌸 Confirmación de Pedido #{numero_pedido}',
            'mensaje': '''
¡Hola {nombre_cliente}!

Tu pedido ha sido confirmado exitosamente.

Detalles del pedido:
- Número: #{numero_pedido}
- Total: ${total}
- Fecha de entrega: {fecha_entrega}

¡Gracias por tu compra!

Florería Cristina
            ''',
            'activa': True
        }
    )
    print("   ✅ Plantilla de prueba creada")

# 3. Prueba 1: Email simple con Django
print("\n🧪 3. PRUEBA 1: EMAIL SIMPLE (Django send_mail)")
email_destino = input("   Ingresa tu email para la prueba: ").strip()

if not email_destino:
    print("   ❌ Email no proporcionado. Saltando prueba.")
else:
    try:
        print(f"   📤 Enviando email de prueba a {email_destino}...")
        
        resultado = send_mail(
            subject='🌸 Prueba de Email - Florería Cristina',
            message=f'''
¡Hola!

Este es un email de prueba del sistema de notificaciones.

Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

Si recibes este email, significa que la configuración SMTP está funcionando correctamente.

Saludos,
Florería Cristina
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_destino],
            fail_silently=False
        )
        
        if resultado == 1:
            print("   ✅ Email enviado exitosamente!")
            print(f"   📬 Verifica tu bandeja de entrada: {email_destino}")
            print("   💡 Si no lo ves, revisa la carpeta de SPAM")
        else:
            print("   ⚠️  Email enviado pero sin confirmación")
            
    except Exception as e:
        print(f"   ❌ Error enviando email: {str(e)}")
        print("\n   Posibles causas:")
        print("   - App Password incorrecta")
        print("   - Credenciales incorrectas")
        print("   - Firewall bloqueando puerto 587")
        print("   - Gmail bloqueó el acceso (revisa tu email)")

# 4. Prueba 2: Email con HTML
print("\n🧪 4. PRUEBA 2: EMAIL CON HTML")
if email_destino:
    try:
        print(f"   📤 Enviando email HTML a {email_destino}...")
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .footer {{ text-align: center; padding: 10px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌸 Florería Cristina</h1>
                </div>
                <div class="content">
                    <h2>Prueba de Email HTML</h2>
                    <p>Este es un email de prueba con formato HTML.</p>
                    <p><strong>Fecha:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                    <p>Si recibes este email con formato, significa que:</p>
                    <ul>
                        <li>✅ La configuración SMTP funciona</li>
                        <li>✅ Los emails HTML se envían correctamente</li>
                        <li>✅ El sistema está listo para producción</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>Florería Cristina - Sistema de Notificaciones</p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        email = EmailMessage(
            subject='🌸 Prueba de Email HTML - Florería Cristina',
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_destino]
        )
        email.content_subtype = 'html'
        email.send()
        
        print("   ✅ Email HTML enviado exitosamente!")
        print(f"   📬 Verifica tu bandeja de entrada: {email_destino}")
        
    except Exception as e:
        print(f"   ❌ Error enviando email HTML: {str(e)}")

# 5. Prueba 3: Sistema de notificaciones
print("\n🧪 5. PRUEBA 3: SISTEMA DE NOTIFICACIONES")
if email_destino:
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Buscar o crear usuario de prueba
        usuario, created = User.objects.get_or_create(
            email=email_destino,
            defaults={
                'username': email_destino.split('@')[0],
                'first_name': 'Usuario',
                'last_name': 'Prueba'
            }
        )
        
        print(f"   👤 Usuario: {usuario.email}")
        
        # Crear notificación usando el servicio
        servicio = NotificacionService()
        
        contexto = {
            'nombre_cliente': f"{usuario.first_name} {usuario.last_name}",
            'numero_pedido': 'TEST-001',
            'total': '25,000',
            'fecha_entrega': datetime.now().strftime('%d/%m/%Y')
        }
        
        print("   📤 Creando notificación de prueba...")
        notificacion = servicio.crear_notificacion(
            usuario=usuario,
            tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
            canal=CanalNotificacion.EMAIL,
            destinatario=email_destino,
            contexto=contexto
        )
        
        print(f"   ✅ Notificación creada: ID {notificacion.id}")
        print("   📤 Enviando notificación...")
        
        resultado = servicio.enviar_notificacion(notificacion)
        
        if resultado:
            print("   ✅ Notificación enviada exitosamente!")
            print(f"   📊 Estado: {notificacion.get_estado_display()}")
            print(f"   📬 Verifica tu bandeja de entrada: {email_destino}")
        else:
            print("   ❌ Error enviando notificación")
            print(f"   📊 Estado: {notificacion.get_estado_display()}")
            if notificacion.error:
                print(f"   ⚠️  Error: {notificacion.error}")
                
    except Exception as e:
        print(f"   ❌ Error en sistema de notificaciones: {str(e)}")
        import traceback
        print(f"\n   Stack trace:")
        traceback.print_exc()

# 6. Resumen
print("\n" + "="*70)
print("📊 RESUMEN DE PRUEBAS:")
print("="*70)

if settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    print("\n✅ Configuración SMTP activa")
    print(f"📧 Emails enviados a: {email_destino if email_destino else 'N/A'}")
    print("\n💡 PRÓXIMOS PASOS:")
    print("   1. Verifica tu bandeja de entrada")
    print("   2. Revisa la carpeta de SPAM")
    print("   3. Si no llegan, revisa los logs de Railway")
    print("   4. Prueba creando un pedido real en la tienda")
else:
    print("\n⚠️  Configuración en modo CONSOLE")
    print("   Los emails se imprimieron en consola, no se enviaron realmente")

print("\n" + "="*70)
print("✅ Prueba completada")
print("="*70 + "\n")
