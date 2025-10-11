#!/usr/bin/env python
"""
Script para probar el carrito y verificar sesiones
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.sessions.models import Session
from carrito.cart import Cart
from catalogo.models import Producto

print("=" * 60)
print("VERIFICACIÓN DE CARRITO Y SESIONES")
print("=" * 60)

# 1. Verificar sesiones activas
print("\n1. SESIONES ACTIVAS:")
sessions = Session.objects.all()
print(f"   Total de sesiones: {sessions.count()}")

for i, session in enumerate(sessions[:5], 1):
    print(f"\n   Sesión {i}:")
    print(f"   - Session Key: {session.session_key}")
    print(f"   - Expira: {session.expire_date}")
    data = session.get_decoded()
    print(f"   - Datos: {data}")
    
    # Verificar si tiene carrito
    if 'cart' in data:
        print(f"   - Carrito: {data['cart']}")
    else:
        print("   - No tiene carrito")

# 2. Verificar productos disponibles
print("\n2. PRODUCTOS DISPONIBLES:")
productos = Producto.objects.filter(is_active=True)[:5]
for p in productos:
    print(f"   - ID: {p.id} | {p.nombre} | Stock: {p.stock}")

print("\n" + "=" * 60)
print("VERIFICACIÓN COMPLETADA")
print("=" * 60)
