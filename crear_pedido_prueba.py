#!/usr/bin/env python
"""
Script para crear un pedido de prueba y probar WhatsApp
Ejecutar desde Railway o local con: python manage.py shell < crear_pedido_prueba.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.auth.models import User
from pedidos.models import Pedido, ItemPedido
from catalogo.models import Producto

print("=" * 60)
print("🌸 CREAR PEDIDO DE PRUEBA - FLORERÍA CRISTINA 🌸")
print("=" * 60)

# 1. Obtener o crear usuario de prueba
print("\n1️⃣ Buscando usuario...")
try:
    usuario = User.objects.filter(is_superuser=True).first()
    if not usuario:
        usuario = User.objects.first()
    
    if not usuario:
        print("❌ No hay usuarios en el sistema")
        sys.exit(1)
    
    print(f"✅ Usuario encontrado: {usuario.username} ({usuario.email})")
except Exception as e:
    print(f"❌ Error buscando usuario: {str(e)}")
    sys.exit(1)

# 2. Obtener un producto de prueba
print("\n2️⃣ Buscando producto...")
try:
    producto = Producto.objects.filter(activo=True).first()
    
    if not producto:
        print("❌ No hay productos activos")
        sys.exit(1)
    
    print(f"✅ Producto encontrado: {producto.nombre} (${producto.precio})")
except Exception as e:
    print(f"❌ Error buscando producto: {str(e)}")
    sys.exit(1)

# 3. Crear pedido de prueba
print("\n3️⃣ Creando pedido de prueba...")
try:
    # Crear pedido
    pedido = Pedido.objects.create(
        usuario=usuario,
        nombre_destinatario='Cliente de Prueba WhatsApp',
        telefono_destinatario='+5493813671352',  # CAMBIA ESTO POR TU NÚMERO
        direccion='Av. Corrientes 1234, CABA',
        ciudad='Buenos Aires',
        codigo_postal='1000',
        fecha_entrega=datetime.now().date() + timedelta(days=1),
        franja_horaria='manana',
        metodo_pago='efectivo',
        estado='pendiente',
        confirmado=False,
        dedicatoria='🎉 Mensaje de prueba desde Railway - Sistema de notificaciones WhatsApp funcionando correctamente! 🌸',
        notas='Pedido de prueba para validar integración n8n + Twilio WhatsApp',
        total=Decimal('15000.00')
    )
    
    print(f"✅ Pedido creado: #{pedido.numero_pedido}")
    print(f"   ID: {pedido.id}")
    print(f"   Destinatario: {pedido.nombre_destinatario}")
    print(f"   Teléfono: {pedido.telefono_destinatario}")
    print(f"   Total: ${pedido.total}")
    
except Exception as e:
    print(f"❌ Error creando pedido: {str(e)}")
    sys.exit(1)

# 4. Agregar item al pedido
print("\n4️⃣ Agregando item al pedido...")
try:
    item = ItemPedido.objects.create(
        pedido=pedido,
        producto=producto,
        cantidad=1,
        precio=producto.precio
    )
    
    print(f"✅ Item agregado: {item.producto.nombre} x {item.cantidad}")
    
except Exception as e:
    print(f"❌ Error agregando item: {str(e)}")
    pedido.delete()
    sys.exit(1)

# 5. Confirmar pedido (esto dispara el webhook)
print("\n5️⃣ Confirmando pedido...")
print("⏳ Esto enviará el WhatsApp vía n8n + Twilio...")

try:
    success, message = pedido.confirmar_pedido()
    
    if success:
        print(f"✅ {message}")
        print(f"✅ Pedido #{pedido.numero_pedido} confirmado exitosamente")
        print("\n📱 REVISA TU WHATSAPP!")
        print(f"   Deberías recibir un mensaje en: {pedido.telefono_destinatario}")
    else:
        print(f"❌ Error confirmando pedido: {message}")
        
except Exception as e:
    print(f"❌ Error en confirmación: {str(e)}")
    import traceback
    traceback.print_exc()

# 6. Resumen
print("\n" + "=" * 60)
print("📊 RESUMEN")
print("=" * 60)
print(f"Pedido ID: {pedido.id}")
print(f"Número: {pedido.numero_pedido}")
print(f"Estado: {pedido.estado}")
print(f"Confirmado: {pedido.confirmado}")
print(f"Teléfono: {pedido.telefono_destinatario}")
print(f"Total: ${pedido.total}")
print("\n🔍 Verificar:")
print(f"1. Admin: https://e-comerce-floreria-production.up.railway.app/admin/pedidos/pedido/{pedido.id}/")
print(f"2. WhatsApp: {pedido.telefono_destinatario}")
print(f"3. Logs Railway: https://railway.app/")
print(f"4. n8n Executions: https://n8n-production-e029.up.railway.app/")
print("=" * 60)
