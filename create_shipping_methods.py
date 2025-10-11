#!/usr/bin/env python3
"""
Script para crear métodos de envío básicos
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from pedidos.models import MetodoEnvio

def create_shipping_methods():
    print("Creando métodos de envío...")
    
    # Crear métodos de envío básicos
    methods = [
        {"nombre": "Envío a domicilio CABA", "costo": 5000.00},
        {"nombre": "Envío a domicilio GBA", "costo": 8000.00},
        {"nombre": "Retiro en local", "costo": 0.00},
        {"nombre": "Envío programado", "costo": 5000.00},
    ]
    
    for method_data in methods:
        method, created = MetodoEnvio.objects.get_or_create(
            nombre=method_data["nombre"],
            defaults={"costo": method_data["costo"], "activo": True}
        )
        
        if created:
            print(f"✓ Creado: {method.nombre} - ${method.costo}")
        else:
            print(f"- Ya existe: {method.nombre} - ${method.costo}")
    
    print(f"\nTotal métodos de envío: {MetodoEnvio.objects.count()}")

if __name__ == "__main__":
    create_shipping_methods()
