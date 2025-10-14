import os
import django
import uuid

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "floreria_cristina.settings")
django.setup()

from catalogo.models import Producto, Categoria, TipoFlor, Ocasion
from decimal import Decimal

def create_single_product():
    print("Creando un producto de prueba...")
    
    # Asegurarse de que existe la categoría principal
    cat, created = Categoria.objects.get_or_create(
        nombre="Ramos",
        slug="ramos",
        descripcion="Ramos florales variados"
    )
    
    # Obtener tipos de flor y ocasiones existentes
    tipo_rosas = TipoFlor.objects.get(nombre="Rosas")
    
    ocasion_amor = Ocasion.objects.get(nombre="San Valentín")
    
    # Crear un producto con SKU único
    sku = str(uuid.uuid4())[:8].upper()
    
    producto = Producto.objects.create(
        nombre="Ramo de 12 Rosas Rojas",
        slug="ramo-12-rosas-rojas-" + sku.lower(),
        sku=sku,
        descripcion="Hermoso ramo de 12 rosas rojas frescas con follaje decorativo",
        descripcion_corta="Ramo de 12 rosas rojas",
        precio=Decimal("45000"),
        stock=10,
        is_featured=True,
        is_active=True,
        tipo_flor=tipo_rosas,
        categoria=cat,
    )
    
    # Asignar ocasiones
    producto.ocasiones.add(ocasion_amor)
    
    print(f"Creado: {producto.nombre} (${producto.precio}) - SKU: {producto.sku}")
    print(f"\nTotal productos en BD: {Producto.objects.count()}")
    
if __name__ == "__main__":
    create_single_product()
