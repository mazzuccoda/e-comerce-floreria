#!/usr/bin/env python
"""
Script para crear tipos de flor y ocasiones de ejemplo
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from catalogo.models import TipoFlor, Ocasion

def create_flower_types():
    """Crear tipos de flor de ejemplo"""
    tipos_flor = [
        {
            'nombre': 'Rosas',
            'descripcion': 'Flores clásicas y elegantes, perfectas para expresar amor y admiración.'
        },
        {
            'nombre': 'Tulipanes',
            'descripcion': 'Flores primaverales coloridas, símbolo de amor perfecto y elegancia.'
        },
        {
            'nombre': 'Girasoles',
            'descripcion': 'Flores alegres y vibrantes que simbolizan felicidad y energía positiva.'
        },
        {
            'nombre': 'Lilios',
            'descripcion': 'Flores sofisticadas con fragancia intensa, perfectas para ocasiones especiales.'
        },
        {
            'nombre': 'Claveles',
            'descripcion': 'Flores duraderas y coloridas, ideales para arreglos variados.'
        },
        {
            'nombre': 'Orquídeas',
            'descripcion': 'Flores exóticas y elegantes, símbolo de lujo y refinamiento.'
        },
        {
            'nombre': 'Gerberas',
            'descripcion': 'Flores alegres y coloridas que transmiten optimismo y alegría.'
        },
        {
            'nombre': 'Peonías',
            'descripcion': 'Flores románticas y voluminosas, perfectas para bodas y celebraciones.'
        }
    ]
    
    print("Creando tipos de flor...")
    for tipo_data in tipos_flor:
        tipo, created = TipoFlor.objects.get_or_create(
            nombre=tipo_data['nombre'],
            defaults={'descripcion': tipo_data['descripcion']}
        )
        if created:
            print(f"Creado: {tipo.nombre}")
        else:
            print(f"Ya existe: {tipo.nombre}")

def create_occasions():
    """Crear ocasiones de ejemplo"""
    ocasiones = [
        {
            'nombre': 'San Valentín',
            'descripcion': 'Día del amor y la amistad, perfecto para regalos románticos.'
        },
        {
            'nombre': 'Día de la Madre',
            'descripcion': 'Celebración especial para honrar a las madres.'
        },
        {
            'nombre': 'Cumpleaños',
            'descripcion': 'Celebración de un año más de vida.'
        },
        {
            'nombre': 'Aniversario',
            'descripcion': 'Conmemoración de fechas especiales en pareja.'
        },
        {
            'nombre': 'Graduación',
            'descripcion': 'Celebración de logros académicos.'
        },
        {
            'nombre': 'Bodas',
            'descripcion': 'Ceremonia de unión matrimonial.'
        },
        {
            'nombre': 'Condolencias',
            'descripcion': 'Expresión de pésame y apoyo en momentos difíciles.'
        },
        {
            'nombre': 'Nacimiento',
            'descripcion': 'Celebración de la llegada de un nuevo bebé.'
        },
        {
            'nombre': 'Día del Padre',
            'descripcion': 'Celebración especial para honrar a los padres.'
        },
        {
            'nombre': 'Navidad',
            'descripcion': 'Celebración navideña y fin de año.'
        }
    ]
    
    print("\nCreando ocasiones...")
    for ocasion_data in ocasiones:
        ocasion, created = Ocasion.objects.get_or_create(
            nombre=ocasion_data['nombre'],
            defaults={'descripcion': ocasion_data['descripcion']}
        )
        if created:
            print(f"Creado: {ocasion.nombre}")
        else:
            print(f"Ya existe: {ocasion.nombre}")

def main():
    print("Creando datos de ejemplo para Floreria Cristina")
    print("=" * 50)
    
    try:
        create_flower_types()
        create_occasions()
        
        print("\n" + "=" * 50)
        print("Datos creados exitosamente!")
        print("\nAhora puedes:")
        print("1. Ir al admin de Django (/admin/)")
        print("2. Crear o editar productos")
        print("3. Asignar tipos de flor y ocasiones a tus productos")
        print("4. Probar los filtros en el frontend")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
