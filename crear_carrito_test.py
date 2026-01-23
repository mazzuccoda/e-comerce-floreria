"""
Script para crear carrito abandonado directamente en la BD
Ejecutar en Railway CLI: railway run python crear_carrito_test.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from pedidos.models import CarritoAbandonado

# Crear carrito abandonado de prueba
carrito = CarritoAbandonado.objects.create(
    telefono="3813671352",
    email="test@example.com",
    nombre="Daniel Test",
    items=[
        {
            "nombre": "Ramo de Rosas Rojas",
            "cantidad": 2,
            "precio": "15000"
        }
    ],
    total=30000
)

print(f"✅ Carrito creado exitosamente!")
print(f"   ID: {carrito.id}")
print(f"   Teléfono: {carrito.telefono}")
print(f"   Total: ${carrito.total}")
print(f"   Estado: {'Recuperado' if carrito.recuperado else ('Recordatorio enviado' if carrito.recordatorio_enviado else 'Pendiente')}")
