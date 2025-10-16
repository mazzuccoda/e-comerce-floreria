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
    metodo_envio = models.ForeignKey('MetodoEnvio', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Método de envío (legacy)")
    tipo_envio = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Forma de Envío",
        help_text="Tipo de envío: retiro, express, programado",
        choices=[
            ('retiro', '🏪 Retiro en tienda'),
            ('express', '⚡ Envío Express (2-4 horas)'),
            ('programado', '📅 Envío Programado')
        ]
    )
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
            from notificaciones.services import notificacion_service
            from notificaciones.models import TipoNotificacion, CanalNotificacion, PlantillaNotificacion
            from django.contrib.auth.models import User
            import logging
            
            logger = logging.getLogger(__name__)
            logger.info(f"🔔 Iniciando notificación para pedido {self.id}")
            
            # Verificar y crear plantillas si no existen
            plantilla_existe = PlantillaNotificacion.objects.filter(
                tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
                canal=CanalNotificacion.EMAIL
            ).exists()
            
            if not plantilla_existe:
                logger.warning("⚠️ Plantilla de email no existe, creándola...")
                PlantillaNotificacion.objects.create(
                    tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
                    canal=CanalNotificacion.EMAIL,
                    asunto='✅ Pedido #{pedido_id} Confirmado - Florería Cristina',
                    mensaje='''¡Hola {nombre}!

Tu pedido #{pedido_id} ha sido confirmado exitosamente.

📋 Detalles del pedido:
• Número de pedido: #{pedido_id}
• Total: ${total}
• Fecha: {fecha}
• Cantidad de productos: {items_count}
• Tipo de envío: {tipo_envio}

📦 ¿Qué sigue?
Te notificaremos cuando tu pedido esté en camino.

💐 ¡Gracias por elegir Florería Cristina!

Saludos,
El equipo de Florería Cristina
🌸 Hacemos que cada momento sea especial 🌸''',
                    activa=True
                )
                logger.info("✅ Plantilla de email creada")
            
            # Determinar usuario y email
            usuario = None
            email_destino = None
            nombre_destino = 'Cliente'
            
            if self.cliente:
                # Cliente registrado
                usuario = self.cliente
                email_destino = self.cliente.email
                nombre_destino = self.cliente.first_name or self.cliente.username
                logger.info(f"📧 Cliente registrado: {email_destino}")
            elif self.email_comprador:
                # Cliente invitado - usar admin como usuario temporal
                usuario = User.objects.filter(is_superuser=True).first()
                email_destino = self.email_comprador
                nombre_destino = self.nombre_comprador or 'Cliente'
                logger.info(f"📧 Cliente invitado: {email_destino}")
            
            if usuario and email_destino:
                # Preparar contexto
                contexto = {
                    'pedido_id': self.id,
                    'nombre': nombre_destino,
                    'total': str(self.total),
                    'fecha': self.creado.strftime('%d/%m/%Y'),
                    'items_count': self.items.count(),
                    'tipo_envio': self.get_tipo_envio_display() if self.tipo_envio else 'No especificado'
                }
                
                logger.info(f"📝 Contexto preparado: {contexto}")
                
                # Crear y enviar notificación inmediatamente
                try:
                    notif = notificacion_service.crear_notificacion(
                        usuario=usuario,
                        tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
                        canal=CanalNotificacion.EMAIL,
                        destinatario=email_destino,
                        contexto=contexto,
                        pedido_id=self.id
                    )
                    
                    logger.info(f"✅ Notificación {notif.id} creada")
                    
                    # Enviar inmediatamente (sin Celery)
                    success = notificacion_service.enviar_notificacion(notif)
                    
                    if success:
                        logger.info(f"✅ Email enviado exitosamente a {email_destino}")
                        
                        # TEMPORAL: Enviar copia a Gmail personal para verificar
                        if email_destino != 'mazzucoda@gmail.com':
                            try:
                                logger.info("📧 Enviando copia de verificación a mazzucoda@gmail.com...")
                                notif_copia = notificacion_service.crear_notificacion(
                                    usuario=usuario,
                                    tipo=TipoNotificacion.PEDIDO_CONFIRMADO,
                                    canal=CanalNotificacion.EMAIL,
                                    destinatario='mazzucoda@gmail.com',
                                    contexto=contexto,
                                    pedido_id=self.id
                                )
                                notificacion_service.enviar_notificacion(notif_copia)
                                logger.info("✅ Copia enviada a mazzucoda@gmail.com")
                            except Exception as e:
                                logger.warning(f"⚠️ No se pudo enviar copia: {e}")
                    else:
                        logger.error(f"❌ Error enviando email a {email_destino}")
                        
                except Exception as e:
                    logger.error(f"❌ Error creando/enviando notificación: {str(e)}", exc_info=True)
            else:
                logger.warning(f"⚠️ No se pudo determinar usuario o email para pedido {self.id}")
                
        except ImportError as e:
            logger.error(f"❌ Módulo de notificaciones no disponible: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error general en notificación: {str(e)}", exc_info=True)
        
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
