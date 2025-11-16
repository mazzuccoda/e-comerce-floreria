from django.core.management.base import BaseCommand
from django.utils.text import slugify
from catalogo.models import Categoria


class Command(BaseCommand):
    help = 'Crea la categoría "Oferta del día" si no existe'

    def handle(self, *args, **options):
        categoria_nombre = "Oferta del día"
        
        # Verificar si ya existe
        if Categoria.objects.filter(nombre=categoria_nombre).exists():
            self.stdout.write(
                self.style.WARNING(f'La categoría "{categoria_nombre}" ya existe')
            )
            return
        
        # Crear la categoría
        categoria = Categoria.objects.create(
            nombre=categoria_nombre,
            slug=slugify(categoria_nombre),
            descripcion="Productos con ofertas especiales del día",
            is_active=True
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Categoría "{categoria_nombre}" creada exitosamente con slug: {categoria.slug}')
        )
