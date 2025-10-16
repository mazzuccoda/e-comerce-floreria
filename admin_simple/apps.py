from django.apps import AppConfig


class AdminSimpleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_simple'
    verbose_name = 'Administración Simple'
    
    def ready(self):
        # App lista
        pass
