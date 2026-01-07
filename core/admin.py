from django.contrib import admin

from .models import SiteSettings, Translation


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ('source_text_preview', 'source_lang', 'target_lang', 'translated_text_preview', 'created_at')
    list_filter = ('source_lang', 'target_lang', 'created_at')
    search_fields = ('source_text', 'translated_text')
    readonly_fields = ('created_at', 'updated_at')
    
    def source_text_preview(self, obj):
        return obj.source_text[:100] + '...' if len(obj.source_text) > 100 else obj.source_text
    source_text_preview.short_description = 'Texto original'
    
    def translated_text_preview(self, obj):
        return obj.translated_text[:100] + '...' if len(obj.translated_text) > 100 else obj.translated_text
    translated_text_preview.short_description = 'Traducción'


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'vacation_enabled',
        'vacation_from',
        'vacation_until',
        'reopen_date',
    )

    def has_add_permission(self, request):
        if SiteSettings.objects.exists():
            return False
        return super().has_add_permission(request)
