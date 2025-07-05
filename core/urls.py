from django.urls import path, include
from . import views

app_name = 'core'

urlpatterns = [
    # Home
    path('', views.home, name='home'),
    
    # Static Pages
    path('sobre-nosotros/', views.about, name='about'),
    path('contacto/', views.contact, name='contact'),
    path('preguntas-frecuentes/', views.faq, name='faq'),
    path('envios/', views.shipping, name='shipping'),
    path('devoluciones/', views.returns, name='returns'),
    path('politica-de-privacidad/', views.privacy_policy, name='privacy'),
    path('terminos-y-condiciones/', views.terms, name='terms'),
    path('blog/', views.blog, name='blog'),
    path('blog/<slug:slug>/', views.blog_post, name='blog_post'),
    
    # Actions
    path('suscripcion/', views.subscribe, name='subscribe'),
    path('buscar/', views.search, name='search'),
    path('perfil/', views.profile_view, name='profile'),

]
