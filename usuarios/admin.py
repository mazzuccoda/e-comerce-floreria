from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import PerfilUsuario, PasswordResetToken


class PerfilUsuarioInline(admin.StackedInline):
    """Inline para mostrar el perfil en el admin de usuario"""
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = 'Perfil'


class UsuarioAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo Usuario con perfil"""
    inlines = (PerfilUsuarioInline,)
    list_display = ['username', 'email', 'first_name', 'last_name', 'get_telefono', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_telefono(self, obj):
        return obj.perfil.telefono if hasattr(obj, 'perfil') else ''
    get_telefono.short_description = 'Teléfono'


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UsuarioAdmin)


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    """Admin para el perfil de usuario"""
    list_display = ['user', 'telefono', 'ciudad', 'recibir_ofertas', 'created_at']
    list_filter = ['recibir_ofertas', 'ciudad', 'created_at']
    search_fields = ['user__username', 'user__email', 'telefono', 'ciudad']
    ordering = ['-created_at']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin para tokens de recuperación de contraseña"""
    list_display = ['user', 'token_preview', 'created_at', 'expires_at', 'used', 'is_valid_status']
    list_filter = ['used', 'created_at', 'expires_at']
    search_fields = ['user__username', 'user__email', 'token']
    readonly_fields = ['token', 'created_at', 'used_at']
    ordering = ['-created_at']
    
    def token_preview(self, obj):
        return f"{obj.token[:20]}..." if len(obj.token) > 20 else obj.token
    token_preview.short_description = 'Token'
    
    def is_valid_status(self, obj):
        return '✅ Válido' if obj.is_valid() else '❌ Inválido'
    is_valid_status.short_description = 'Estado'
