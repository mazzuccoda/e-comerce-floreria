from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pedidos", "0028_add_payment_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="hora_retiro",
            field=models.TimeField(
                blank=True,
                null=True,
                help_text="Hora elegida por el cliente para retirar en tienda",
            ),
        ),
    ]
