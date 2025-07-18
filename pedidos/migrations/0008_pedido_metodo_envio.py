# Generated by Django 4.2.18 on 2025-07-06 19:59

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("pedidos", "0007_metodoenvio"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="metodo_envio",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="pedidos.metodoenvio",
                verbose_name="Método de envío",
            ),
        ),
    ]
