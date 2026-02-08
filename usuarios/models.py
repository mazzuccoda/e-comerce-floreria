from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import secrets
from datetime import timedelta


class PerfilUsuario(models.Model):
    """Perfil extendido para usuarios"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    direccion = models.CharField(max_length=255, blank=True, null=True, verbose_name='Dirección')
    ciudad = models.CharField(max_length=100, blank=True, null=True, verbose_name='Ciudad')
    codigo_postal = models.CharField(max_length=20, blank=True, null=True, verbose_name='Código Postal')
    fecha_nacimiento = models.DateField(blank=True, null=True, verbose_name='Fecha de Nacimiento')
    recibir_ofertas = models.BooleanField(default=True, verbose_name='Recibir ofertas por email')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuarios'

    def __str__(self):
        return f"Perfil de {self.user.username}"

    @property
    def nombre_completo(self):
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username


@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    """Crear perfil automáticamente cuando se crea un usuario"""
    if created:
        PerfilUsuario.objects.create(user=instance)


@receiver(post_save, sender=User)
def guardar_perfil_usuario(sender, instance, **kwargs):
    """Guardar perfil cuando se guarda el usuario"""
    if hasattr(instance, 'perfil'):
        instance.perfil.save()


class PasswordResetToken(models.Model):
    """Token para recuperación de contraseña"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Token de Recuperación de Contraseña'
        verbose_name_plural = 'Tokens de Recuperación de Contraseña'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token para {self.user.email} - {'Usado' if self.used else 'Activo'}"
    
    @classmethod
    def create_token(cls, user, expiration_hours=2):
        """Crear un nuevo token de recuperación"""
        # Invalidar tokens anteriores del usuario
        cls.objects.filter(user=user, used=False).update(used=True)
        
        # Generar token único
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=expiration_hours)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
    
    def is_valid(self):
        """Verificar si el token es válido"""
        if self.used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True
    
    def mark_as_used(self):
        """Marcar token como usado"""
        self.used = True
        self.used_at = timezone.now()
        self.save()
