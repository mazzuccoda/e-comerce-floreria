from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Producto, ProductoImagen, TipoFlor, Ocasion, ZonaEntrega, HeroSlide


class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1
    readonly_fields = ['imagen_preview']
    fields = ('imagen', 'imagen_preview', 'orden', 'is_primary')

    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;" />',
                obj.imagen.url
            )
        return "(No hay imagen)"
    imagen_preview.short_description = 'Vista previa'


@admin.register(TipoFlor)
class TipoFlorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'descripcion', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Ocasion)
class OcasionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'descripcion', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ZonaEntrega)
class ZonaEntregaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'costo_envio', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'descripcion', 'costo_envio', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('nombre', 'descripcion')
    prepopulated_fields = {'slug': ('nombre',)}
    readonly_fields = ('imagen_preview', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'slug', 'descripcion', 'is_active')
        }),
        ('Imagen', {
            'fields': ('imagen', 'imagen_preview'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.imagen.url
            )
        return "(No hay imagen)"
    imagen_preview.short_description = 'Vista previa'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'tipo_flor', 'precio', 'stock', 'is_active', 'is_featured')
    list_filter = ('is_active', 'is_featured', 'categoria', 'tipo_flor', 'tipo', 'ocasiones', 'created_at')
    search_fields = ('nombre', 'descripcion', 'sku')
    prepopulated_fields = {'slug': ('nombre', 'sku')}
    readonly_fields = ('created_at', 'updated_at', 'imagen_preview')
    inlines = [ProductoImagenInline]
    filter_horizontal = ('ocasiones',)
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'slug', 'sku', 'descripcion', 'descripcion_corta')
        }),
        ('Precio y Stock', {
            'fields': ('precio', 'porcentaje_descuento', 'precio_descuento', 'stock')
        }),
        ('Clasificación', {
            'fields': ('categoria', 'tipo', 'tipo_flor', 'ocasiones')
        }),
        ('Opciones Especiales', {
            'fields': ('envio_gratis', 'es_adicional')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def imagen_preview(self, obj):
        imagen_principal = obj.imagenes.filter(is_primary=True).first()
        if imagen_principal:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                imagen_principal.imagen.url
            )
        return "(No hay imagen principal)"
    imagen_preview.short_description = 'Imagen principal'


@admin.register(ProductoImagen)
class ProductoImagenAdmin(admin.ModelAdmin):
    list_display = ('producto', 'imagen_preview', 'orden', 'is_primary')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('producto__nombre',)
    readonly_fields = ('imagen_preview', 'created_at')
    list_editable = ('orden', 'is_primary')

    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.imagen.url
            )
        return "(No hay imagen)"
    imagen_preview.short_description = 'Vista previa'


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo_media', 'subtitulo', 'orden', 'is_active', 'media_preview_small', 'created_at')
    list_filter = ('is_active', 'tipo_media', 'created_at')
    search_fields = ('titulo', 'subtitulo')
    list_editable = ('orden', 'is_active')
    readonly_fields = ('media_preview', 'created_at', 'updated_at')
    fieldsets = (
        ('Contenido', {
            'fields': ('titulo', 'subtitulo', 'texto_boton', 'enlace_boton')
        }),
        ('Media', {
            'fields': ('tipo_media', 'imagen', 'video', 'video_url', 'media_preview'),
            'description': 'Selecciona el tipo de contenido y sube la imagen o video correspondiente. Para videos, puedes subir un archivo o usar una URL externa.'
        }),
        ('Configuración', {
            'fields': ('orden', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def media_preview(self, obj):
        if obj.tipo_media == 'video':
            if obj.video:
                return format_html(
                    '<video controls style="max-width: 600px; height: auto;"><source src="{}" type="video/mp4">Tu navegador no soporta video.</video>',
                    obj.video.url
                )
            elif obj.video_url:
                return format_html(
                    '<p>🔗 Video externo: <a href="{}" target="_blank">{}</a></p>',
                    obj.video_url, obj.video_url
                )
            return "(No hay video)"
        else:
            if obj.imagen:
                return format_html(
                    '<img src="{}" style="max-width: 600px; height: auto;" />',
                    obj.imagen.url
                )
            return "(No hay imagen)"
    media_preview.short_description = 'Vista previa'

    def media_preview_small(self, obj):
        if obj.tipo_media == 'video':
            return format_html('<span style="font-size: 24px;">📹</span>')
        else:
            if obj.imagen:
                return format_html(
                    '<img src="{}" style="max-height: 50px; max-width: 80px; object-fit: cover;" />',
                    obj.imagen.url
                )
            return "🖼️"
    media_preview_small.short_description = 'Media'
