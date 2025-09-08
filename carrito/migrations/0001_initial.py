# Generated manually for carrito app

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalogo', '0002_ocasion_tipoflor_zonaentrega_producto_envio_gratis_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Carrito',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(blank=True, max_length=40, null=True, verbose_name='Clave de sesión')),
                ('creado', models.DateTimeField(auto_now_add=True, verbose_name='Creado')),
                ('actualizado', models.DateTimeField(auto_now=True, verbose_name='Actualizado')),
                ('usuario', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Carrito',
                'verbose_name_plural': 'Carritos',
            },
        ),
        migrations.CreateModel(
            name='CarritoItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)], verbose_name='Cantidad')),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Precio unitario')),
                ('creado', models.DateTimeField(auto_now_add=True, verbose_name='Creado')),
                ('actualizado', models.DateTimeField(auto_now=True, verbose_name='Actualizado')),
                ('carrito', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='carrito.carrito', verbose_name='Carrito')),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='catalogo.producto', verbose_name='Producto')),
            ],
            options={
                'verbose_name': 'Item del carrito',
                'verbose_name_plural': 'Items del carrito',
                'unique_together': {('carrito', 'producto')},
            },
        ),
    ]
