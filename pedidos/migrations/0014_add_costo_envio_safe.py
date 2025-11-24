# Generated manually - Safe migration for costo_envio

from django.db import migrations, models, connection


def add_costo_envio_if_not_exists(apps, schema_editor):
    """Agregar columna costo_envio solo si no existe"""
    with connection.cursor() as cursor:
        # Verificar si la columna existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='pedidos_pedido' AND column_name='costo_envio';
        """)
        result = cursor.fetchone()
        
        if not result:
            # La columna no existe, agregarla
            cursor.execute("""
                ALTER TABLE pedidos_pedido 
                ADD COLUMN costo_envio NUMERIC(10, 2) DEFAULT 0 NOT NULL;
            """)
            print("✅ Columna costo_envio agregada exitosamente")
        else:
            print("✅ Columna costo_envio ya existe")


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0013_pedido_costo_envio'),
    ]

    operations = [
        migrations.RunPython(add_costo_envio_if_not_exists, migrations.RunPython.noop),
    ]
