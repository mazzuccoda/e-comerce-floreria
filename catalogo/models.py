from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.conf import settings


class Categoria(models.Model):
    """Modelo para las categorías de productos"""
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    imagen = models.ImageField(upload_to='categorias/', blank=True, null=True, verbose_name='Imagen')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('catalogo:categoria', kwargs={'slug': self.slug})


class Producto(models.Model):
    """Modelo para los productos"""
    TIPO_PRODUCTO = (
        ('ramo', 'Ramo'),
        ('planta', 'Planta'),
        ('arreglo', 'Arreglo Floral'),
        ('otro', 'Otro'),
    )

    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    descripcion = models.TextField(verbose_name='Descripción')
    descripcion_corta = models.CharField(max_length=255, blank=True, verbose_name='Descripción corta')
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos',
        verbose_name='Categoría'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_PRODUCTO,
        default='otro',
        verbose_name='Tipo de producto'
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Precio'
    )
    precio_descuento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Precio con descuento'
    )
    porcentaje_descuento = models.PositiveIntegerField(
        default=0,
        verbose_name='% de descuento'
    )
    sku = models.CharField(max_length=50, unique=True, verbose_name='SKU')
    stock = models.PositiveIntegerField(default=0, verbose_name='Stock disponible')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_featured = models.BooleanField(default=False, verbose_name='Destacado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['id', 'slug']),
            models.Index(fields=['nombre']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.nombre}-{self.sku}")
        
        # Calcular precio con descuento si hay un porcentaje de descuento
        if self.porcentaje_descuento > 0:
            self.precio_descuento = self.precio * (100 - self.porcentaje_descuento) / 100
        else:
            self.precio_descuento = None
            
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('catalogo:detalle_producto', kwargs={'slug': self.slug})

    @property
    def tiene_descuento(self):
        return self.porcentaje_descuento > 0

    @property
    def get_precio_final(self):
        return self.precio_descuento if self.tiene_descuento else self.precio

    @property
    def get_primary_image_url(self):
        """Devuelve la URL de la imagen principal o un placeholder."""
        primary = self.imagenes.filter(is_primary=True).first()
        if primary:
            return primary.imagen.url
        first = self.imagenes.first()
        if first:
            return first.imagen.url
        # Placeholder externo si no hay imagen
        return "https://via.placeholder.com/400x300?text=Sin+Imagen"


class ProductoImagen(models.Model):
    """Modelo para las imágenes de los productos"""
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='imagenes',
        verbose_name='Producto'
    )
    imagen = models.ImageField(upload_to='productos/%Y/%m/%d/', verbose_name='Imagen')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    is_primary = models.BooleanField(default=False, verbose_name='Imagen principal')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')

    class Meta:
        verbose_name = 'Imagen de producto'
        verbose_name_plural = 'Imágenes de productos'
        ordering = ['orden', 'created_at']

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"

    def save(self, *args, **kwargs):
        # Si se marca como imagen principal, desmarcar las demás
        if self.is_primary:
            ProductoImagen.objects.filter(producto=self.producto).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
