from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.conf import settings
from .utils import optimize_image


class TipoFlor(models.Model):
    """Modelo para los tipos de flores"""
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Tipo de Flor'
        verbose_name_plural = 'Tipos de Flores'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Ocasion(models.Model):
    """Modelo para las ocasiones"""
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Ocasión'
        verbose_name_plural = 'Ocasiones'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ZonaEntrega(models.Model):
    """Modelo para las zonas de entrega"""
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    costo_envio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Costo de envío'
    )
    envio_gratis_desde = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Envío gratis desde'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Zona de Entrega'
        verbose_name_plural = 'Zonas de Entrega'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


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
    # Nuevos campos para FloreriaPalermo
    tipo_flor = models.ForeignKey(
        TipoFlor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos',
        verbose_name='Tipo de Flor'
    )
    ocasiones = models.ManyToManyField(
        Ocasion,
        blank=True,
        related_name='productos',
        verbose_name='Ocasiones'
    )
    envio_gratis = models.BooleanField(default=False, verbose_name='Envío Gratis')
    es_adicional = models.BooleanField(default=False, verbose_name='Es Adicional')
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
    
    @property
    def precio_formateado(self):
        """Devuelve el precio formateado en pesos argentinos"""
        precio = self.get_precio_final
        return f"$ {precio:,.0f}".replace(',', '.')


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
        # Optimizar imagen antes de guardar
        if self.imagen and not self.pk:  # Solo en creación, no en actualización
            self.imagen = optimize_image(
                self.imagen,
                max_width=1200,
                max_height=1200,
                quality=90  # Alta calidad para productos
            )
        
        # Si se marca como imagen principal, desmarcar las demás
        if self.is_primary:
            ProductoImagen.objects.filter(producto=self.producto).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class HeroSlide(models.Model):
    """Modelo para los slides del carrusel Hero de la página principal"""
    TIPO_MEDIA = [
        ('imagen', 'Imagen'),
        ('video', 'Video'),
    ]
    
    titulo = models.CharField(max_length=200, verbose_name='Título')
    subtitulo = models.CharField(max_length=200, verbose_name='Subtítulo')
    tipo_media = models.CharField(max_length=10, choices=TIPO_MEDIA, default='imagen', verbose_name='Tipo de contenido')
    imagen = models.ImageField(upload_to='hero/%Y/%m/', blank=True, null=True, verbose_name='Imagen')
    video = models.FileField(upload_to='hero/videos/%Y/%m/', blank=True, null=True, verbose_name='Video (archivo)', help_text='RECOMENDADO: Sube tu video en formato MP4. Máx 100MB. El autoplay funcionará perfectamente.')
    video_url = models.URLField(blank=True, null=True, verbose_name='URL del video (YouTube)', help_text='⚠️ NO RECOMENDADO: YouTube bloquea autoplay. Solo usar si subes el archivo no funciona.')
    texto_boton = models.CharField(max_length=50, blank=True, verbose_name='Texto del botón')
    enlace_boton = models.CharField(max_length=200, default='/productos', verbose_name='Enlace del botón')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado el')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado el')

    class Meta:
        verbose_name = 'Slide del Hero'
        verbose_name_plural = 'Slides del Hero'
        ordering = ['orden', 'created_at']

    def __str__(self):
        tipo = '📹' if self.tipo_media == 'video' else '🖼️'
        return f"{tipo} {self.titulo} - {self.subtitulo}"

    def save(self, *args, **kwargs):
        # Optimizar imagen antes de guardar (solo si es imagen y es nueva)
        try:
            if self.tipo_media == 'imagen' and self.imagen and not self.pk:
                self.imagen = optimize_image(
                    self.imagen,
                    max_width=1920,
                    max_height=1080,
                    quality=85
                )
        except Exception as e:
            # Si falla la optimización, continuar sin optimizar
            print(f"⚠️ Error optimizando imagen: {e}")
        
        super().save(*args, **kwargs)
