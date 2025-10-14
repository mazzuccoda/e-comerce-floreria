import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "floreria_cristina.settings")
django.setup()

from catalogo.models import Producto, Categoria, TipoFlor, Ocasion
from decimal import Decimal

def create_test_products():
    print("Creando productos de prueba...")
    
    # Asegurarse de que existe la categoría principal
    cat, created = Categoria.objects.get_or_create(
        nombre="Ramos",
        slug="ramos",
        descripcion="Ramos florales variados"
    )
    
    # Obtener tipos de flor y ocasiones existentes
    tipo_rosas = TipoFlor.objects.get(nombre="Rosas")
    tipo_girasoles = TipoFlor.objects.get(nombre="Girasoles")
    tipo_tulipanes = TipoFlor.objects.get(nombre="Tulipanes")
    
    ocasion_amor = Ocasion.objects.get(nombre="San Valentín")
    ocasion_cumple = Ocasion.objects.get(nombre="Cumpleaños")
    
    # Crear productos
    productos = [
        {
            "nombre": "Ramo de 12 Rosas Rojas",
            "slug": "ramo-12-rosas-rojas",
            "descripcion": "Hermoso ramo de 12 rosas rojas frescas con follaje decorativo",
            "descripcion_corta": "Ramo de 12 rosas rojas",
            "precio": Decimal("45000"),
            "stock": 10,
            "is_featured": True,
            "is_active": True,
            "tipo_flor": tipo_rosas,
            "categoria": cat,
            "envio_gratis": True,
            "ocasiones": [ocasion_amor, ocasion_cumple]
        },
        {
            "nombre": "Bouquet de Girasoles",
            "slug": "bouquet-girasoles",
            "descripcion": "Vibrante ramo de girasoles que irradia alegría",
            "descripcion_corta": "Bouquet de girasoles",
            "precio": Decimal("38000"),
            "stock": 8,
            "is_featured": True,
            "is_active": True,
            "tipo_flor": tipo_girasoles,
            "categoria": cat,
            "envio_gratis": True,
            "ocasiones": [ocasion_cumple]
        },
        {
            "nombre": "Ramo de Tulipanes Coloridos",
            "slug": "ramo-tulipanes-coloridos",
            "descripcion": "Elegante arreglo de tulipanes en variados colores",
            "descripcion_corta": "Ramo de tulipanes variados",
            "precio": Decimal("42000"),
            "precio_descuento": Decimal("36000"),
            "stock": 6,
            "is_featured": True,
            "is_active": True,
            "tipo_flor": tipo_tulipanes,
            "categoria": cat,
            "envio_gratis": True,
            "ocasiones": [ocasion_amor, ocasion_cumple]
        }
    ]
    
    for prod_data in productos:
        ocasiones = prod_data.pop('ocasiones', [])
        
        # Calcular precio final
        precio_final = prod_data.get('precio_descuento', prod_data['precio'])
        
        # Calcular porcentaje de descuento si hay
        porcentaje_descuento = None
        if 'precio_descuento' in prod_data:
            descuento = float(prod_data['precio'] - prod_data['precio_descuento'])
            porcentaje = round((descuento / float(prod_data['precio'])) * 100)
            porcentaje_descuento = porcentaje
        
        # Crear o actualizar producto
        producto, created = Producto.objects.update_or_create(
            slug=prod_data['slug'],
            defaults={
                **prod_data,
                'precio_final': precio_final,
                'porcentaje_descuento': porcentaje_descuento
            }
        )
        
        # Asignar ocasiones
        producto.ocasiones.set(ocasiones)
        
        status = "Creado" if created else "Actualizado"
        print(f"{status}: {producto.nombre} (${producto.precio_final})")
    
    print(f"\nTotal productos en BD: {Producto.objects.count()}")
    
if __name__ == "__main__":
    create_test_products()
