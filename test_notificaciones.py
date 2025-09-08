#!/usr/bin/env python
"""
Script de prueba para el sistema de notificaciones
Valida email, WhatsApp y integración con pedidos
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User
from notificaciones.models import (
    PlantillaNotificacion, Notificacion, ConfiguracionNotificacion,
    TipoNotificacion, CanalNotificacion, EstadoNotificacion
)
from notificaciones.services import notificacion_service
from usuarios.models import PerfilUsuario


def print_header(title):
    """Imprime un encabezado formateado"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


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


def test_plantillas_notificaciones():
    """Prueba 1: Verificar plantillas de notificaciones"""
    print_header("PRUEBA 1: PLANTILLAS DE NOTIFICACIONES")
    
    plantillas = PlantillaNotificacion.objects.all()
    print_info(f"Total de plantillas: {plantillas.count()}")
    
    tipos_esperados = [
        TipoNotificacion.PEDIDO_CONFIRMADO,
        TipoNotificacion.PEDIDO_ENVIADO,
        TipoNotificacion.PEDIDO_ENTREGADO,
        TipoNotificacion.REGISTRO_USUARIO,
        TipoNotificacion.STOCK_BAJO,
    ]
    
    canales_esperados = [CanalNotificacion.EMAIL, CanalNotificacion.WHATSAPP]
    
    for tipo in tipos_esperados:
        for canal in canales_esperados:
            try:
                plantilla = PlantillaNotificacion.objects.get(tipo=tipo, canal=canal)
                print_success(f"Plantilla encontrada: {plantilla.get_tipo_display()} - {plantilla.get_canal_display()}")
            except PlantillaNotificacion.DoesNotExist:
                print_error(f"Plantilla faltante: {tipo} - {canal}")
    
    return True


def test_crear_usuario_prueba():
    """Prueba 2: Crear usuario de prueba"""
    print_header("PRUEBA 2: CREAR USUARIO DE PRUEBA")
    
    # Eliminar usuario existente si existe
    User.objects.filter(username='test_notificaciones').delete()
    
    # Crear usuario
    usuario = User.objects.create_user(
        username='test_notificaciones',
        email='test@floreriacristina.com',
        password='testpass123',
        first_name='Usuario',
        last_name='Prueba'
    )
    
    # Crear perfil
    perfil, created = PerfilUsuario.objects.get_or_create(
        user=usuario,
        defaults={
            'telefono': '+5491123456789',
            'direccion': 'Calle Falsa 123',
            'ciudad': 'Buenos Aires',
            'codigo_postal': '1000'
        }
    )
    
    print_success(f"Usuario creado: {usuario.username} ({usuario.email})")
    print_success(f"Perfil creado: {perfil.telefono}")
    
    # Verificar configuración de notificaciones
    config = ConfiguracionNotificacion.objects.get(usuario=usuario)
    print_success(f"Configuración de notificaciones creada automáticamente")
    print_info(f"Email habilitado: {config.email_habilitado}")
    print_info(f"WhatsApp habilitado: {config.whatsapp_habilitado}")
    
    return usuario


def test_notificacion_registro(usuario):
    """Prueba 3: Notificación de registro"""
    print_header("PRUEBA 3: NOTIFICACIÓN DE REGISTRO")
    
    try:
        # Crear notificaciones de registro
        notificaciones = notificacion_service.enviar_notificacion_registro(usuario)
        
        print_success(f"Notificaciones de registro creadas: {len(notificaciones)}")
        
        for notif in notificaciones:
            print_info(f"Notificación {notif.id}: {notif.get_tipo_display()} - {notif.get_canal_display()}")
            print_info(f"Destinatario: {notif.destinatario}")
            print_info(f"Estado: {notif.get_estado_display()}")
            
            if notif.canal == CanalNotificacion.EMAIL:
                print_info(f"Asunto: {notif.asunto}")
                print_info(f"Mensaje (primeros 100 chars): {notif.mensaje[:100]}...")
        
        return True
        
    except Exception as e:
        print_error(f"Error en notificación de registro: {str(e)}")
        return False


def test_notificacion_pedido():
    """Prueba 4: Notificación de pedido"""
    print_header("PRUEBA 4: NOTIFICACIÓN DE PEDIDO")
    
    try:
        # Obtener usuario de prueba
        usuario = User.objects.get(username='test_notificaciones')
        
        # Simular datos de pedido
        pedido_id = 12345
        contexto = {
            'pedido_id': pedido_id,
            'total': 15000,
            'fecha': datetime.now().strftime('%d/%m/%Y'),
            'items_count': 3
        }
        
        # Crear notificaciones de pedido confirmado
        notificaciones = notificacion_service.enviar_notificacion_pedido(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.PEDIDO_CONFIRMADO,
            pedido_id=pedido_id,
            contexto_adicional=contexto
        )
        
        print_success(f"Notificaciones de pedido creadas: {len(notificaciones)}")
        
        for notif in notificaciones:
            print_info(f"Notificación {notif.id}: {notif.get_tipo_display()} - {notif.get_canal_display()}")
            print_info(f"Destinatario: {notif.destinatario}")
            print_info(f"Estado: {notif.get_estado_display()}")
            
            if notif.canal == CanalNotificacion.EMAIL:
                print_info(f"Asunto: {notif.asunto}")
            
            # Mostrar mensaje renderizado
            print_info(f"Mensaje renderizado:")
            print(f"   {notif.mensaje[:200]}...")
        
        return True
        
    except Exception as e:
        print_error(f"Error en notificación de pedido: {str(e)}")
        return False


