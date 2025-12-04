# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0015_pedido_firmado_como'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pedido',
            name='franja_horaria',
            field=models.CharField(choices=[('mañana', 'Mañana (9-12)'), ('tarde', 'Tarde (16-20)'), ('durante_el_dia', 'Durante el día')], max_length=20),
        ),
    ]
