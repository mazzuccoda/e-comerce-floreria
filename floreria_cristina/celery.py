import os
from celery import Celery

# Establecer el módulo de configuración de Django predeterminado para 'celery'.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')

app = Celery('floreria_cristina')

# Usar la configuración de Django para Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# Cargar tareas de todas las aplicaciones registradas
app.autodiscover_tasks()

# Configuración específica para Celery Beat
app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'
app.conf.beat_schedule = {
    'procesar-notificaciones-pendientes': {
        'task': 'notificaciones.tasks.procesar_notificaciones_pendientes',
        'schedule': 300.0,  # Cada 5 minutos
    },
    'limpiar-notificaciones-antiguas': {
        'task': 'notificaciones.tasks.limpiar_notificaciones_antiguas',
        'schedule': 86400.0,  # Cada 24 horas
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
