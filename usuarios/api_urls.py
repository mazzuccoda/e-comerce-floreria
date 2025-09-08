from django.urls import path
from . import api_views, simple_views

app_name = 'usuarios'

urlpatterns = [
    # Vistas simples sin CSRF (para frontend)
    path('simple/registro/', simple_views.simple_registro, name='simple_registro'),
    path('simple/login/', simple_views.simple_login, name='simple_login'),
    path('simple/perfil/', simple_views.simple_perfil, name='simple_perfil'),
    path('simple/logout/', simple_views.simple_logout, name='simple_logout'),
    
    # Autenticación (APIs originales)
    path('registro/', api_views.RegistroView.as_view(), name='registro'),
    path('login/', api_views.LoginView.as_view(), name='login'),
    path('logout/', api_views.LogoutView.as_view(), name='logout'),
    
    # Perfil
    path('perfil/', api_views.PerfilView.as_view(), name='perfil'),
    
    # Cambiar contraseña
    path('cambiar-password/', api_views.CambiarPasswordView.as_view(), name='cambiar_password'),
    
    # Verificaciones
    path('verificar-usuario/', api_views.verificar_usuario, name='verificar_usuario'),
    path('verificar-email/', api_views.verificar_email, name='verificar_email'),
]
