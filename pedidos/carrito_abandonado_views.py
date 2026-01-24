"""
Vistas para gestión de carritos abandonados
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import json
import logging

from .models import CarritoAbandonado

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def registrar_carrito_abandonado(request):
    """
    Registrar cuando un usuario abandona el checkout
    
    POST /api/pedidos/carrito-abandonado
    {
        "telefono": "3813671352",
        "email": "cliente@example.com",
        "nombre": "Juan Pérez",
        "items": [
            {"nombre": "Ramo de Rosas", "cantidad": 1, "precio": "15000"}
        ],
        "total": "15000"
    }
    """
    try:
        data = json.loads(request.body)
        
        # Validar teléfono
        telefono = data.get('telefono', '').strip()
        if not telefono:
            return JsonResponse({'error': 'Teléfono requerido'}, status=400)
        
        # Validar items
        items = data.get('items', [])
        if not items:
            return JsonResponse({'error': 'Carrito vacío'}, status=400)
        
        # Crear registro
        carrito = CarritoAbandonado.objects.create(
            telefono=telefono,
            email=data.get('email'),
            nombre=data.get('nombre'),
            items=items,
            total=data.get('total', 0),
            session_id=request.session.session_key if hasattr(request, 'session') else None
        )
        
        logger.info(f"🛒 Carrito abandonado registrado: {carrito.id} - {telefono} - ${carrito.total}")
        
        return JsonResponse({
            'success': True,
            'carrito_id': carrito.id,
            'mensaje': 'Carrito registrado para seguimiento'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        logger.error(f"❌ Error registrando carrito abandonado: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def listar_carritos_pendientes(request):
    """
    Listar carritos abandonados que necesitan recordatorio
    
    GET /api/pedidos/carritos-pendientes?horas=1
    
    Response:
    [
        {
            "id": 123,
            "telefono": "3813671352",
            "nombre": "Juan Pérez",
            "email": "cliente@example.com",
            "total": "15000.00",
            "items": [...],
            "creado": "2026-01-22T16:00:00Z"
        }
    ]
    """
    # Verificar autenticación (API Key para n8n)
    api_key = request.headers.get('X-API-Key')
    expected_key = getattr(settings, 'N8N_API_KEY', None)
    
    if not expected_key or api_key != expected_key:
        logger.warning(f"⚠️ Intento de acceso no autorizado a carritos pendientes")
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Parámetros
    horas = int(request.GET.get('horas', 0))
    telefono = request.GET.get('telefono', None)
    cutoff_time = timezone.now() - timedelta(hours=horas)
    
    # Buscar carritos pendientes
    query = CarritoAbandonado.objects.filter(
        recordatorio_enviado=False,
        recuperado=False,
        creado__lte=cutoff_time
    )
    
    # Filtrar por teléfono si se proporciona
    if telefono:
        query = query.filter(telefono=telefono)
    
    carritos = query.order_by('-creado').values(
        'id', 'telefono', 'nombre', 'email', 'total', 'items', 'creado'
    )
    
    carritos_list = list(carritos)
    logger.info(f"📋 Listando {len(carritos_list)} carritos pendientes (>{horas}h)")
    
    return JsonResponse(carritos_list, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def marcar_recordatorio_enviado(request, carrito_id):
    """
    Marcar que se envió el recordatorio
    
    POST /api/pedidos/carrito-abandonado/{id}/recordatorio-enviado
    """
    # Verificar autenticación
    api_key = request.headers.get('X-API-Key')
    expected_key = getattr(settings, 'N8N_API_KEY', None)
    
    if not expected_key or api_key != expected_key:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    try:
        carrito = CarritoAbandonado.objects.get(id=carrito_id)
        carrito.marcar_recordatorio_enviado()
        
        logger.info(f"✅ Recordatorio marcado como enviado: carrito {carrito_id}")
        
        return JsonResponse({
            'success': True,
            'carrito_id': carrito.id,
            'recordatorio_enviado_at': carrito.recordatorio_enviado_at.isoformat() if carrito.recordatorio_enviado_at else None
        })
    except CarritoAbandonado.DoesNotExist:
        return JsonResponse({'error': 'Carrito no encontrado'}, status=404)
    except Exception as e:
        logger.error(f"❌ Error marcando recordatorio: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def marcar_carrito_recuperado(request, carrito_id):
    """
    Marcar que el carrito fue recuperado (se completó la compra)
    
    POST /api/pedidos/carrito-abandonado/{id}/recuperado
    {
        "pedido_id": 123
    }
    """
    try:
        data = json.loads(request.body)
        pedido_id = data.get('pedido_id')
        
        carrito = CarritoAbandonado.objects.get(id=carrito_id)
        
        if pedido_id:
            from .models import Pedido
            try:
                pedido = Pedido.objects.get(id=pedido_id)
                carrito.marcar_recuperado(pedido)
            except Pedido.DoesNotExist:
                carrito.marcar_recuperado(None)
        else:
            carrito.marcar_recuperado(None)
        
        logger.info(f"✅ Carrito {carrito_id} marcado como recuperado")
        
        return JsonResponse({
            'success': True,
            'carrito_id': carrito.id,
            'recuperado': True
        })
    except CarritoAbandonado.DoesNotExist:
        return JsonResponse({'error': 'Carrito no encontrado'}, status=404)
    except Exception as e:
        logger.error(f"❌ Error marcando carrito recuperado: {e}")
        return JsonResponse({'error': str(e)}, status=500)
