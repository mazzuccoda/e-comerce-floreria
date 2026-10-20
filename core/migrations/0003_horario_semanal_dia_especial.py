"""Horario del negocio en la base: semana configurable + excepciones por fecha."""
import datetime

from django.db import migrations, models


HORARIO_INICIAL = [
    # (día, abierto) — lunes a sábado 9 a 21 con corte 17, domingo cerrado.
    (0, True), (1, True), (2, True), (3, True), (4, True), (5, True), (6, False),
]


def cargar_horario_habitual(apps, schema_editor):
    HorarioSemanal = apps.get_model('core', 'HorarioSemanal')
    HorarioSemanal.objects.bulk_create([
        HorarioSemanal(
            dia=dia,
            abierto=abierto,
            apertura=datetime.time(9, 0),
            cierre=datetime.time(21, 0),
            hora_corte=datetime.time(17, 0),
            acepta_retiro=abierto,
            acepta_envio=abierto,
        )
        for dia, abierto in HORARIO_INICIAL
    ])


def borrar_horario(apps, schema_editor):
    apps.get_model('core', 'HorarioSemanal').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_translation'),
    ]

    operations = [
        migrations.CreateModel(
            name='HorarioSemanal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dia', models.PositiveSmallIntegerField(choices=[(0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'), (3, 'Jueves'), (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo')], help_text='0 = lunes … 6 = domingo', unique=True)),
                ('abierto', models.BooleanField(default=True)),
                ('apertura', models.TimeField(default=datetime.time(9, 0))),
                ('cierre', models.TimeField(default=datetime.time(21, 0))),
                ('hora_corte', models.TimeField(default=datetime.time(17, 0), help_text='Hasta qué hora se toman pedidos para entregar ese mismo día.')),
                ('acepta_retiro', models.BooleanField(default=True)),
                ('acepta_envio', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Horario semanal',
                'verbose_name_plural': 'Horario semanal',
                'ordering': ['dia'],
            },
        ),
        migrations.CreateModel(
            name='DiaEspecial',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(unique=True)),
                ('abierto', models.BooleanField(default=True, help_text='Desmarcá para cerrar ese día.')),
                ('apertura', models.TimeField(default=datetime.time(9, 0))),
                ('cierre', models.TimeField(default=datetime.time(21, 0))),
                ('hora_corte', models.TimeField(default=datetime.time(17, 0))),
                ('acepta_retiro', models.BooleanField(default=True)),
                ('acepta_envio', models.BooleanField(default=True)),
                ('mensaje', models.CharField(blank=True, help_text='Se muestra en el checkout y se publica para los asistentes de IA.', max_length=200)),
                ('creado', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Día especial',
                'verbose_name_plural': 'Días especiales',
                'ordering': ['fecha'],
            },
        ),
        migrations.RunPython(cargar_horario_habitual, borrar_horario),
    ]
