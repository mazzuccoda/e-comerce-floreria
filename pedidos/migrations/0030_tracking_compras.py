# Tracking de compras server-side (GA4 + Meta CAPI).
#
# Escrita a mano: `makemigrations` también arrastra diferencias viejas entre el
# modelo y migraciones anteriores (índices, preference_id, token_acceso...) que
# en producción ya se resolvieron con SQL. Esta migración sólo agrega lo nuevo.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pedidos", "0029_pedido_hora_retiro"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="ga_purchase_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="pedido",
            name="meta_purchase_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="pedido",
            name="conversion_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="pedido",
            name="tracking_context",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="pedido",
            name="medio_pago",
            field=models.CharField(
                choices=[
                    ("mercadopago", "Mercado Pago"),
                    ("paypal", "PayPal"),
                    ("transferencia", "Transferencia Bancaria"),
                    ("efectivo", "Efectivo"),
                ],
                default="transferencia",
                max_length=30,
            ),
        ),
    ]
