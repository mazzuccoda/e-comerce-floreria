from django.core.management.base import BaseCommand
from catalogo.models import Producto, ProductoImagen
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Carga imágenes de ejemplo para productos sin imágenes'

    def handle(self, *args, **options):
        # URLs de imágenes de ejemplo para flores
        sample_images = [
            'https://via.placeholder.com/400x300/FFB6C1/FFFFFF?text=Rosa+Roja',
            'https://via.placeholder.com/400x300/DDA0DD/FFFFFF?text=Tulipán',
            'https://via.placeholder.com/400x300/98FB98/FFFFFF?text=Girasol',
            'https://via.placeholder.com/400x300/F0E68C/FFFFFF?text=Margarita',
            'https://via.placeholder.com/400x300/E6E6FA/FFFFFF?text=Lirio',
            'https://via.placeholder.com/400x300/FFC0CB/FFFFFF?text=Peonia',
            'https://via.placeholder.com/400x300/FF69B4/FFFFFF?text=Orquídea',
            'https://via.placeholder.com/400x300/90EE90/FFFFFF?text=Crisantemo',
        ]
        
        productos_sin_imagen = Producto.objects.filter(imagenes__isnull=True).distinct()
        
        self.stdout.write(f'Encontrados {productos_sin_imagen.count()} productos sin imágenes')
        
        for i, producto in enumerate(productos_sin_imagen):
            # Usar imagen de placeholder basada en el índice
            imagen_url = sample_images[i % len(sample_images)]
            
            # Crear imagen para el producto
            ProductoImagen.objects.create(
                producto=producto,
                imagen=imagen_url,  # Esto será una URL externa
                orden=1,
                is_primary=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Imagen agregada para: {producto.nombre}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'¡Completado! Se agregaron imágenes a {productos_sin_imagen.count()} productos')
        )
