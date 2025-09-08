"""
Context processor para el admin de Django con estadísticas de Florería Cristina
"""

from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date


def admin_stats(request):
    """
    Proporciona estadísticas para el dashboard del admin
    """
    if not request.path.startswith('/admin/'):
        return {}
    
    try:
        # Importar modelos dinámicamente para evitar errores de importación circular
        from catalogo.models import Producto
        from pedidos.models import Pedido
        from notificaciones.models import Notificacion
        
        # Contar productos activos
        productos_count = Producto.objects.filter(is_active=True).count()
        
        # Contar pedidos de hoy
        hoy = date.today()
        pedidos_hoy = Pedido.objects.filter(creado__date=hoy).count()
        
        # Contar usuarios registrados
        usuarios_count = User.objects.filter(is_active=True).count()
        
        # Contar notificaciones enviadas
        notificaciones_count = Notificacion.objects.filter(
            estado='enviada'
        ).count()
        
        return {
            'productos_count': productos_count,
            'pedidos_hoy': pedidos_hoy,
            'usuarios_count': usuarios_count,
            'notificaciones_count': notificaciones_count,
        }
        
    except Exception as e:
        # En caso de error, devolver valores por defecto
        return {
            'productos_count': 0,
            'pedidos_hoy': 0,
            'usuarios_count': 0,
            'notificaciones_count': 0,
        }
