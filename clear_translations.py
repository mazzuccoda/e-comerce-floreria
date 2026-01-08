#!/usr/bin/env python
"""
Script para limpiar la tabla de traducciones.
Esto forzará que todas las traducciones se vuelvan a generar desde cero.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from core.models import Translation

# Eliminar todas las traducciones
count = Translation.objects.count()
Translation.objects.all().delete()

print(f'✅ Se eliminaron {count} traducciones de la base de datos.')
print('🔄 Las traducciones se volverán a generar automáticamente cuando se soliciten.')
