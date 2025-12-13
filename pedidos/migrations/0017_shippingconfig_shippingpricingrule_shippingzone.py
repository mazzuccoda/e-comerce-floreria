# Generated manually for shipping zones system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0016_alter_pedido_franja_horaria'),
    ]

    operations = [
        migrations.CreateModel(
            name='ShippingConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('store_name', models.CharField(default='Florería Cristina', max_length=255, verbose_name='Nombre del negocio')),
                ('store_address', models.CharField(max_length=500, verbose_name='Dirección del negocio')),
                ('store_lat', models.DecimalField(decimal_places=8, max_digits=10, verbose_name='Latitud')),
                ('store_lng', models.DecimalField(decimal_places=8, max_digits=11, verbose_name='Longitud')),
                ('max_distance_express_km', models.DecimalField(decimal_places=2, default=10.00, max_digits=5, verbose_name='Distancia máxima Express (km)')),
                ('max_distance_programado_km', models.DecimalField(decimal_places=2, default=25.00, max_digits=5, verbose_name='Distancia máxima Programado (km)')),
                ('use_distance_matrix', models.BooleanField(default=True, verbose_name='Usar Distance Matrix API')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuración de Envíos',
                'verbose_name_plural': 'Configuración de Envíos',
            },
        ),
        migrations.CreateModel(
            name='ShippingZone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('shipping_method', models.CharField(choices=[('express', 'Express'), ('programado', 'Programado')], max_length=50, verbose_name='Método de envío')),
                ('zone_name', models.CharField(max_length=100, verbose_name='Nombre de la zona')),
                ('min_distance_km', models.DecimalField(decimal_places=2, default=0, max_digits=5, verbose_name='Distancia mínima (km)')),
                ('max_distance_km', models.DecimalField(decimal_places=2, max_digits=5, verbose_name='Distancia máxima (km)')),
                ('base_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Precio base')),
                ('price_per_km', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Precio por km adicional')),
                ('zone_order', models.IntegerField(verbose_name='Orden de la zona')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activa')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Zona de Envío',
                'verbose_name_plural': 'Zonas de Envío',
                'ordering': ['shipping_method', 'zone_order'],
            },
        ),
        migrations.CreateModel(
            name='ShippingPricingRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('shipping_method', models.CharField(choices=[('express', 'Express'), ('programado', 'Programado')], max_length=50, verbose_name='Método de envío')),
                ('rule_type', models.CharField(choices=[('fixed', 'Precio fijo'), ('per_km', 'Por kilómetro'), ('tiered', 'Por niveles')], max_length=50, verbose_name='Tipo de regla')),
                ('free_shipping_threshold', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Monto para envío gratis')),
                ('minimum_charge', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Cargo mínimo')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activa')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Regla de Precio de Envío',
                'verbose_name_plural': 'Reglas de Precios de Envío',
            },
        ),
        migrations.AddConstraint(
            model_name='shippingzone',
            constraint=models.UniqueConstraint(fields=('shipping_method', 'zone_order'), name='unique_zone'),
        ),
    ]
