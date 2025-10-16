# Generated manually for adding tipo_envio field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0011_pedido_numero_pedido_alter_pedido_estado'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='tipo_envio',
            field=models.CharField(blank=True, help_text='Tipo de envío: retiro, express, programado', max_length=20, null=True),
        ),
    ]
