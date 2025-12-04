# Generated migration to update help text

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0004_heroslide_video_support'),
    ]

    operations = [
        migrations.AlterField(
            model_name='heroslide',
            name='video',
            field=models.FileField(blank=True, help_text='RECOMENDADO: Sube tu video en formato MP4. Máx 100MB. El autoplay funcionará perfectamente.', null=True, upload_to='hero/videos/%Y/%m/', verbose_name='Video (archivo)'),
        ),
        migrations.AlterField(
            model_name='heroslide',
            name='video_url',
            field=models.URLField(blank=True, help_text='⚠️ NO RECOMENDADO: YouTube bloquea autoplay. Solo usar si subes el archivo no funciona.', null=True, verbose_name='URL del video (YouTube)'),
        ),
    ]
