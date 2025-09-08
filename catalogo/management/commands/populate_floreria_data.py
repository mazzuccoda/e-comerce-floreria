from django.core.management.base import BaseCommand
from django.db import transaction
from catalogo.models import TipoFlor, Ocasion, ZonaEntrega, Categoria, Producto, ProductoImagen
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos de ejemplo inspirados en FloreriaPalermo.com'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando población de datos...'))
        
        with transaction.atomic():
            # Crear tipos de flor
            self.create_tipos_flor()
            
            # Crear ocasiones
            self.create_ocasiones()
            
            # Crear zonas de entrega
            self.create_zonas_entrega()
            
            # Crear categorías básicas
            self.create_categorias()
            
            # Crear productos
            self.create_productos()
            
        self.stdout.write(self.style.SUCCESS('¡Datos poblados exitosamente!'))

    def create_tipos_flor(self):
        tipos_flor = [
            ('Rosas', 'Clásicas rosas en diferentes colores'),
            ('Gerberas', 'Coloridas gerberas llenas de alegría'),
            ('Astromelias', 'Delicadas astromelias de larga duración'),
            ('Ramos Premium', 'Ramos exclusivos de alta calidad'),
            ('Lisiantus', 'Elegantes lisiantus de pétalos suaves'),
            ('Girasoles', 'Radiantes girasoles llenos de energía'),
            ('Arreglos en florero', 'Hermosos arreglos listos para regalar'),
            ('Flores Surtidas', 'Mezcla perfecta de diferentes flores'),
            ('Lilium', 'Elegantes liliums de gran impacto visual'),
        ]
        
        for nombre, descripcion in tipos_flor:
            tipo, created = TipoFlor.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': descripcion,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Creado tipo de flor: {nombre}')

    def create_ocasiones(self):
        ocasiones = [
            ('Cumpleaños', 'Flores perfectas para celebrar cumpleaños'),
            ('Aniversario', 'Ramos románticos para aniversarios'),
            ('Agradecimiento', 'Expresa tu gratitud con flores'),
            ('Maternidad', 'Celebra la llegada de un nuevo bebé'),
            ('Que te Mejores', 'Flores para desear una pronta recuperación'),
            ('Perdón', 'Pide disculpas con un hermoso ramo'),
            ('15 Años', 'Flores especiales para quinceañeras'),
            ('Entrega en el Día', 'Flores frescas entregadas el mismo día'),
            ('Enamorados', 'Ramos románticos para enamorados'),
            ('Felicitaciones', 'Celebra logros y momentos especiales'),
        ]
        
        for nombre, descripcion in ocasiones:
            ocasion, created = Ocasion.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': descripcion,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Creada ocasión: {nombre}')

    def create_zonas_entrega(self):
        zonas = [
            ('Capital Federal', 'Ciudad Autónoma de Buenos Aires', Decimal('0.00'), Decimal('50000.00')),
            ('Zona Norte', 'Vicente López, San Isidro, Tigre', Decimal('2500.00'), Decimal('75000.00')),
            ('Zona Oeste', 'Morón, Hurlingham, Ituzaingó', Decimal('3000.00'), Decimal('80000.00')),
            ('Zona Sur', 'Avellaneda, Quilmes, Berazategui', Decimal('2800.00'), Decimal('75000.00')),
        ]
        
        for nombre, descripcion, costo, envio_gratis_desde in zonas:
            zona, created = ZonaEntrega.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': descripcion,
                    'costo_envio': costo,
                    'envio_gratis_desde': envio_gratis_desde,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Creada zona: {nombre}')

    def create_categorias(self):
        categorias = [
            ('Ramos', 'Ramos de flores frescos'),
            ('Arreglos', 'Arreglos florales en base o florero'),
            ('Plantas', 'Plantas de interior y exterior'),
            ('Adicionales', 'Productos complementarios'),
        ]
        
        for nombre, descripcion in categorias:
            categoria, created = Categoria.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': descripcion,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Creada categoría: {nombre}')

    def create_productos(self):
        # Obtener referencias
        tipo_rosas = TipoFlor.objects.get(nombre='Rosas')
        tipo_lilium = TipoFlor.objects.get(nombre='Lilium')
        tipo_gerberas = TipoFlor.objects.get(nombre='Gerberas')
        tipo_girasoles = TipoFlor.objects.get(nombre='Girasoles')
        tipo_surtidas = TipoFlor.objects.get(nombre='Flores Surtidas')
        tipo_florero = TipoFlor.objects.get(nombre='Arreglos en florero')
        
        ocasion_cumple = Ocasion.objects.get(nombre='Cumpleaños')
        ocasion_aniversario = Ocasion.objects.get(nombre='Aniversario')
        ocasion_enamorados = Ocasion.objects.get(nombre='Enamorados')
        
        categoria_ramos = Categoria.objects.get(nombre='Ramos')
        categoria_arreglos = Categoria.objects.get(nombre='Arreglos')
        categoria_adicionales = Categoria.objects.get(nombre='Adicionales')
        
        # Productos principales (recomendados)
        productos_principales = [
            {
                'nombre': 'Ramo 6 Rosas Rojas Redondo',
                'descripcion': 'Hermoso ramo de 6 rosas rojas frescas, perfectamente redondo y elegante.',
                'descripcion_corta': 'Ramo clásico de 6 rosas rojas',
                'precio': Decimal('82000.00'),
                'tipo_flor': tipo_rosas,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_enamorados, ocasion_aniversario],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Ramo de 4 rosas y lilium blanco',
                'descripcion': 'Elegante combinación de 4 rosas y lilium blanco, ideal para ocasiones especiales.',
                'descripcion_corta': 'Ramo mixto rosas y lilium',
                'precio': Decimal('91000.00'),
                'tipo_flor': tipo_lilium,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_aniversario, ocasion_cumple],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Ramo de lilium blancos y follaje',
                'descripcion': 'Sofisticado ramo de lilium blancos con follaje verde, perfecto para cualquier ocasión.',
                'descripcion_corta': 'Ramo de lilium blancos',
                'precio': Decimal('97000.00'),
                'tipo_flor': tipo_lilium,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_cumple],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Ramo de rosas, flores surtidas y girasoles',
                'descripcion': 'Vibrante mezcla de rosas, flores surtidas y girasoles para alegrar cualquier día.',
                'descripcion_corta': 'Ramo mixto con girasoles',
                'precio': Decimal('99500.00'),
                'tipo_flor': tipo_surtidas,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_cumple],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Flores blancas variadas',
                'descripcion': 'Elegante selección de flores blancas variadas, símbolo de pureza y elegancia.',
                'descripcion_corta': 'Ramo de flores blancas',
                'precio': Decimal('105000.00'),
                'tipo_flor': tipo_surtidas,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_aniversario],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Liliums surtidos, gerberas surtidas y follaje',
                'descripcion': 'Hermosa combinación de liliums y gerberas surtidas con follaje fresco.',
                'descripcion_corta': 'Ramo liliums y gerberas',
                'precio': Decimal('110000.00'),
                'tipo_flor': tipo_gerberas,
                'categoria': categoria_ramos,
                'ocasiones': [ocasion_cumple],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'ramo'
            },
            {
                'nombre': 'Surtido blanco completo',
                'descripcion': 'Completo arreglo de flores blancas surtidas, perfecto para ocasiones especiales.',
                'descripcion_corta': 'Arreglo blanco completo',
                'precio': Decimal('135000.00'),
                'tipo_flor': tipo_surtidas,
                'categoria': categoria_arreglos,
                'ocasiones': [ocasion_aniversario],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'arreglo'
            },
            {
                'nombre': 'Florero con Flores Surtidas',
                'descripcion': 'Hermoso florero con una selección de flores surtidas, listo para regalar.',
                'descripcion_corta': 'Florero flores surtidas',
                'precio': Decimal('145000.00'),
                'tipo_flor': tipo_florero,
                'categoria': categoria_arreglos,
                'ocasiones': [ocasion_cumple, ocasion_aniversario],
                'is_featured': True,
                'envio_gratis': True,
                'tipo': 'florero'
            },
        ]
        
        # Productos adicionales
        productos_adicionales = [
            {
                'nombre': 'Chocolates Artesanales',
                'descripcion': 'Deliciosos chocolates artesanales para acompañar tu ramo.',
                'descripcion_corta': 'Chocolates premium',
                'precio': Decimal('15000.00'),
                'categoria': categoria_adicionales,
                'es_adicional': True,
                'envio_gratis': False,
                'tipo': 'adicional'
            },
            {
                'nombre': 'Tarjeta de Felicitación',
                'descripcion': 'Hermosa tarjeta personalizada para acompañar tu regalo.',
                'descripcion_corta': 'Tarjeta personalizada',
                'precio': Decimal('3500.00'),
                'categoria': categoria_adicionales,
                'es_adicional': True,
                'envio_gratis': False,
                'tipo': 'adicional'
            },
            {
                'nombre': 'Globo Corazón',
                'descripcion': 'Globo en forma de corazón para complementar tu regalo.',
                'descripcion_corta': 'Globo decorativo',
                'precio': Decimal('8000.00'),
                'categoria': categoria_adicionales,
                'es_adicional': True,
                'envio_gratis': False,
                'tipo': 'adicional'
            },
            {
                'nombre': 'Peluche Osito',
                'descripcion': 'Tierno osito de peluche para acompañar las flores.',
                'descripcion_corta': 'Peluche osito',
                'precio': Decimal('25000.00'),
                'categoria': categoria_adicionales,
                'es_adicional': True,
                'envio_gratis': False,
                'tipo': 'adicional'
            },
        ]
        
        # Crear productos principales
        for producto_data in productos_principales:
            ocasiones = producto_data.pop('ocasiones', [])
            
            producto, created = Producto.objects.get_or_create(
                nombre=producto_data['nombre'],
                defaults={
                    **producto_data,
                    'sku': f'FL{random.randint(1000, 9999)}',
                    'stock': random.randint(5, 20),
                    'is_active': True
                }
            )
            
            if created:
                # Agregar ocasiones
                producto.ocasiones.set(ocasiones)
                self.stdout.write(f'Creado producto: {producto.nombre}')
        
        # Crear productos adicionales
        for producto_data in productos_adicionales:
            producto, created = Producto.objects.get_or_create(
                nombre=producto_data['nombre'],
                defaults={
                    **producto_data,
                    'sku': f'AD{random.randint(1000, 9999)}',
                    'stock': random.randint(10, 50),
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'Creado producto adicional: {producto.nombre}')
