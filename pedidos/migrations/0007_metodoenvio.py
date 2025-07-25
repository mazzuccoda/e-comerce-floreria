# Generated by Django 4.2.18 on 2025-07-06 19:57

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("pedidos", "0006_pedidoproducto"),
    ]

    operations = [
        migrations.CreateModel(
            name="MetodoEnvio",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "nombre",
                    models.CharField(
                        help_text="Nombre del método de envío, ej: 'Envío a domicilio CABA'",
                        max_length=100,
                    ),
                ),
                ("costo", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "activo",
                    models.BooleanField(
                        default=True,
                        help_text="Indica si este método de envío está disponible.",
                    ),
                ),
            ],
            options={
                "verbose_name": "Método de Envío",
                "verbose_name_plural": "Métodos de Envío",
            },
        ),
    ]
