from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TipoNotificacion(models.TextChoices):
    """Tipos de notificaciones disponibles"""
    PEDIDO_CONFIRMADO = 'pedido_confirmado', 'Pedido Confirmado'
    PEDIDO_ENVIADO = 'pedido_enviado', 'Pedido Enviado'
    PEDIDO_ENTREGADO = 'pedido_entregado', 'Pedido Entregado'
    PEDIDO_CANCELADO = 'pedido_cancelado', 'Pedido Cancelado'
    REGISTRO_USUARIO = 'registro_usuario', 'Registro de Usuario'
    RECUPERAR_PASSWORD = 'recuperar_password', 'Recuperar Contraseña'
    STOCK_BAJO = 'stock_bajo', 'Stock Bajo'
    PROMOCION = 'promocion', 'Promoción'


class CanalNotificacion(models.TextChoices):
    """Canales de notificación disponibles"""
    EMAIL = 'email', 'Email'
    WHATSAPP = 'whatsapp', 'WhatsApp'
    SMS = 'sms', 'SMS'


class EstadoNotificacion(models.TextChoices):
    """Estados de las notificaciones"""
    PENDIENTE = 'pendiente', 'Pendiente'
    ENVIADA = 'enviada', 'Enviada'
    FALLIDA = 'fallida', 'Fallida'
    REINTENTANDO = 'reintentando', 'Reintentando'


class PlantillaNotificacion(models.Model):
    """Plantillas para las notificaciones"""
    tipo = models.CharField(
        max_length=50,
        choices=TipoNotificacion.choices,
        verbose_name='Tipo de Notificación'
    )
    canal = models.CharField(
        max_length=20,
        choices=CanalNotificacion.choices,
        verbose_name='Canal'
    )
    asunto = models.CharField(
        max_length=200,
        verbose_name='Asunto',
        help_text='Para email. Puede usar variables como {nombre}, {pedido_id}'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje',
        help_text='Contenido del mensaje. Puede usar variables como {nombre}, {pedido_id}, {total}'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Plantilla de Notificación'
        verbose_name_plural = 'Plantillas de Notificaciones'
        unique_together = ['tipo', 'canal']

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.get_canal_display()}'


class Notificacion(models.Model):
    """Registro de notificaciones enviadas"""
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name='Usuario'
    )
    tipo = models.CharField(
        max_length=50,
        choices=TipoNotificacion.choices,
        verbose_name='Tipo'
    )
    canal = models.CharField(
        max_length=20,
        choices=CanalNotificacion.choices,
        verbose_name='Canal'
    )
    destinatario = models.CharField(
        max_length=200,
        verbose_name='Destinatario',
        help_text='Email o número de teléfono'
    )
    asunto = models.CharField(
        max_length=200,
        verbose_name='Asunto',
        blank=True
    )
    mensaje = models.TextField(
        verbose_name='Mensaje'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoNotificacion.choices,
        default=EstadoNotificacion.PENDIENTE,
        verbose_name='Estado'
    )
    intentos = models.PositiveIntegerField(
        default=0,
        verbose_name='Intentos de Envío'
    )
    max_intentos = models.PositiveIntegerField(
        default=3,
        verbose_name='Máximo Intentos'
    )
    fecha_envio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Envío'
    )
    error_mensaje = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )
    
    # Metadatos adicionales
    pedido_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID del Pedido'
    )
    producto_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID del Producto'
    )
    metadatos = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos Adicionales'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.usuario.username} ({self.get_estado_display()})'

    def puede_reintentar(self):
        """Verifica si se puede reintentar el envío"""
        return self.intentos < self.max_intentos and self.estado in [
            EstadoNotificacion.PENDIENTE,
            EstadoNotificacion.FALLIDA
        ]

    def marcar_como_enviada(self):
        """Marca la notificación como enviada"""
        self.estado = EstadoNotificacion.ENVIADA
        self.fecha_envio = timezone.now()
        self.save()

    def marcar_como_fallida(self, error_mensaje=''):
        """Marca la notificación como fallida"""
        self.estado = EstadoNotificacion.FALLIDA
        self.error_mensaje = error_mensaje
        self.intentos += 1
        self.save()


class ConfiguracionNotificacion(models.Model):
    """Configuración global de notificaciones"""
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='config_notificaciones',
        verbose_name='Usuario'
    )
    
    # Preferencias de canal
    email_habilitado = models.BooleanField(
        default=True,
        verbose_name='Email Habilitado'
    )
    whatsapp_habilitado = models.BooleanField(
        default=True,
        verbose_name='WhatsApp Habilitado'
    )
    sms_habilitado = models.BooleanField(
        default=False,
        verbose_name='SMS Habilitado'
    )
    
    # Tipos de notificaciones
    pedidos_habilitado = models.BooleanField(
        default=True,
        verbose_name='Notificaciones de Pedidos'
    )
    promociones_habilitado = models.BooleanField(
        default=True,
        verbose_name='Notificaciones de Promociones'
    )
    stock_habilitado = models.BooleanField(
        default=False,
        verbose_name='Notificaciones de Stock'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración de Notificación'
        verbose_name_plural = 'Configuraciones de Notificaciones'

    def __str__(self):
        return f'Configuración de {self.usuario.username}'
