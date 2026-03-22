# Generated manually - adds token_acceso and payment fields (preference_id, link_pago)
# Uses RunSQL to check if columns exist before adding them

from django.db import migrations


def add_payment_fields(apps, schema_editor):
    """Add payment fields only if they don't exist"""
    with schema_editor.connection.cursor() as cursor:
        # Add token_acceso if not exists
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='pedidos_pedido' AND column_name='token_acceso'
                ) THEN
                    ALTER TABLE pedidos_pedido 
                    ADD COLUMN token_acceso VARCHAR(32) NULL UNIQUE;
                END IF;
            END $$;
        """)
        
        # Add preference_id if not exists
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='pedidos_pedido' AND column_name='preference_id'
                ) THEN
                    ALTER TABLE pedidos_pedido 
                    ADD COLUMN preference_id VARCHAR(100) NULL;
                END IF;
            END $$;
        """)
        
        # Add link_pago if not exists
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='pedidos_pedido' AND column_name='link_pago'
                ) THEN
                    ALTER TABLE pedidos_pedido 
                    ADD COLUMN link_pago VARCHAR(500) NULL;
                END IF;
            END $$;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0026_carritoabandonado_cancelado'),
    ]

    operations = [
        migrations.RunPython(add_payment_fields, reverse_code=migrations.RunPython.noop),
    ]
