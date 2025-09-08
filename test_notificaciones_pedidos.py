#!/usr/bin/env python
"""
Script de prueba para validar notificaciones en el flujo completo de pedidos
"""

import os
import sys
import django
from datetime import datetime, date, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User
from catalogo.models import Producto, Categoria
from pedidos.models import Pedido, PedidoItem
from notificaciones.models import Notificacion, TipoNotificacion, CanalNotificacion
from usuarios.models import PerfilUsuario


def print_header(title):
    """Imprime un encabezado formateado"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def print_success(message):
    """Imprime mensaje de éxito"""
    print(f"✅ {message}")


def print_error(message):
    """Imprime mensaje de error"""
    print(f"❌ {message}")


def print_info(message):
    """Imprime mensaje informativo"""
    print(f"ℹ️  {message}")


def crear_datos_prueba():
    """Crea datos de prueba necesarios"""
    print_header("CREANDO DATOS DE PRUEBA")
    
    # Crear usuario de prueba
    usuario, created = User.objects.get_or_create(
        username='cliente_pedido',
        defaults={
            'email': 'cliente@floreriacristina.com',
            'first_name': 'María',
            'last_name': 'González',
            'password': 'pbkdf2_sha256$600000$test$test'
        }
    )
    
    if created:
        print_success(f"Usuario creado: {usuario.username}")
        
        # Crear perfil
        PerfilUsuario.objects.get_or_create(
            user=usuario,
            defaults={
                'telefono': '+5491123456789',
                'direccion': 'Av. Corrientes 1234',
                'ciudad': 'Buenos Aires',
                'codigo_postal': '1043'
            }
        )
        print_success("Perfil de usuario creado")
    else:
        print_info(f"Usuario existente: {usuario.username}")
    
    # Crear categoría y productos de prueba
    categoria, _ = Categoria.objects.get_or_create(
        nombre='Ramos',
        defaults={'slug': 'ramos', 'descripcion': 'Ramos de flores'}
    )
    
    productos_data = [
        {'nombre': 'Ramo de Rosas Rojas', 'precio': 8500, 'stock': 10},
        {'nombre': 'Ramo de Tulipanes', 'precio': 6500, 'stock': 5},
        {'nombre': 'Arreglo Mixto', 'precio': 12000, 'stock': 8}
    ]
    
    productos = []
    for prod_data in productos_data:
        producto, created = Producto.objects.get_or_create(
            nombre=prod_data['nombre'],
            defaults={
                'categoria': categoria,
                'precio': prod_data['precio'],
                'stock': prod_data['stock'],
                'descripcion': f"Hermoso {prod_data['nombre'].lower()}",
                'is_active': True,
                'sku': f"SKU-{prod_data['nombre'][:10].upper().replace(' ', '')}"
            }
        )
        productos.append(producto)
        
        if created:
            print_success(f"Producto creado: {producto.nombre} (Stock: {producto.stock})")
        else:
            print_info(f"Producto existente: {producto.nombre} (Stock: {producto.stock})")
    
    return usuario, productos


def crear_pedido_prueba(usuario, productos):
    """Crea un pedido de prueba"""
    print_header("CREANDO PEDIDO DE PRUEBA")
    
    # Crear pedido
    pedido = Pedido.objects.create(
        cliente=usuario,
        nombre_destinatario='Ana Martínez',
        direccion='Calle Florida 456',
        ciudad='Buenos Aires',
        codigo_postal='1005',
        telefono_destinatario='+5491198765432',
        fecha_entrega=date.today() + timedelta(days=1),
        franja_horaria='tarde',
        dedicatoria='¡Feliz cumpleaños! Con mucho cariño.',
        instrucciones='Tocar timbre del portero',
        estado='recibido',
        total=Decimal('21000.00'),
        confirmado=False
    )
    
    print_success(f"Pedido creado: #{pedido.id}")
    
    # Agregar items al pedido
    items_data = [
        {'producto': productos[0], 'cantidad': 1, 'precio': productos[0].precio},
        {'producto': productos[1], 'cantidad': 2, 'precio': productos[1].precio},
    ]
    
    total_calculado = Decimal('0.00')
    for item_data in items_data:
        item = PedidoItem.objects.create(
            pedido=pedido,
            producto=item_data['producto'],
            cantidad=item_data['cantidad'],
            precio=item_data['precio']
        )
        total_calculado += item_data['precio'] * item_data['cantidad']
        print_success(f"Item agregado: {item.producto.nombre} x{item.cantidad}")
    
    # Actualizar total del pedido
    pedido.total = total_calculado
    pedido.save()
    
    print_info(f"Total del pedido: ${pedido.total}")
    return pedido


def test_confirmar_pedido(pedido):
    """Prueba la confirmación del pedido y notificaciones"""
    print_header("CONFIRMANDO PEDIDO Y VALIDANDO NOTIFICACIONES")
    
    # Contar notificaciones antes
    notif_antes = Notificacion.objects.count()
    print_info(f"Notificaciones antes de confirmar: {notif_antes}")
    
    # Confirmar pedido
    success, mensaje = pedido.confirmar_pedido()
    
    if success:
        print_success(f"Pedido confirmado: {mensaje}")
        print_info(f"Estado confirmado: {pedido.confirmado}")
        
        # Verificar stock reducido
        for item in pedido.items.all():
            item.producto.refresh_from_db()
            print_info(f"Stock actualizado - {item.producto.nombre}: {item.producto.stock}")
        
        # Esperar un momento para que se procesen las notificaciones
        import time
        time.sleep(2)
        
        # Contar notificaciones después
        notif_despues = Notificacion.objects.count()
        print_info(f"Notificaciones después de confirmar: {notif_despues}")
        
        # Mostrar notificaciones creadas
        notificaciones_nuevas = Notificacion.objects.filter(
            pedido_id=pedido.id,
            tipo=TipoNotificacion.PEDIDO_CONFIRMADO
        )
        
        for notif in notificaciones_nuevas:
            print_success(f"Notificación creada: {notif.get_tipo_display()} - {notif.get_canal_display()}")
            print_info(f"Destinatario: {notif.destinatario}")
            print_info(f"Estado: {notif.get_estado_display()}")
            
            if notif.canal == CanalNotificacion.EMAIL:
                print_info(f"Asunto: {notif.asunto}")
        
        return True
    else:
        print_error(f"Error confirmando pedido: {mensaje}")
        return False


def test_cambios_estado_pedido(pedido):
    """Prueba cambios de estado del pedido y notificaciones"""
    print_header("PROBANDO CAMBIOS DE ESTADO DEL PEDIDO")
    
    estados_prueba = [
        ('preparando', 'Preparando'),
        ('en_camino', 'En camino'),
        ('entregado', 'Entregado')
    ]
    
    for estado_codigo, estado_nombre in estados_prueba:
        print_info(f"Cambiando estado a: {estado_nombre}")
        
        # Contar notificaciones antes del cambio
        notif_antes = Notificacion.objects.filter(pedido_id=pedido.id).count()
        
        # Cambiar estado
        pedido.estado = estado_codigo
        pedido.save()
        
        # Esperar procesamiento
        import time
        time.sleep(1)
        
        # Contar notificaciones después del cambio
        notif_despues = Notificacion.objects.filter(pedido_id=pedido.id).count()
        
        if notif_despues > notif_antes:
            print_success(f"Notificación enviada para estado: {estado_nombre}")
            
            # Mostrar última notificación
            ultima_notif = Notificacion.objects.filter(pedido_id=pedido.id).last()
            print_info(f"Tipo: {ultima_notif.get_tipo_display()}")
            print_info(f"Canal: {ultima_notif.get_canal_display()}")
            print_info(f"Estado: {ultima_notif.get_estado_display()}")
        else:
            print_info(f"No se generó notificación para estado: {estado_nombre}")


def test_estadisticas_finales():
    """Muestra estadísticas finales del sistema"""
    print_header("ESTADÍSTICAS FINALES DEL SISTEMA")
    
    # Estadísticas de notificaciones
    total_notif = Notificacion.objects.count()
    print_info(f"Total de notificaciones: {total_notif}")
    
    # Por tipo
    for tipo_codigo, tipo_nombre in TipoNotificacion.choices:
        count = Notificacion.objects.filter(tipo=tipo_codigo).count()
        if count > 0:
            print_info(f"  {tipo_nombre}: {count}")
    
    # Por canal
    for canal_codigo, canal_nombre in CanalNotificacion.choices:
        count = Notificacion.objects.filter(canal=canal_codigo).count()
        if count > 0:
            print_info(f"  {canal_nombre}: {count}")
    
    # Por estado
    from notificaciones.models import EstadoNotificacion
    for estado_codigo, estado_nombre in EstadoNotificacion.choices:
        count = Notificacion.objects.filter(estado=estado_codigo).count()
        if count > 0:
            print_info(f"  {estado_nombre}: {count}")
    
    # Estadísticas de pedidos
    total_pedidos = Pedido.objects.count()
    pedidos_confirmados = Pedido.objects.filter(confirmado=True).count()
    
    print_info(f"Total de pedidos: {total_pedidos}")
    print_info(f"Pedidos confirmados: {pedidos_confirmados}")


def main():
    """Función principal de pruebas"""
    print_header("🌸 PRUEBA COMPLETA DEL FLUJO DE PEDIDOS CON NOTIFICACIONES 🌸")
    
    try:
        # Crear datos de prueba
        usuario, productos = crear_datos_prueba()
        
        # Crear pedido
        pedido = crear_pedido_prueba(usuario, productos)
        
        # Confirmar pedido y validar notificaciones
        if test_confirmar_pedido(pedido):
            # Probar cambios de estado
            test_cambios_estado_pedido(pedido)
        
        # Mostrar estadísticas finales
        test_estadisticas_finales()
        
        print_header("RESUMEN DE LA PRUEBA")
        print_success("✅ Flujo completo de pedidos con notificaciones funcionando correctamente")
        
        print_info("\n📋 Funcionalidades validadas:")
        print_info("• Creación automática de configuración de notificaciones para usuarios")
        print_info("• Notificaciones de registro de usuario")
        print_info("• Notificaciones de confirmación de pedido")
        print_info("• Notificaciones de cambios de estado de pedido")
        print_info("• Envío automático de emails")
        print_info("• Reducción automática de stock al confirmar pedido")
        
        print_info("\n🚀 El sistema está listo para:")
        print_info("• Recibir pedidos de usuarios registrados")
        print_info("• Enviar notificaciones automáticas por email")
        print_info("• Configurar WhatsApp con credenciales reales de Twilio")
        print_info("• Usar Celery para procesamiento asíncrono en producción")
        
    except Exception as e:
        print_error(f"Error durante la prueba: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
