from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pedidos', '0032_pedido_origen_manual'),
    ]

    operations = [
        migrations.CreateModel(
            name='PedidoEvento',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name='ID',
                )),
                ('tipo', models.CharField(
                    choices=[
                        ('estado', 'Cambio de estado'),
                        ('pago', 'Cambio de pago'),
                        ('entrega', 'Datos de entrega'),
                        ('creacion', 'Pedido creado'),
                        ('nota', 'Nota interna'),
                    ],
                    default='nota', max_length=20,
                )),
                ('descripcion', models.TextField()),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('pedido', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='eventos', to='pedidos.pedido',
                )),
                ('usuario', models.ForeignKey(
                    blank=True,
                    help_text='Queda vacío si lo hizo el sitio o un pago automático',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Evento del pedido',
                'verbose_name_plural': 'Eventos del pedido',
                'ordering': ['-creado', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='pedidoevento',
            index=models.Index(
                fields=['pedido', '-creado'], name='pedidos_ped_pedido__1b5167_idx',
            ),
        ),
    ]
