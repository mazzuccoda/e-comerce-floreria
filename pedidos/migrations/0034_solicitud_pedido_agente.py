import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0033_pedidoevento'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='canal',
            field=models.CharField(
                choices=[('web', 'Web'), ('agente', 'Agente de IA'), ('agente_api', 'Integración con clave')],
                db_index=True, default='web', help_text='Por dónde entró el pedido',
                max_length=20, verbose_name='Canal',
            ),
        ),
        migrations.AddField(
            model_name='pedido',
            name='agente_nombre',
            field=models.CharField(
                blank=True, default='', help_text='Qué asistente de IA armó el pedido',
                max_length=80, verbose_name='Agente',
            ),
        ),
        migrations.CreateModel(
            name='SolicitudPedidoAgente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=64, unique=True)),
                ('datos', models.JSONField(default=dict)),
                ('resumen', models.JSONField(default=dict)),
                ('estado', models.CharField(
                    choices=[
                        ('pendiente', 'Pendiente de confirmación'),
                        ('confirmada', 'Confirmada'),
                        ('vencida', 'Vencida'),
                        ('rechazada', 'Rechazada'),
                    ],
                    db_index=True, default='pendiente', max_length=12,
                )),
                ('expira_en', models.DateTimeField(db_index=True)),
                ('agente_nombre', models.CharField(blank=True, default='', max_length=80)),
                ('ip_hash', models.CharField(blank=True, default='', max_length=64)),
                ('idempotency_key', models.CharField(blank=True, db_index=True, default='', max_length=100)),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('pedido', models.OneToOneField(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='solicitud_agente', to='pedidos.pedido',
                )),
            ],
            options={
                'verbose_name': 'Solicitud de pedido por agente',
                'verbose_name_plural': 'Solicitudes de pedido por agente',
                'ordering': ['-creado'],
            },
        ),
        migrations.AddConstraint(
            model_name='solicitudpedidoagente',
            constraint=models.UniqueConstraint(
                condition=models.Q(('estado', 'pendiente'), models.Q(('idempotency_key', ''), _negated=True)),
                fields=('idempotency_key', 'ip_hash'),
                name='solicitud_agente_idempotencia_pendiente',
            ),
        ),
    ]
