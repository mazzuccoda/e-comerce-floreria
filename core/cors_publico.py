"""CORS abierto sólo para `/api/publico/`.

`CORS_ALLOWED_ORIGINS` es una lista cerrada porque el frontend manda cookies de
sesión. La API pública no tiene sesión ni usuario, y un agente de IA que corre
dentro de un navegador (o en un sandbox con `fetch`) necesita que cualquier
origen pueda leerla: sin estas cabeceras el navegador descarta la respuesta y el
agente ve un error de red, no un 403.

No se manda `Access-Control-Allow-Credentials`: estos endpoints no leen cookies.
"""

from django.http import HttpResponse

PREFIJO = '/api/publico/'

METODOS = 'GET, POST, OPTIONS'
CABECERAS = 'Content-Type, Accept, Idempotency-Key, X-Agent-Name'
MAX_AGE = '86400'


def _publico(path: str) -> bool:
    return path.startswith(PREFIJO)


class CorsApiPublicaMiddleware:
    """Responde el preflight y agrega las cabeceras CORS de la API pública."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not _publico(request.path):
            return self.get_response(request)

        if request.method == 'OPTIONS':
            respuesta = HttpResponse(status=204)
        else:
            respuesta = self.get_response(request)

        respuesta['Access-Control-Allow-Origin'] = '*'
        respuesta['Access-Control-Allow-Methods'] = METODOS
        respuesta['Access-Control-Allow-Headers'] = CABECERAS
        respuesta['Access-Control-Max-Age'] = MAX_AGE
        return respuesta