def test_envio_email():
    """Prueba 5: Envío de email"""
    print_header("PRUEBA 5: ENVÍO DE EMAIL")
    
    try:
        # Obtener notificación de email pendiente
        notificacion = Notificacion.objects.filter(
            canal=CanalNotificacion.EMAIL,
            estado=EstadoNotificacion.PENDIENTE
        ).first()
        
        if not notificacion:
            print_error("No hay notificaciones de email pendientes")
            return False
        
        print_info(f"Enviando notificación {notificacion.id}")
        
        # Intentar enviar
        success = notificacion_service.enviar_notificacion(notificacion)
        
        if success:
            print_success("Email enviado correctamente")
            print_info(f"Estado actualizado: {notificacion.get_estado_display()}")
            print_info(f"Fecha de envío: {notificacion.fecha_envio}")
        else:
            print_error("Error enviando email")
            print_info(f"Error: {notificacion.error_mensaje}")
        
        return success
        
    except Exception as e:
        print_error(f"Error en envío de email: {str(e)}")
        return False


def test_configuracion_twilio():
    """Prueba 6: Configuración de Twilio"""
    print_header("PRUEBA 6: CONFIGURACIÓN DE TWILIO")
    
    from django.conf import settings
    
    # Verificar configuración
    twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    twilio_whatsapp = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
    
    print_info(f"TWILIO_ACCOUNT_SID: {'✅ Configurado' if twilio_sid and twilio_sid != 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' else '❌ No configurado'}")
    print_info(f"TWILIO_AUTH_TOKEN: {'✅ Configurado' if twilio_token and twilio_token != 'your_auth_token' else '❌ No configurado'}")
    print_info(f"TWILIO_WHATSAPP_NUMBER: {twilio_whatsapp}")
    
    # Verificar cliente Twilio
    try:
        from twilio.rest import Client
        if twilio_sid and twilio_token and twilio_sid != 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx':
            client = Client(twilio_sid, twilio_token)
            print_success("Cliente Twilio inicializado correctamente")
            return True
        else:
            print_error("Credenciales de Twilio no configuradas para producción")
            print_info("Para probar WhatsApp, configura las variables de entorno:")
            print_info("- TWILIO_ACCOUNT_SID")
            print_info("- TWILIO_AUTH_TOKEN") 
            print_info("- TWILIO_WHATSAPP_NUMBER")
            return False
    except ImportError:
        print_error("Twilio no está instalado")
        return False
    except Exception as e:
        print_error(f"Error inicializando Twilio: {str(e)}")
        return False


def test_estadisticas():
    """Prueba 7: Estadísticas del sistema"""
    print_header("PRUEBA 7: ESTADÍSTICAS DEL SISTEMA")
    
    # Contar notificaciones por estado
    total_notificaciones = Notificacion.objects.count()
    pendientes = Notificacion.objects.filter(estado=EstadoNotificacion.PENDIENTE).count()
    enviadas = Notificacion.objects.filter(estado=EstadoNotificacion.ENVIADA).count()
    fallidas = Notificacion.objects.filter(estado=EstadoNotificacion.FALLIDA).count()
    
    print_info(f"Total de notificaciones: {total_notificaciones}")
    print_info(f"Pendientes: {pendientes}")
    print_info(f"Enviadas: {enviadas}")
    print_info(f"Fallidas: {fallidas}")
    
    # Contar por canal
    emails = Notificacion.objects.filter(canal=CanalNotificacion.EMAIL).count()
    whatsapps = Notificacion.objects.filter(canal=CanalNotificacion.WHATSAPP).count()
    
    print_info(f"Notificaciones por Email: {emails}")
    print_info(f"Notificaciones por WhatsApp: {whatsapps}")
    
    # Contar por tipo
    registros = Notificacion.objects.filter(tipo=TipoNotificacion.REGISTRO_USUARIO).count()
    pedidos = Notificacion.objects.filter(tipo=TipoNotificacion.PEDIDO_CONFIRMADO).count()
    
    print_info(f"Notificaciones de registro: {registros}")
    print_info(f"Notificaciones de pedidos: {pedidos}")
    
    return True


def main():
    """Función principal de pruebas"""
    print_header("🌸 SISTEMA DE NOTIFICACIONES - FLORERÍA CRISTINA 🌸")
    print_info("Iniciando pruebas del sistema de notificaciones...")
    
    resultados = []
    
    # Ejecutar pruebas
    resultados.append(("Plantillas", test_plantillas_notificaciones()))
    
    usuario = test_crear_usuario_prueba()
    resultados.append(("Usuario de prueba", usuario is not None))
    
    if usuario:
        resultados.append(("Notificación registro", test_notificacion_registro(usuario)))
        resultados.append(("Notificación pedido", test_notificacion_pedido()))
        resultados.append(("Envío email", test_envio_email()))
    
    resultados.append(("Configuración Twilio", test_configuracion_twilio()))
    resultados.append(("Estadísticas", test_estadisticas()))
    
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
        print_success("🎉 ¡Todas las pruebas pasaron! El sistema de notificaciones está funcionando correctamente.")
    else:
        print_error("⚠️  Algunas pruebas fallaron. Revisa la configuración.")
    
    print_info("\n📝 Próximos pasos:")
    print_info("1. Configurar credenciales reales de Twilio para WhatsApp")
    print_info("2. Configurar SMTP real para emails en producción")
    print_info("3. Integrar notificaciones en el flujo de pedidos")
    print_info("4. Configurar Celery Beat para tareas periódicas")


if __name__ == '__main__':
    main()
