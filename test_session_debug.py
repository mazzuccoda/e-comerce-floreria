#!/usr/bin/env python
"""
Script para debug de sesiones
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.contrib.sessions.models import Session
from datetime import datetime, timezone

print("=" * 60)
print("DEBUG DE SESIONES")
print("=" * 60)

sessions = Session.objects.all().order_by('-expire_date')[:10]
print(f"\nTotal de sesiones: {Session.objects.count()}")
print(f"\nÚltimas 10 sesiones:")

for i, session in enumerate(sessions, 1):
    print(f"\n{i}. Session Key: {session.session_key[:20]}...")
    print(f"   Expira: {session.expire_date}")
    
    data = session.get_decoded()
    print(f"   Datos: {list(data.keys())}")
    
    if 'cart' in data:
        cart = data['cart']
        print(f"   ✅ TIENE CARRITO:")
        print(f"      Items: {len(cart)}")
        for product_id, item_data in cart.items():
            print(f"      - Producto {product_id}: cantidad {item_data.get('quantity', 0)}")
    else:
        print(f"   ❌ NO tiene carrito")

print("\n" + "=" * 60)
