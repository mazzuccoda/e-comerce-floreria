# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0025_carritoabandonado'),
    ]

    operations = [
        migrations.AddField(
            model_name='carritoabandonado',
            name='cancelado',
            field=models.BooleanField(default=False, help_text='Marcado como cancelado cuando el cliente vuelve al checkout'),
        ),
        migrations.AddField(
            model_name='carritoabandonado',
            name='cancelado_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
