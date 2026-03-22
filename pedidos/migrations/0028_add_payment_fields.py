# Generated manually - adds token_acceso and payment fields (preference_id, link_pago)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0026_carritoabandonado_cancelado'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='token_acceso',
            field=models.CharField(blank=True, help_text='Token único para acceder al pedido sin login', max_length=32, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='pedido',
            name='preference_id',
            field=models.CharField(blank=True, help_text='ID de preferencia de Mercado Pago para pagos online', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='pedido',
            name='link_pago',
            field=models.URLField(blank=True, help_text='Link de pago generado (Mercado Pago, PayPal, etc.)', max_length=500, null=True),
        ),
    ]
