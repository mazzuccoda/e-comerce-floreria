from decimal import Decimal
from django.conf import settings
from catalogo.models import Producto
from .models import Carrito, CarritoItem
from django.contrib.auth.models import AnonymousUser


class Cart:
    """
    Carrito híbrido que funciona con sesiones para usuarios anónimos
    y con base de datos para usuarios registrados.
    """
    
    def __init__(self, request):
        """
        Inicializa el carrito.
        """
        self.request = request
        self.session = request.session
        self.user = getattr(request, 'user', None)
        
        # Asegurar que la sesión tenga una clave
        if not self.session.session_key:
            self.session.create()
        
        if self.user and self.user.is_authenticated:
            # Usuario registrado: usar base de datos
            self.carrito_db, created = Carrito.objects.get_or_create(
                usuario=self.user,
                defaults={'session_key': self.session.session_key}
            )
            # Migrar carrito de sesión si existe
            if created:
                self._migrate_session_to_db()
        else:
            # Usuario anónimo: usar sesión
            cart = self.session.get(settings.CART_SESSION_ID)
            if not cart:
                cart = self.session[settings.CART_SESSION_ID] = {}
            self.cart = cart
            # Limpiar cualquier valor no serializable
            self._clean_session_cart()

    def _migrate_session_to_db(self):
        """Migra el carrito de la sesión a la base de datos cuando el usuario se loguea"""
        session_cart = self.session.get(settings.CART_SESSION_ID, {})
        for product_id, item_data in session_cart.items():
            try:
                producto = Producto.objects.get(id=int(product_id))
                CarritoItem.objects.get_or_create(
                    carrito=self.carrito_db,
                    producto=producto,
                    defaults={
                        'cantidad': item_data['quantity'],
                        'precio_unitario': Decimal(str(item_data['price']))
                    }
                )
            except Producto.DoesNotExist:
                continue
        
        # Limpiar carrito de sesión después de migrar
        if settings.CART_SESSION_ID in self.session:
            del self.session[settings.CART_SESSION_ID]
            self.session.modified = True

    def _clean_session_cart(self):
        """Limpia valores no serializables del carrito de sesión"""
        if not hasattr(self, 'cart'):
            return
        
        for product_id, item_data in self.cart.items():
            # Asegurar que price sea float, no Decimal
            if 'price' in item_data:
                try:
                    item_data['price'] = float(item_data['price'])
                except (ValueError, TypeError):
                    item_data['price'] = 0.0
            
            # Asegurar que quantity sea int
            if 'quantity' in item_data:
                try:
                    item_data['quantity'] = int(item_data['quantity'])
                except (ValueError, TypeError):
                    item_data['quantity'] = 1

    def add(self, product, quantity=1, update_quantity=False):
        """
        Añade un producto al carrito o actualiza su cantidad.
        """
        try:
            if not isinstance(quantity, int) or quantity < 1:
                raise ValueError("La cantidad debe ser un número entero positivo")
                
            if self.user and self.user.is_authenticated:
                # Usuario registrado: usar base de datos
                item, created = CarritoItem.objects.get_or_create(
                    carrito=self.carrito_db,
                    producto=product,
                    defaults={
                        'cantidad': quantity,
                        'precio_unitario': product.get_precio_final
                    }
                )
                
                if not created:
                    if update_quantity:
                        item.cantidad = quantity
                    else:
                        item.cantidad += quantity
                    
                    # Asegurarse de no exceder el stock
                    if item.cantidad > product.stock:
                        item.cantidad = product.stock
                        
                    item.save()
                    
                    # Si la cantidad es 0 o menos, eliminar el ítem
                    if item.cantidad <= 0:
                        item.delete()
                        
            else:
                # Usuario anónimo: usar sesión
                product_id = str(product.id)
                
                if product_id not in self.cart:
                    self.cart[product_id] = {
                        'quantity': 0, 
                        'price': float(product.get_precio_final)
                    }
                
                if update_quantity:
                    self.cart[product_id]['quantity'] = quantity
                else:
                    self.cart[product_id]['quantity'] += quantity
                
                # Asegurarse de no exceder el stock
                if self.cart[product_id]['quantity'] > product.stock:
                    self.cart[product_id]['quantity'] = product.stock
                
                # Si la cantidad es 0 o menos, eliminar el ítem
                if self.cart[product_id]['quantity'] <= 0:
                    del self.cart[product_id]
                
                self.save()
                
            return True
            
        except Exception as e:
            print(f"Error al agregar al carrito: {str(e)}")
            return False

    def save(self):
        """Marcar la sesión como modificada"""
        if not (self.user and self.user.is_authenticated):
            self.session.modified = True

    def remove(self, product):
        """
        Elimina un producto del carrito.
        """
        if self.user and self.user.is_authenticated:
            # Usuario registrado: eliminar de base de datos
            try:
                item = CarritoItem.objects.get(
                    carrito=self.carrito_db,
                    producto=product
                )
                item.delete()
            except CarritoItem.DoesNotExist:
                pass
        else:
            # Usuario anónimo: eliminar de sesión
            product_id = str(product.id)
            if product_id in self.cart:
                del self.cart[product_id]
                self.save()

    def update_quantity(self, product, quantity):
        """
        Actualiza la cantidad de un producto específico.
        """
        if quantity <= 0:
            self.remove(product)
        else:
            self.add(product, quantity, update_quantity=True)

    def __iter__(self):
        """
        Itera sobre los artículos en el carrito.
        """
        if self.user and self.user.is_authenticated:
            # Usuario registrado: obtener de base de datos
            for item in self.carrito_db.items.select_related('producto'):
                yield {
                    'producto': item.producto,
                    'quantity': item.cantidad,
                    'price': item.precio_unitario,
                    'total_price': item.total_precio,
                    'item_id': item.id
                }
        else:
            # Usuario anónimo: obtener de sesión
            product_ids = self.cart.keys()
            products = Producto.objects.filter(id__in=product_ids)
            
            # Crear un diccionario temporal para mapear productos por ID
            products_dict = {str(product.id): product for product in products}
            
            for product_id, item_data in self.cart.items():
                if product_id in products_dict:
                    product = products_dict[product_id]
                    price = Decimal(str(item_data['price']))
                    quantity = item_data['quantity']
                    yield {
                        'producto': product,
                        'quantity': quantity,
                        'price': price,
                        'total_price': price * quantity
                    }

    def __contains__(self, product):
        """Verifica si un producto ya está en el carrito"""
        if self.user and self.user.is_authenticated:
            return self.carrito_db.items.filter(producto=product).exists()
        else:
            return str(product.id) in self.cart

    def __len__(self):
        """Retorna el número de items en el carrito"""
        if self.user and self.user.is_authenticated:
            return self.carrito_db.items.count()
        else:
            cart = self.session.get(settings.CART_SESSION_ID, {})
            return sum(item['quantity'] for item in cart.values())

    def get_items(self):
        """Obtiene todos los items del carrito con sus detalles"""
        items = []
        for item in self:
            items.append({
                'producto': item['producto'],
                'quantity': item['quantity'],
                'price': str(item['price']),
                'total_price': str(item['total_price'])
            })
        return items

    def get_total_price(self):
        """
        Retorna el precio total del carrito.
        """
        if self.user and self.user.is_authenticated:
            return self.carrito_db.total_precio
        else:
            return sum(Decimal(str(item['price'])) * item['quantity'] 
                      for item in self.cart.values())

    def clear(self):
        """
        Limpia el carrito.
        """
        if self.user and self.user.is_authenticated:
            self.carrito_db.limpiar()
        else:
            if settings.CART_SESSION_ID in self.session:
                del self.session[settings.CART_SESSION_ID]
                self.save()

    def get_items(self):
        """
        Retorna una lista de todos los items del carrito.
        """
        return list(self)

    @property
    def is_empty(self):
        """
        Verifica si el carrito está vacío.
        """
        return len(self) == 0
