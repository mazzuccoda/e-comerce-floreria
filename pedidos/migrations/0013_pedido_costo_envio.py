# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0012_pedido_tipo_envio'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='costo_envio',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Costo del envío', max_digits=10),
        ),
    ]
