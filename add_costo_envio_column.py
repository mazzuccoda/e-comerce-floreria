#!/usr/bin/env python
"""
Script para agregar la columna costo_envio si no existe
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from django.db import connection

print("=" * 80)
print("🔧 VERIFICANDO Y AGREGANDO COLUMNA COSTO_ENVIO")
print("=" * 80)

try:
    with connection.cursor() as cursor:
        # Verificar si la columna existe
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
            print("🔧 Agregando columna manualmente...")
            
            # Agregar la columna
            cursor.execute("""
                ALTER TABLE pedidos_pedido 
                ADD COLUMN costo_envio NUMERIC(10, 2) DEFAULT 0 NOT NULL;
            """)
            
            print("✅ Columna costo_envio agregada exitosamente!")
            
            # Verificar que se agregó
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='pedidos_pedido' AND column_name='costo_envio';
            """)
            result = cursor.fetchone()
            
            if result:
                print("✅ Verificación: La columna ahora existe")
            else:
                print("❌ Error: La columna no se pudo agregar")
                sys.exit(1)
                
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print("=" * 80)
print("✅ PROCESO COMPLETADO")
print("=" * 80)
