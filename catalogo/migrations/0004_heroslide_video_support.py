# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0003_heroslide'),
    ]

    operations = [
        migrations.AddField(
            model_name='heroslide',
            name='tipo_media',
            field=models.CharField(choices=[('imagen', 'Imagen'), ('video', 'Video')], default='imagen', max_length=10, verbose_name='Tipo de contenido'),
        ),
        migrations.AddField(
            model_name='heroslide',
            name='video',
            field=models.FileField(blank=True, help_text='Formatos: MP4, WebM. Máx 50MB', null=True, upload_to='hero/videos/%Y/%m/', verbose_name='Video'),
        ),
        migrations.AddField(
            model_name='heroslide',
            name='video_url',
            field=models.URLField(blank=True, help_text='URL de YouTube, Vimeo o video externo (opcional)', null=True, verbose_name='URL del video'),
        ),
        migrations.AlterField(
            model_name='heroslide',
            name='imagen',
            field=models.ImageField(blank=True, null=True, upload_to='hero/%Y/%m/', verbose_name='Imagen'),
        ),
    ]
