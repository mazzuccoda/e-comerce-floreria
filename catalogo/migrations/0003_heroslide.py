# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0002_ocasion_tipoflor_zonaentrega_producto_envio_gratis_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeroSlide',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=200, verbose_name='Título')),
                ('subtitulo', models.CharField(max_length=200, verbose_name='Subtítulo')),
                ('imagen', models.ImageField(upload_to='hero/%Y/%m/', verbose_name='Imagen')),
                ('texto_boton', models.CharField(blank=True, max_length=50, verbose_name='Texto del botón')),
                ('enlace_boton', models.CharField(default='/productos', max_length=200, verbose_name='Enlace del botón')),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='Orden')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Creado el')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Actualizado el')),
            ],
            options={
                'verbose_name': 'Slide del Hero',
                'verbose_name_plural': 'Slides del Hero',
                'ordering': ['orden', 'created_at'],
            },
        ),
    ]
