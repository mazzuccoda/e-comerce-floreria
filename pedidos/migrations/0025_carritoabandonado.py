# Generated manually for CarritoAbandonado model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0024_shippingconfig_shippingpricingrule_shippingzone'),
    ]

    operations = [
        migrations.CreateModel(
            name='CarritoAbandonado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(blank=True, help_text='Session ID del navegador', max_length=100, null=True)),
                ('telefono', models.CharField(db_index=True, help_text='Teléfono del comprador', max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('nombre', models.CharField(blank=True, max_length=200, null=True)),
                ('items', models.JSONField(help_text='Lista de productos: [{nombre, cantidad, precio}]')),
                ('total', models.DecimalField(decimal_places=2, help_text='Total del carrito abandonado', max_digits=10)),
                ('creado', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('recordatorio_enviado', models.BooleanField(default=False)),
                ('recordatorio_enviado_at', models.DateTimeField(blank=True, null=True)),
                ('recuperado', models.BooleanField(default=False)),
                ('recuperado_at', models.DateTimeField(blank=True, null=True)),
                ('pedido_recuperado', models.ForeignKey(blank=True, help_text='Pedido generado si se recuperó el carrito', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='carrito_origen', to='pedidos.pedido')),
            ],
            options={
                'verbose_name': 'Carrito Abandonado',
                'verbose_name_plural': 'Carritos Abandonados',
                'ordering': ['-creado'],
                'indexes': [
                    models.Index(fields=['telefono', '-creado'], name='pedidos_car_telefon_idx'),
                    models.Index(fields=['recuperado', 'recordatorio_enviado'], name='pedidos_car_recuper_idx'),
                ],
            },
        ),
    ]
