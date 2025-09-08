from django.contrib import admin
from .models import Carrito, CarritoItem


class CarritoItemInline(admin.TabularInline):
    model = CarritoItem
    extra = 0
    readonly_fields = ['precio_unitario', 'total_precio', 'creado', 'actualizado']


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'session_key', 'total_items', 'total_precio', 'creado']
    list_filter = ['creado', 'actualizado']
    search_fields = ['usuario__email', 'session_key']
    readonly_fields = ['creado', 'actualizado', 'total_items', 'total_precio']
    inlines = [CarritoItemInline]
    
    def total_items(self, obj):
        return obj.total_items
    total_items.short_description = 'Total Items'
    
    def total_precio(self, obj):
        return f"${obj.total_precio:,.2f}"
    total_precio.short_description = 'Total Precio'


@admin.register(CarritoItem)
class CarritoItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'carrito', 'producto', 'cantidad', 'precio_unitario', 'total_precio', 'creado']
    list_filter = ['creado', 'actualizado']
    search_fields = ['producto__nombre', 'carrito__usuario__email']
    readonly_fields = ['precio_unitario', 'total_precio', 'creado', 'actualizado']
