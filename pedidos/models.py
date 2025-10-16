from django.db import models
from django.contrib.auth import get_user_model
from catalogo.models import Producto  # Asume que tu modelo Producto está en la app catalogo

User = get_user_model()


ESTADOS = [
    ('recibido', 'Recibido'),
    ('preparando', 'Preparando'),
    ('en_camino', 'En camino'),
    ('entregado', 'Entregado'),
    ('cancelado', 'Cancelado'),
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
    email_comprador = models.EmailField(max_length=254, help_text="Email de quien realiza la compra (si es invitado)", blank=True, null=True)
    nombre_destinatario = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    codigo_postal = models.CharField(max_length=20, blank=True, null=True)
    telefono_destinatario = models.CharField(max_length=30)
    fecha_entrega = models.DateField()
    franja_horaria = models.CharField(max_length=20, choices=[('mañana', 'Mañana (9-12)'), ('tarde', 'Tarde (16-20)')])
    instrucciones = models.CharField(max_length=200, blank=True)
    metodo_envio = models.ForeignKey('MetodoEnvio', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Método de envío")
    tipo_envio = models.CharField(max_length=20, blank=True, null=True, help_text="Tipo de envío: retiro, express, programado")
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
    numero_pedido = models.CharField(max_length=20, unique=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.numero_pedido:
            # Generar número de pedido único
            import random
            import string
            self.numero_pedido = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pedido #{self.numero_pedido or self.id} para {self.nombre_destinatario} ({self.get_estado_display()})"
    
    def confirmar_pedido(self):
        """
        Confirma el pedido y reduce el stock de los productos
        También activa las notificaciones automáticas
        """
        if self.confirmado:
            return False, "El pedido ya está confirmado"
        
        # Verificar stock disponible para todos los productos
        for item in self.items.all():
            if item.producto.stock < item.cantidad:
                return False, f"Stock insuficiente para {item.producto.nombre}. Disponible: {item.producto.stock}, solicitado: {item.cantidad}"
        
        # Si hay stock suficiente, reducir stock y confirmar pedido
        for item in self.items.all():
            item.producto.stock -= item.cantidad
            item.producto.save()
        
        self.confirmado = True
        self.save()
        
        # Activar notificaciones para todos los pedidos
        try:
            from notificaciones.tasks import notificar_pedido_confirmado
            from django.contrib.auth.models import User
            
            if self.cliente:
                # Si hay cliente registrado, usar sus datos
                notificar_pedido_confirmado.delay(self.id, self.cliente.id)
            elif self.email_comprador:
                # Si es invitado pero tenemos email, crear notificación directa
                from notificaciones.models import TipoNotificacion, CanalNotificacion, Notificacion
                from notificaciones.services import notificacion_service
                
                # Crear usuario temporal para la notificación
                admin_user = User.objects.filter(is_superuser=True).first()
                if admin_user:
                    contexto = {
                        'pedido_id': self.id,
                        'nombre': self.nombre_comprador or 'Cliente',
                        'total': self.total,
                        'fecha': self.creado.strftime('%d/%m/%Y'),
                        'items_count': self.items.count()
                    }
                    
                    print(f"Creando notificación para pedido {self.id} - email: {self.email_comprador}")
                    
                    # Crear notificación directamente
                    try:
                        notif = notificacion_service.crear_notificacion(
                            usuario=admin_user,
                            tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
                            canal=CanalNotificacion.EMAIL,
                            destinatario=self.email_comprador,
                            contexto=contexto,
                            pedido_id=self.id
                        )
                        
                        # Enviar inmediatamente
                        from notificaciones.tasks import enviar_notificacion_async
                        enviar_notificacion_async.delay(notif.id)
                        print(f"Notificación {notif.id} creada y enviada a {self.email_comprador}")
                    except Exception as e:
                        print(f"Error creando notificación: {str(e)}")
        except ImportError:
            print("Módulo de notificaciones no disponible")
        except Exception as e:
            print(f"Error en notificación: {str(e)}")
        
        return True, "Pedido confirmado exitosamente"
    
    def cancelar_pedido(self):
        """
        Cancela el pedido y restaura el stock de los productos
        """
        if not self.confirmado:
            return False, "El pedido no está confirmado"
        
        # Restaurar stock
        for item in self.items.all():
            item.producto.stock += item.cantidad
            item.producto.save()
        
        self.confirmado = False
        self.estado = 'cancelado'
        self.save()
        return True, "Pedido cancelado y stock restaurado"
    
    def validar_stock_disponible(self):
        """
        Valida que hay stock suficiente para todos los productos del pedido
        """
        productos_sin_stock = []
        for item in self.items.all():
            if item.producto.stock < item.cantidad:
                productos_sin_stock.append({
                    'producto': item.producto.nombre,
                    'solicitado': item.cantidad,
                    'disponible': item.producto.stock
                })
        
        return len(productos_sin_stock) == 0, productos_sin_stock

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"

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
