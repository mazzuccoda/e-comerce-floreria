from django.db import migrations

PRIMER_NUMERO_PEDIDO = 1000


def renumerar(apps, schema_editor):
    """Reemplaza los códigos aleatorios por el número correlativo derivado del id."""
    Pedido = apps.get_model('pedidos', 'Pedido')
    for pedido_id in Pedido.objects.values_list('id', flat=True):
        Pedido.objects.filter(pk=pedido_id).update(
            numero_pedido=str(PRIMER_NUMERO_PEDIDO + pedido_id)
        )


def sin_vuelta_atras(apps, schema_editor):
    """Los códigos aleatorios originales no se pueden reconstruir."""


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0030_tracking_compras'),
    ]

    operations = [
        migrations.RunPython(renumerar, sin_vuelta_atras),
    ]
