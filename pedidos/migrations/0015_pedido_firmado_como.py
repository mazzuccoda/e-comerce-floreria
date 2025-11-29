# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0014_add_costo_envio_safe'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='firmado_como',
            field=models.CharField(blank=True, help_text='Nombre con el que se firma la dedicatoria', max_length=100, null=True),
        ),
    ]
