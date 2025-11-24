#!/usr/bin/env python
"""
Script para forzar la ejecución de la migración 0013_pedido_costo_envio
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

print("=" * 80)
print("🔧 FORZANDO MIGRACIÓN DE COSTO_ENVIO")
print("=" * 80)

# Verificar si la columna ya existe
print("\n1️⃣ Verificando si la columna costo_envio existe...")
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='pedidos_pedido' AND column_name='costo_envio';
    """)
    result = cursor.fetchone()
    
    if result:
        print("✅ La columna costo_envio YA EXISTE")
    else:
        print("❌ La columna costo_envio NO EXISTE")
        print("\n2️⃣ Ejecutando migración...")
        
        try:
            # Mostrar migraciones pendientes
            print("\n📋 Migraciones pendientes:")
            call_command('showmigrations', 'pedidos')
            
            # Aplicar migraciones
            print("\n🚀 Aplicando migraciones...")
            call_command('migrate', 'pedidos', verbosity=2)
            
            print("\n✅ Migración completada exitosamente!")
            
        except Exception as e:
            print(f"\n❌ Error al aplicar migración: {e}")
            sys.exit(1)

print("\n" + "=" * 80)
print("✅ PROCESO COMPLETADO")
print("=" * 80)
