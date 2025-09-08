import re
from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings


class CustomCsrfMiddleware(CsrfViewMiddleware):
    """
    Middleware personalizado para eximir ciertas URLs del CSRF
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Obtener las URLs exentas de CSRF desde settings
        exempt_urls = getattr(settings, 'CSRF_EXEMPT_URLS', [])
        
        # Verificar si la URL actual está en la lista de exenciones
        path = request.path_info
        for pattern in exempt_urls:
            if re.search(pattern, path):
                # Marcar la vista como exenta de CSRF
                setattr(callback, 'csrf_exempt', True)
                return None
        
        # Si no está exenta, aplicar el middleware CSRF normal
        return super().process_view(request, callback, callback_args, callback_kwargs)
