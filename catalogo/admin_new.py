from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Producto, ProductoImagen, TipoFlor, Ocasion, ZonaEntrega


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
    list_display = ('nombre', 'categoria', 'precio', 'stock', 'is_active', 'is_featured')
    list_filter = ('is_active', 'is_featured', 'categoria', 'tipo', 'created_at')
    search_fields = ('nombre', 'descripcion', 'sku')
    prepopulated_fields = {'slug': ('nombre', 'sku')}
    readonly_fields = ('created_at', 'updated_at', 'imagen_preview')
    inlines = [ProductoImagenInline]
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'slug', 'sku', 'descripcion', 'descripcion_corta')
        }),
        ('Precio y Stock', {
            'fields': ('precio', 'porcentaje_descuento', 'precio_descuento', 'stock')
        }),
        ('Clasificación', {
            'fields': ('categoria', 'tipo')
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
