from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0031_numero_pedido_correlativo'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='origen_manual',
            field=models.BooleanField(
                default=False,
                help_text='Pedido tomado por teléfono o WhatsApp y cargado desde el panel',
                verbose_name='Cargado a mano',
            ),
        ),
    ]
