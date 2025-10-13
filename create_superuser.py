#!/usr/bin/env python
"""
Script para crear superusuario en Railway
Ejecutar: railway run python create_superuser.py
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecomerce.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Datos del superusuario
username = 'admin'
email = 'admin@floreria.com'
password = 'Admin123!'  # CAMBIAR en producción

# Crear superusuario si no existe
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f'✅ Superusuario creado exitosamente!')
    print(f'   Username: {username}')
    print(f'   Email: {email}')
    print(f'   Password: {password}')
    print(f'\n⚠️  IMPORTANTE: Cambia la contraseña desde el admin de Django')
else:
    print(f'⚠️  El usuario "{username}" ya existe')
