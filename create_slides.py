"""
Script para crear slides del hero directamente en la base de datos
Ejecutar en Railway con: python manage.py shell < create_slides.py
"""

from catalogo.models import HeroSlide

# Eliminar slides existentes
HeroSlide.objects.all().delete()
print('🗑️ Slides anteriores eliminados')

# Crear slides por defecto
slides_data = [
    {
        'titulo': 'FLORERÍA CRISTINA',
        'subtitulo': 'Ramos de flores Naturales',
        'imagen': 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567953/Carrucel_1.png',
        'texto_boton': 'Ver Productos',
        'enlace_boton': '/productos',
        'orden': 1,
        'is_active': True,
        'tipo_media': 'imagen'
    },
    {
        'titulo': 'Entrega a domicilios',
        'subtitulo': 'Yerba Buena y alrededores',
        'imagen': 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen26_aeywu7.png',
        'texto_boton': 'Comprar Ahora',
        'enlace_boton': '/productos',
        'orden': 2,
        'is_active': True,
        'tipo_media': 'imagen'
    },
    {
        'titulo': 'Tenemos el ramo que buscas',
        'subtitulo': 'Diseños únicos para cada ocasión',
        'imagen': 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen17_ozu8fo.png',
        'texto_boton': 'Explorar',
        'enlace_boton': '/productos',
        'orden': 3,
        'is_active': True,
        'tipo_media': 'imagen'
    }
]

for slide_data in slides_data:
    slide = HeroSlide.objects.create(**slide_data)
    print(f'✅ Slide creado: {slide.titulo}')

print(f'\n🎉 {len(slides_data)} slides creados exitosamente!')
