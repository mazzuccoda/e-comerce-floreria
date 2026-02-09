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
    list_display = ('nombre', 'categoria', 'tipo_flor', 'precio', 'stock', 'is_active', 'is_featured', 'publicar_en_redes', 'fecha_ultima_publicacion')
    list_filter = ('is_active', 'is_featured', 'publicar_en_redes', 'categoria', 'tipo_flor', 'tipo', 'ocasiones', 'created_at')
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
        ('Redes Sociales', {
            'fields': ('publicar_en_redes', 'fecha_ultima_publicacion'),
            'description': 'Marcar "Publicar en Redes Sociales" para incluir este producto en las publicaciones automáticas de Facebook/Instagram'
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
    list_display = ('titulo', 'subtitulo', 'tipo_media', 'orden', 'is_active', 'created_at')
    list_filter = ('is_active', 'tipo_media', 'created_at')
    search_fields = ('titulo', 'subtitulo')
    list_editable = ('orden', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Contenido', {
            'fields': ('titulo', 'subtitulo', 'texto_boton', 'enlace_boton')
        }),
        ('Media', {
            'fields': ('tipo_media', 'imagen', 'video', 'video_url'),
            'description': '''
            📸 IMÁGENES: Sube una imagen JPG/PNG
            
            🎬 VIDEOS: 
            Opción 1 (Recomendado): Sube el video manualmente a Cloudinary y pega la URL aquí
            Opción 2: Sube el archivo MP4 directamente (máx 100MB)
            
            Ejemplo de URL de Cloudinary:
            https://res.cloudinary.com/tu-cloud/video/upload/v123456/video.mp4
            '''
        }),
        ('Configuración', {
            'fields': ('orden', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Agregar media_preview solo cuando el objeto ya existe"""
        if obj:  # Si el objeto ya existe
            return self.readonly_fields + ('media_preview',)
        return self.readonly_fields
    
    def get_fieldsets(self, request, obj=None):
        """Agregar media_preview al fieldset solo cuando el objeto ya existe"""
        fieldsets = super().get_fieldsets(request, obj)
        if obj:  # Si el objeto ya existe, agregar vista previa
            fieldsets = list(fieldsets)
            # Agregar media_preview al fieldset de Media
            media_fieldset = list(fieldsets[1])
            media_fields = list(media_fieldset[1]['fields'])
            if 'media_preview' not in media_fields:
                media_fields.append('media_preview')
            media_fieldset[1]['fields'] = tuple(media_fields)
            fieldsets[1] = tuple(media_fieldset)
            return tuple(fieldsets)
        return fieldsets

    def media_preview(self, obj):
        if not obj.pk:
            return "(Guarda primero para ver la vista previa)"
        
        if obj.tipo_media == 'video':
            if obj.video:
                try:
                    return format_html(
                        '<video controls style="max-width: 600px; height: auto;"><source src="{}" type="video/mp4">Tu navegador no soporta video.</video>',
                        obj.video.url
                    )
                except:
                    return "(Error al cargar video)"
            elif obj.video_url:
                return format_html(
                    '<p>🔗 Video externo: <a href="{}" target="_blank">{}</a></p>',
                    obj.video_url, obj.video_url
                )
            return "(No hay video)"
        else:
            if obj.imagen:
                try:
                    return format_html(
                        '<img src="{}" style="max-width: 600px; height: auto;" />',
                        obj.imagen.url
                    )
                except:
                    return "(Error al cargar imagen)"
            return "(No hay imagen)"
    media_preview.short_description = 'Vista previa'

    def media_preview_small(self, obj):
        if not obj.pk:
            return "💾"
        
        if obj.tipo_media == 'video':
            return format_html('<span style="font-size: 24px;">📹</span>')
        else:
            if obj.imagen:
                try:
                    return format_html(
                        '<img src="{}" style="max-height: 50px; max-width: 80px; object-fit: cover;" />',
                        obj.imagen.url
                    )
                except:
                    return "🖼️"
            return "🖼️"
    media_preview_small.short_description = 'Media'
