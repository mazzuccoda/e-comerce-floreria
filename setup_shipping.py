#!/usr/bin/env python3
"""
Script para crear métodos de envío y configurar datos básicos
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from pedidos.models import MetodoEnvio

def setup_shipping_methods():
    print("Configurando métodos de envío...")
    
    # Crear métodos de envío
    methods = [
        {"nombre": "Envio a domicilio CABA", "costo": 5000.00},
        {"nombre": "Envio a domicilio GBA", "costo": 8000.00},
        {"nombre": "Retiro en local", "costo": 0.00},
        {"nombre": "Envio programado", "costo": 5000.00},
    ]
    
    created_count = 0
    for method_data in methods:
        method, created = MetodoEnvio.objects.get_or_create(
            nombre=method_data["nombre"],
            defaults={"costo": method_data["costo"], "activo": True}
        )
        
        if created:
            print(f"Creado: {method.nombre} - ${method.costo}")
            created_count += 1
        else:
            print(f"Ya existe: {method.nombre} - ${method.costo}")
    
    print(f"\nTotal métodos creados: {created_count}")
    print(f"Total métodos en BD: {MetodoEnvio.objects.count()}")
    
    # Mostrar todos los métodos disponibles
    print("\nMétodos de envío disponibles:")
    for method in MetodoEnvio.objects.all():
        print(f"ID: {method.id} - {method.nombre} - ${method.costo}")

if __name__ == "__main__":
    setup_shipping_methods()
