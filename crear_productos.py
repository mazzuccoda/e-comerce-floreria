from catalogo.models import TipoFlor, Producto
from decimal import Decimal

# Crear tipos de flores
rosas, _ = TipoFlor.objects.get_or_create(nombre='Rosas', defaults={'descripcion': 'Flores clásicas para toda ocasión'})
tulipanes, _ = TipoFlor.objects.get_or_create(nombre='Tulipanes', defaults={'descripcion': 'Flores elegantes y coloridas'})
girasoles, _ = TipoFlor.objects.get_or_create(nombre='Girasoles', defaults={'descripcion': 'Flores alegres y vibrantes'})

# Crear productos
productos = [
    {
        'nombre': 'Ramo de 12 Rosas Rojas',
        'descripcion': 'Hermoso ramo de 12 rosas rojas frescas, ideal para expresar amor y pasión',
        'descripcion_corta': 'Ramo de 12 rosas rojas',
        'precio': Decimal('45000.00'),
        'stock': 10,
        'tipo_flor': rosas,
        'is_active': True,
        'sku': 'ROSA-12-ROJO'
    },
    {
        'nombre': 'Ramo de 24 Rosas Rojas Premium',
        'descripcion': 'Espectacular ramo de 24 rosas rojas premium, perfecto para ocasiones especiales',
        'descripcion_corta': 'Ramo de 24 rosas premium',
        'precio': Decimal('85000.00'),
        'stock': 5,
        'tipo_flor': rosas,
        'is_active': True,
        'sku': 'ROSA-24-PREMIUM'
    },
    {
        'nombre': 'Arreglo de Tulipanes Mixtos',
        'descripcion': 'Elegante arreglo con tulipanes de colores variados en jarrón de vidrio',
        'descripcion_corta': 'Tulipanes mixtos en jarrón',
        'precio': Decimal('38000.00'),
        'stock': 8,
        'tipo_flor': tulipanes,
        'is_active': True,
        'sku': 'TULIP-MIX-JAR'
    },
    {
        'nombre': 'Ramo de Girasoles',
        'descripcion': 'Alegre ramo de girasoles frescos, ideal para alegrar cualquier espacio',
        'descripcion_corta': 'Ramo de girasoles',
        'precio': Decimal('32000.00'),
        'stock': 12,
        'tipo_flor': girasoles,
        'is_active': True,
        'sku': 'GIRA-RAMO-STD'
    }
]

for prod_data in productos:
    producto, created = Producto.objects.get_or_create(
        nombre=prod_data['nombre'],
        defaults=prod_data
    )
    if created:
        print(f'✅ Producto creado: {producto.nombre}')
    else:
        print(f'ℹ️  Producto ya existe: {producto.nombre}')

print(f'\n📊 Total de productos: {Producto.objects.count()}')
