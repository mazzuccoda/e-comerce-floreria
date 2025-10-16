from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

@login_required
def test_simple(request):
    """Vista de prueba simple"""
    return HttpResponse(f"""
        <h1>Test Admin Simple</h1>
        <p>Usuario: {request.user.username}</p>
        <p>Es superusuario: {request.user.is_superuser}</p>
        <p>Está autenticado: {request.user.is_authenticated}</p>
    """)
