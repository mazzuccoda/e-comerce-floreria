from django.db import models
from django.contrib.auth import get_user_model
from catalogo.models import Producto  # Asume que tu modelo Producto está en la app catalogo

User = get_user_model()

class Accesorio(models.Model):
    nombre = models.CharField(max_length=80)
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    imagen = models.ImageField(upload_to='accesorios/', null=True, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

ESTADOS = [
    ('recibido', 'Recibido'),
    ('preparando', 'Preparando'),
    ('en_camino', 'En camino'),
    ('entregado', 'Entregado'),
]

ESTADOS_PAGO = [
    ('pendiente', 'Pendiente'),
    ('approved', 'Aprobado'),
    ('rejected', 'Rechazado')
]

class Pedido(models.Model):
    cliente = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    nombre_comprador = models.CharField(max_length=100, help_text="Nombre de quien realiza la compra (si es invitado)", blank=True, null=True)
    telefono_comprador = models.CharField(max_length=20, help_text="Teléfono de quien realiza la compra para notificaciones (si es invitado)", blank=True, null=True)
    anonimo = models.BooleanField(default=False)
    dedicatoria = models.TextField()
    nombre_destinatario = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono_destinatario = models.CharField(max_length=30)
    fecha_entrega = models.DateField()
    franja_horaria = models.CharField(max_length=20, choices=[('mañana', 'Mañana (9-12)'), ('tarde', 'Tarde (16-20)')])
    instrucciones = models.CharField(max_length=200, blank=True)
    metodo_envio = models.ForeignKey('MetodoEnvio', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Método de envío")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='recibido')
    estado_pago = models.CharField(max_length=20, choices=ESTADOS_PAGO, default='pendiente')
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    MEDIOS_PAGO = [
        ('mercadopago', 'Mercado Pago'),
        ('paypal', 'PayPal'),
        ('transferencia', 'Transferencia Bancaria'),
    ]
    medio_pago = models.CharField(max_length=30, choices=MEDIOS_PAGO, default='transferencia')
    regalo_anonimo = models.BooleanField(default=False)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    confirmado = models.BooleanField(default=False)

    def __str__(self):
        return f"Pedido #{self.id} para {self.nombre_destinatario} ({self.get_estado_display()})"

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"

    def get_cost(self):
        return self.precio * self.cantidad

class PedidoAccesorio(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='accesorios', on_delete=models.CASCADE)
    accesorio = models.ForeignKey(Accesorio, on_delete=models.CASCADE)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.cantidad} x {self.accesorio.nombre}"

    def get_cost(self):
        return self.precio * self.cantidad

class MetodoEnvio(models.Model):
    nombre = models.CharField(max_length=100, help_text="Nombre del método de envío, ej: 'Envío a domicilio CABA'")
    costo = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True, help_text="Indica si este método de envío está disponible.")

    class Meta:
        verbose_name = "Método de Envío"
        verbose_name_plural = "Métodos de Envío"

    def __str__(self):
        return f"{self.nombre} - ${self.costo:.2f}"

class PedidoProducto(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='productos', on_delete=models.CASCADE)
    producto = models.ForeignKey('catalogo.Producto', on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = 'Producto del pedido'
        verbose_name_plural = 'Productos del pedido'

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} (Pedido #{self.pedido.id})"
