from django.db import models
from django.contrib.auth import get_user_model
from catalogo.models import Producto
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()


class Carrito(models.Model):
    """
    Modelo para el carrito de compras.
    Puede ser para usuarios registrados o sesiones anónimas.
    """
    usuario = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name='Usuario'
    )
    session_key = models.CharField(
        max_length=40, 
        null=True, 
        blank=True,
        verbose_name='Clave de sesión'
    )
    creado = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    actualizado = models.DateTimeField(auto_now=True, verbose_name='Actualizado')
    
    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'
        
    def __str__(self):
        if self.usuario:
            return f"Carrito de {self.usuario.email}"
        return f"Carrito anónimo {self.session_key}"
    
    @property
    def total_items(self):
        """Retorna el total de items en el carrito"""
        return sum(item.cantidad for item in self.items.all())
    
    @property
    def total_precio(self):
        """Retorna el precio total del carrito"""
        return sum(item.get_total_precio() for item in self.items.all())
    
    def limpiar(self):
        """Limpia todos los items del carrito"""
        self.items.all().delete()
    
    def get_total_price(self):
        """Método para compatibilidad con el script de prueba"""
        return self.total_precio
    
    def get_total_items(self):
        """Método para compatibilidad con el script de prueba"""
        return self.total_items


class CarritoItem(models.Model):
    """
    Modelo para los items individuales del carrito
    """
    carrito = models.ForeignKey(
        Carrito, 
        on_delete=models.CASCADE, 
        related_name='items',
        verbose_name='Carrito'
    )
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE,
        verbose_name='Producto'
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    precio_unitario = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name='Precio unitario'
    )
    creado = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    actualizado = models.DateTimeField(auto_now=True, verbose_name='Actualizado')
    
    class Meta:
        verbose_name = 'Item del carrito'
        verbose_name_plural = 'Items del carrito'
        unique_together = ('carrito', 'producto')
        
    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"
    
    def save(self, *args, **kwargs):
        # Guardar el precio actual del producto al agregar al carrito
        if not self.precio_unitario:
            self.precio_unitario = self.producto.get_precio_final
        super().save(*args, **kwargs)
    
    def get_total_precio(self):
        """Retorna el precio total de este item"""
        return self.precio_unitario * self.cantidad
    
    @property
    def total_precio(self):
        """Property para acceder al precio total"""
        return self.get_total_precio()
