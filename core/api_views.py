from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import SiteSettings


@require_GET
def site_settings(request):
    settings_obj = SiteSettings.get_solo()

    return JsonResponse(
        {
            'vacation_enabled': settings_obj.vacation_enabled,
            'vacation_from': settings_obj.vacation_from.isoformat() if settings_obj.vacation_from else None,
            'vacation_until': settings_obj.vacation_until.isoformat() if settings_obj.vacation_until else None,
            'reopen_date': settings_obj.reopen_date.isoformat() if settings_obj.reopen_date else None,
            'vacation_message': settings_obj.vacation_message,
            'vacation_active': settings_obj.is_vacation_active(),
            'min_delivery_date': settings_obj.min_delivery_date().isoformat() if settings_obj.min_delivery_date() else None,
        }
    )
