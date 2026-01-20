from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods, require_POST
from django.http import JsonResponse, HttpResponse
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.core.paginator import Paginator
from django.contrib import messages
from datetime import timedelta
import logging
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import requests

from pedidos.models import Pedido
from catalogo.models import Producto, Categoria, ProductoImagen
from django.utils.text import slugify
import uuid

logger = logging.getLogger(__name__)


def is_superuser(user):
    """Verificar que el usuario sea superusuario"""
    return user.is_authenticated and user.is_superuser


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def dashboard(request):
    """
    Dashboard principal con estadísticas y actividad reciente
    """
    try:
        # Estadísticas de productos
        total_productos = Producto.objects.count()
        productos_activos = Producto.objects.filter(is_active=True).count()
        productos_stock_bajo = Producto.objects.filter(stock__lt=5, stock__gt=0).count()
        productos_sin_stock = Producto.objects.filter(stock=0).count()
        
        # Pedidos pendientes
        pedidos_pendientes = Pedido.objects.filter(estado='pendiente').count()
        
        # Actividad reciente (últimos 5 eventos)
        actividad_reciente = []
        
        # Últimos pedidos
        ultimos_pedidos = Pedido.objects.select_related('cliente').order_by('-creado')[:3]
        for pedido in ultimos_pedidos:
            tiempo = timezone.now() - pedido.creado
            if tiempo.seconds < 3600:
                tiempo_str = f"Hace {tiempo.seconds // 60} minutos"
            elif tiempo.seconds < 86400:
                tiempo_str = f"Hace {tiempo.seconds // 3600} horas"
            else:
                tiempo_str = f"Hace {tiempo.days} días"
            
            actividad_reciente.append({
                'titulo': f'Nuevo pedido #{pedido.numero_pedido or pedido.id}',
                'descripcion': f'${pedido.total:,.0f} - {pedido.nombre_destinatario}',
                'tiempo': tiempo_str,
                'icono': 'shopping-cart',
                'color': 'blue'
            })
        
        # Productos con stock bajo
        productos_bajo_stock = Producto.objects.filter(stock__lt=5, stock__gt=0).order_by('stock')[:2]
        for producto in productos_bajo_stock:
            actividad_reciente.append({
                'titulo': f'Stock bajo: {producto.nombre}',
                'descripcion': f'Solo {producto.stock} unidades disponibles',
                'tiempo': 'Requiere atención',
                'icono': 'exclamation-triangle',
                'color': 'yellow'
            })
        
        context = {
            'total_productos': total_productos,
            'productos_activos': productos_activos,
            'productos_stock_bajo': productos_stock_bajo,
            'productos_sin_stock': productos_sin_stock,
            'pedidos_pendientes': pedidos_pendientes,
            'actividad_reciente': actividad_reciente[:5],  # Máximo 5 items
        }
        
        return render(request, 'admin_simple/dashboard.html', context)
    except Exception as e:
        logger.error(f'Error en dashboard: {str(e)}')
        from django.http import HttpResponse
        return HttpResponse(f"""
            <h1>Error en Dashboard</h1>
            <p>Error: {str(e)}</p>
            <p>Tipo: {type(e).__name__}</p>
            <a href="/admin/">Volver al Admin</a>
        """)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def productos_list(request):
    """
    Lista de productos con filtros y búsqueda
    """
    # Obtener parámetros de filtro
    filtro = request.GET.get('filtro', 'todos')
    buscar = request.GET.get('buscar', '')
    categoria_id = request.GET.get('categoria', '')
    orden = request.GET.get('orden', 'nombre')
    
    # Query base
    productos = Producto.objects.all()
    
    # Estadísticas para los chips
    stats = {
        'total': Producto.objects.count(),
        'activos': Producto.objects.filter(is_active=True).count(),
        'inactivos': Producto.objects.filter(is_active=False).count(),
        'stock_bajo': Producto.objects.filter(stock__lt=5, stock__gt=0).count(),
        'destacados': Producto.objects.filter(is_featured=True).count(),
    }
    
    # Aplicar filtros
    if filtro == 'activos':
        productos = productos.filter(is_active=True)
    elif filtro == 'inactivos':
        productos = productos.filter(is_active=False)
    elif filtro == 'stock_bajo':
        productos = productos.filter(stock__lt=5, stock__gt=0)
    elif filtro == 'sin_stock':
        productos = productos.filter(stock=0)
    elif filtro == 'destacados':
        productos = productos.filter(is_featured=True)
    
    # Buscar por nombre
    if buscar:
        productos = productos.filter(
            Q(nombre__icontains=buscar) | 
            Q(descripcion_corta__icontains=buscar)
        )
    
    # Filtrar por categoría
    if categoria_id:
        productos = productos.filter(categoria_id=categoria_id)
    
    # Ordenar
    if orden == 'nombre':
        productos = productos.order_by('nombre')
    elif orden == '-nombre':
        productos = productos.order_by('-nombre')
    elif orden == 'precio':
        productos = productos.order_by('precio')
    elif orden == '-precio':
        productos = productos.order_by('-precio')
    elif orden == 'stock':
        productos = productos.order_by('stock')
    elif orden == '-stock':
        productos = productos.order_by('-stock')
    
    # Paginación
    paginator = Paginator(productos, 20)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # Categorías para el filtro
    categorias = Categoria.objects.all()
    
    context = {
        'page_obj': page_obj,
        'categorias': categorias,
        'filtro_actual': filtro,
        'buscar_actual': buscar,
        'categoria_actual': categoria_id,
        'orden_actual': orden,
        'stats': stats,
    }
    
    return render(request, 'admin_simple/productos_list.html', context)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def producto_create(request):
    """
    Crear un nuevo producto
    """
    if request.method == 'POST':
        try:
            # Generar SKU único
            sku = f"PROD-{uuid.uuid4().hex[:8].upper()}"
            while Producto.objects.filter(sku=sku).exists():
                sku = f"PROD-{uuid.uuid4().hex[:8].upper()}"
            
            # Crear producto
            producto = Producto()
            producto.nombre = request.POST.get('nombre')
            producto.sku = sku
            
            # Descripción
            producto.descripcion_corta = request.POST.get('descripcion_corta', '')
            producto.descripcion = request.POST.get('descripcion', producto.descripcion_corta)
            
            # Categoría
            categoria_id = request.POST.get('categoria')
            if categoria_id:
                producto.categoria_id = int(categoria_id)
            
            # Precio y stock
            precio_str = request.POST.get('precio', '0')
            precio_str = precio_str.replace('.', '').replace(',', '.')
            producto.precio = float(precio_str)
            
            stock_str = request.POST.get('stock', '10')
            stock_str = stock_str.replace('.', '').replace(',', '')
            producto.stock = int(stock_str)
            
            # Estado
            producto.is_active = request.POST.get('is_active') == 'on'
            
            # Validaciones
            if not producto.nombre:
                messages.error(request, 'El nombre es obligatorio')
                categorias = Categoria.objects.filter(is_active=True)
                return render(request, 'admin_simple/producto_create.html', {
                    'categorias': categorias,
                    'form_data': request.POST
                })
            
            if producto.precio <= 0:
                messages.error(request, 'El precio debe ser mayor a 0')
                categorias = Categoria.objects.filter(is_active=True)
                return render(request, 'admin_simple/producto_create.html', {
                    'categorias': categorias,
                    'form_data': request.POST
                })
            
            if producto.stock < 0:
                messages.error(request, 'El stock no puede ser negativo')
                categorias = Categoria.objects.filter(is_active=True)
                return render(request, 'admin_simple/producto_create.html', {
                    'categorias': categorias,
                    'form_data': request.POST
                })
            
            # Guardar producto
            producto.save()
            
            # Manejar múltiples imágenes si se subieron
            imagenes = request.FILES.getlist('imagenes')
            if imagenes:
                for index, imagen_file in enumerate(imagenes):
                    imagen = ProductoImagen()
                    imagen.producto = producto
                    imagen.imagen = imagen_file
                    imagen.is_primary = (index == 0)  # La primera imagen es la principal
                    imagen.orden = index
                    imagen.save()
                
                logger.info(f'Se subieron {len(imagenes)} imagen(es) para el producto {producto.id}')
            
            messages.success(request, f'Producto "{producto.nombre}" creado exitosamente con {len(imagenes)} imagen(es)')
            logger.info(f'Producto {producto.id} creado por {request.user.username}')
            
            return redirect('admin_simple:productos-list')
            
        except ValueError as e:
            messages.error(request, f'Error en los datos: {str(e)}. Verifica que precio y stock sean números válidos.')
            logger.error(f'Error creando producto: {str(e)}')
        except Exception as e:
            messages.error(request, f'Error inesperado: {str(e)}')
            logger.error(f'Error inesperado creando producto: {str(e)}')
    
    # GET request - mostrar formulario
    categorias = Categoria.objects.filter(is_active=True)
    context = {
        'categorias': categorias,
    }
    
    return render(request, 'admin_simple/producto_create.html', context)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def producto_edit(request, pk):
    """
    Editar un producto
    """
    producto = get_object_or_404(Producto, pk=pk)
    
    if request.method == 'POST':
        try:
            # Actualizar campos
            producto.nombre = request.POST.get('nombre')
            producto.descripcion_corta = request.POST.get('descripcion_corta', '')
            producto.descripcion = request.POST.get('descripcion', '')
            
            # Actualizar categoría
            categoria_id = request.POST.get('categoria')
            if categoria_id:
                producto.categoria_id = int(categoria_id)
            
            # Limpiar y convertir precio (remover comas y puntos de miles) solo si viene en el POST
            precio_str = request.POST.get('precio', None)
            if precio_str is not None and precio_str != '':
                # Remover puntos de miles y reemplazar coma decimal por punto
                precio_str = precio_str.replace('.', '').replace(',', '.')
                producto.precio = float(precio_str)
            
            # Limpiar y convertir stock solo si viene en el POST
            stock_str = request.POST.get('stock', None)
            if stock_str is not None and stock_str != '':
                stock_str = stock_str.replace('.', '').replace(',', '')
                producto.stock = int(stock_str)
            
            # Actualizar visibilidad solo si viene en el POST
            is_active_value = request.POST.get('is_active', None)
            if is_active_value is not None:
                producto.is_active = is_active_value == 'on'
            
            # Validaciones
            if producto.precio is None or producto.precio <= 0:
                messages.error(request, 'El precio debe ser mayor a 0')
                return render(request, 'admin_simple/producto_edit.html', {'producto': producto})
            
            if producto.stock is None or producto.stock < 0:
                messages.error(request, 'El stock no puede ser negativo')
                return render(request, 'admin_simple/producto_edit.html', {'producto': producto})
            
            producto.save()
            
            # Manejar subida de nuevas imágenes
            imagenes = request.FILES.getlist('imagenes')
            if imagenes:
                from catalogo.models import ProductoImagen
                imagenes_creadas = 0
                for imagen in imagenes:
                    # Validar tamaño (10MB máximo)
                    if imagen.size > 10 * 1024 * 1024:
                        messages.warning(request, f'Imagen {imagen.name} excede 10MB y fue omitida')
                        continue
                    
                    # Crear imagen del producto
                    ProductoImagen.objects.create(
                        producto=producto,
                        imagen=imagen,
                        is_primary=False  # La primera imagen existente sigue siendo primaria
                    )
                    imagenes_creadas += 1
                
                if imagenes_creadas > 0:
                    messages.success(request, f'{imagenes_creadas} imagen(es) agregada(s) exitosamente')
            
            messages.success(request, f'Producto "{producto.nombre}" actualizado exitosamente')
            logger.info(f'Producto {producto.id} actualizado por {request.user.username}')
            
            return redirect('admin_simple:producto-edit', pk=pk)
            
        except ValueError as e:
            messages.error(request, f'Error en los datos: {str(e)}. Verifica que precio y stock sean números válidos.')
            logger.error(f'Error actualizando producto {pk}: {str(e)}')
        except Exception as e:
            messages.error(request, f'Error inesperado: {str(e)}')
            logger.error(f'Error inesperado actualizando producto {pk}: {str(e)}')
    
    # Obtener todas las imágenes del producto
    imagenes = producto.imagenes.all().order_by('-is_primary', '-id')
    
    # Obtener todas las categorías activas
    categorias = Categoria.objects.filter(is_active=True).order_by('nombre')
    
    context = {
        'producto': producto,
        'imagenes': imagenes,
        'categorias': categorias,
    }
    
    return render(request, 'admin_simple/producto_edit.html', context)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_POST
def producto_toggle(request, pk):
    """
    Toggle disponibilidad de un producto (AJAX)
    """
    try:
        producto = get_object_or_404(Producto, pk=pk)
        producto.is_active = not producto.is_active
        producto.save()
        
        logger.info(f'Producto {producto.id} disponibilidad cambiada a {producto.is_active} por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'is_active': producto.is_active,
            'message': f'Producto {"activado" if producto.is_active else "desactivado"}'
        })
    except Exception as e:
        logger.error(f'Error toggling producto {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_POST
def producto_toggle_destacado(request, pk):
    """
    Toggle destacado de un producto (AJAX)
    """
    try:
        producto = get_object_or_404(Producto, pk=pk)
        producto.is_featured = not producto.is_featured
        producto.save()
        
        logger.info(f'Producto {producto.id} destacado cambiado a {producto.is_featured} por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'is_featured': producto.is_featured,
            'message': f'Producto {"marcado como destacado" if producto.is_featured else "desmarcado como destacado"}'
        })
    except Exception as e:
        logger.error(f'Error toggling destacado producto {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_POST
def producto_update_field(request, pk):
    """
    Actualizar un campo específico del producto (AJAX)
    """
    try:
        producto = get_object_or_404(Producto, pk=pk)
        field = request.POST.get('field')
        value = request.POST.get('value')
        
        if field == 'precio':
            # Limpiar valor: remover puntos de miles y reemplazar coma por punto
            value_clean = value.replace('.', '').replace(',', '.')
            producto.precio = float(value_clean)
            if producto.precio <= 0:
                return JsonResponse({
                    'success': False,
                    'error': 'El precio debe ser mayor a 0'
                }, status=400)
        elif field == 'stock':
            # Limpiar valor: remover separadores
            value_clean = value.replace('.', '').replace(',', '')
            producto.stock = int(value_clean)
            if producto.stock < 0:
                return JsonResponse({
                    'success': False,
                    'error': 'El stock no puede ser negativo'
                }, status=400)
        else:
            return JsonResponse({
                'success': False,
                'error': 'Campo no válido'
            }, status=400)
        
        producto.save()
        logger.info(f'Producto {producto.id} campo {field} actualizado a {value} por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'message': f'{field.capitalize()} actualizado correctamente'
        })
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': 'Valor no válido'
        }, status=400)
    except Exception as e:
        logger.error(f'Error actualizando campo {field} del producto {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


# ============================================
# GESTIÓN DE PEDIDOS
# ============================================

@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def pedidos_list(request):
    """
    Lista de pedidos con filtros y búsqueda
    """
    # Obtener todos los pedidos
    pedidos = Pedido.objects.select_related('cliente').prefetch_related('items__producto').order_by('-creado')
    
    # Filtros
    filtro_estado = request.GET.get('estado', '')
    filtro_pago = request.GET.get('pago', '')
    filtro_fecha = request.GET.get('fecha', '')
    filtro_envio = request.GET.get('envio', '')
    buscar = request.GET.get('buscar', '')
    
    # Aplicar filtro de estado
    if filtro_estado:
        pedidos = pedidos.filter(estado=filtro_estado)
    
    # Aplicar filtro de pago
    if filtro_pago:
        pedidos = pedidos.filter(estado_pago=filtro_pago)
    
    # Aplicar filtro de tipo de envío
    if filtro_envio:
        pedidos = pedidos.filter(tipo_envio=filtro_envio)
    
    # Aplicar filtro de fecha
    if filtro_fecha == 'hoy':
        pedidos = pedidos.filter(creado__date=timezone.now().date())
    elif filtro_fecha == 'semana':
        inicio_semana = timezone.now() - timedelta(days=7)
        pedidos = pedidos.filter(creado__gte=inicio_semana)
    elif filtro_fecha == 'mes':
        inicio_mes = timezone.now() - timedelta(days=30)
        pedidos = pedidos.filter(creado__gte=inicio_mes)
    
    # Búsqueda
    if buscar:
        pedidos = pedidos.filter(
            Q(numero_pedido__icontains=buscar) |
            Q(nombre_comprador__icontains=buscar) |
            Q(nombre_destinatario__icontains=buscar) |
            Q(email_comprador__icontains=buscar) |
            Q(telefono_destinatario__icontains=buscar) |
            Q(cliente__username__icontains=buscar) |
            Q(cliente__email__icontains=buscar)
        )
    
    # Estadísticas para badges
    total_pedidos = Pedido.objects.count()
    pedidos_recibidos = Pedido.objects.filter(estado='recibido').count()
    pedidos_preparando = Pedido.objects.filter(estado='preparando').count()
    pedidos_en_camino = Pedido.objects.filter(estado='en_camino').count()
    pedidos_entregados = Pedido.objects.filter(estado='entregado').count()
    pedidos_cancelados = Pedido.objects.filter(estado='cancelado').count()
    
    pagos_pendientes = Pedido.objects.filter(estado_pago='pendiente').count()
    pagos_aprobados = Pedido.objects.filter(estado_pago='approved').count()
    pagos_rechazados = Pedido.objects.filter(estado_pago='rejected').count()
    
    # Paginación
    paginator = Paginator(pedidos, 20)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total_pedidos': total_pedidos,
        'pedidos_recibidos': pedidos_recibidos,
        'pedidos_preparando': pedidos_preparando,
        'pedidos_en_camino': pedidos_en_camino,
        'pedidos_entregados': pedidos_entregados,
        'pedidos_cancelados': pedidos_cancelados,
        'pagos_pendientes': pagos_pendientes,
        'pagos_aprobados': pagos_aprobados,
        'pagos_rechazados': pagos_rechazados,
        'filtro_estado': filtro_estado,
        'filtro_pago': filtro_pago,
        'filtro_fecha': filtro_fecha,
        'filtro_envio': filtro_envio,
        'buscar_actual': buscar,
    }
    
    return render(request, 'admin_simple/pedidos_list.html', context)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def pedido_detail(request, pk):
    """
    Vista detallada de un pedido específico
    """
    pedido = get_object_or_404(
        Pedido.objects.select_related('cliente').prefetch_related('items__producto'),
        pk=pk
    )
    
    # Calcular totales
    subtotal = sum(item.precio * item.cantidad for item in pedido.items.all())
    
    context = {
        'pedido': pedido,
        'subtotal': subtotal,
    }
    
    return render(request, 'admin_simple/pedido_detail.html', context)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_http_methods(["POST"])
def pedido_cambiar_estado(request, pk):
    """
    Cambiar el estado de un pedido
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    nuevo_estado = request.POST.get('estado')
    
    if nuevo_estado not in dict(Pedido._meta.get_field('estado').choices):
        return JsonResponse({
            'success': False,
            'error': 'Estado no válido'
        }, status=400)
    
    estado_anterior = pedido.estado
    pedido.estado = nuevo_estado
    pedido.save()

    if estado_anterior != nuevo_estado:
        try:
            from notificaciones.n8n_service import n8n_service
            n8n_service.enviar_notificacion_pedido(pedido=pedido, tipo='estado')
        except Exception as e:
            logger.error(f"Error enviando notificación WhatsApp vía n8n para pedido {pedido.id}: {str(e)}")
    
    logger.info(f'Pedido {pedido.id} cambió de estado: {estado_anterior} → {nuevo_estado} por {request.user.username}')
    
    return JsonResponse({
        'success': True,
        'message': f'Estado actualizado a {pedido.get_estado_display()}',
        'nuevo_estado': nuevo_estado
    })


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_http_methods(["POST"])
def pedido_cambiar_estado_pago(request, pk):
    """
    Cambiar el estado de pago de un pedido
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    nuevo_estado_pago = request.POST.get('estado_pago')
    
    # Validar que el estado de pago sea válido
    estados_validos = ['pendiente', 'approved', 'rejected']
    if nuevo_estado_pago not in estados_validos:
        return JsonResponse({
            'success': False,
            'error': 'Estado de pago no válido'
        }, status=400)
    
    estado_anterior = pedido.estado_pago
    pedido.estado_pago = nuevo_estado_pago
    
    # Si se marca como aprobado, también confirmar el pedido
    if nuevo_estado_pago == 'approved':
        pedido.confirmado = True
    
    pedido.save()
    
    logger.info(f'Pedido {pedido.id} cambió estado de pago: {estado_anterior} → {nuevo_estado_pago} por {request.user.username}')
    
    return JsonResponse({
        'success': True,
        'message': f'Estado de pago actualizado a {pedido.get_estado_pago_display()}',
        'nuevo_estado_pago': nuevo_estado_pago
    })


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_http_methods(["POST"])
def pedido_confirmar(request, pk):
    """
    Confirmar un pedido y reducir stock
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    if pedido.confirmado:
        return JsonResponse({
            'success': False,
            'error': 'El pedido ya está confirmado'
        }, status=400)
    
    # Usar el método del modelo para confirmar
    exito, mensaje = pedido.confirmar_pedido()
    
    if exito:
        logger.info(f'Pedido {pedido.id} confirmado por {request.user.username}')
        return JsonResponse({
            'success': True,
            'message': 'Pedido confirmado exitosamente. Stock reducido.'
        })
    else:
        return JsonResponse({
            'success': False,
            'error': mensaje
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_http_methods(["POST"])
def pedido_cancelar(request, pk):
    """
    Cancelar un pedido y restaurar stock si estaba confirmado
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    if pedido.estado == 'cancelado':
        return JsonResponse({
            'success': False,
            'error': 'El pedido ya está cancelado'
        }, status=400)
    
    if pedido.estado == 'entregado':
        return JsonResponse({
            'success': False,
            'error': 'No se puede cancelar un pedido ya entregado'
        }, status=400)
    
    # Usar el método del modelo para cancelar
    exito, mensaje = pedido.cancelar_pedido()
    
    if exito:
        logger.info(f'Pedido {pedido.id} cancelado por {request.user.username}')
        return JsonResponse({
            'success': True,
            'message': 'Pedido cancelado exitosamente. Stock restaurado.'
        })
    else:
        return JsonResponse({
            'success': False,
            'error': mensaje
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def pedido_pdf(request, pk):
    """
    Generar PDF del pedido
    """
    from .pdf_generator import generar_pdf_pedido
    
    pedido = get_object_or_404(
        Pedido.objects.select_related('cliente').prefetch_related('items__producto'),
        pk=pk
    )
    
    try:
        # Generar PDF
        pdf = generar_pdf_pedido(pedido)
        
        # Crear respuesta HTTP
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="pedido_{pedido.numero_pedido or pedido.id}.pdf"'
        
        logger.info(f'PDF generado para pedido {pedido.id} por {request.user.username}')
        
        return response
        
    except Exception as e:
        logger.error(f'Error generando PDF para pedido {pk}: {str(e)}')
        return HttpResponse(f'Error generando PDF: {str(e)}', status=500)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_POST
def imagen_delete(request, pk):
    """
    Eliminar una imagen del producto (AJAX)
    """
    try:
        imagen = get_object_or_404(ProductoImagen, pk=pk)
        producto_id = imagen.producto.id
        
        # No permitir eliminar si es la única imagen
        if imagen.producto.imagenes.count() == 1:
            return JsonResponse({
                'success': False,
                'error': 'No se puede eliminar la única imagen del producto'
            }, status=400)
        
        # Si es la imagen primaria, establecer otra como primaria
        if imagen.is_primary:
            otra_imagen = imagen.producto.imagenes.exclude(pk=pk).first()
            if otra_imagen:
                otra_imagen.is_primary = True
                otra_imagen.save()
        
        imagen.delete()
        logger.info(f'Imagen {pk} eliminada por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'message': 'Imagen eliminada exitosamente'
        })
    except Exception as e:
        logger.error(f'Error eliminando imagen {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
@require_POST
def imagen_set_primary(request, pk):
    """
    Establecer una imagen como primaria (AJAX)
    """
    try:
        imagen = get_object_or_404(ProductoImagen, pk=pk)
        producto = imagen.producto
        
        # Quitar primaria de todas las imágenes del producto
        producto.imagenes.update(is_primary=False)
        
        # Establecer esta como primaria
        imagen.is_primary = True
        imagen.save()
        
        logger.info(f'Imagen {pk} establecida como primaria por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'message': 'Imagen principal actualizada'
        })
    except Exception as e:
        logger.error(f'Error estableciendo imagen primaria {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@user_passes_test(is_superuser, login_url='/admin/')
def generar_catalogo_pdf(request):
    """
    Genera un PDF visual tipo catálogo con fotos y descripciones para el taller
    """
    try:
        from reportlab.platypus import PageBreak, KeepTogether
        from reportlab.lib.utils import ImageReader
        from PIL import Image as PILImage
        
        # Crear el objeto HttpResponse con el tipo de contenido PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="catalogo_visual_{timezone.now().strftime("%Y%m%d")}.pdf"'
        
        # Crear el buffer
        buffer = BytesIO()
        
        # Crear el documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                               rightMargin=1.5*cm, leftMargin=1.5*cm,
                               topMargin=1.5*cm, bottomMargin=1.5*cm)
        
        # Contenedor para los elementos del PDF
        elements = []
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#2c5f2d'),
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        )
        
        product_name_style = ParagraphStyle(
            'ProductName',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#2c5f2d'),
            spaceAfter=5,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        product_desc_style = ParagraphStyle(
            'ProductDesc',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.black,
            spaceAfter=3,
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=10
        )
        
        product_price_style = ParagraphStyle(
            'ProductPrice',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#2c5f2d'),
            spaceAfter=5,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Título principal
        elements.append(Paragraph("🌸 CATÁLOGO DE PRODUCTOS - TALLER", title_style))
        elements.append(Paragraph(f"Generado el {timezone.now().strftime('%d/%m/%Y a las %H:%M')}", subtitle_style))
        elements.append(Spacer(1, 0.3*cm))
        
        # Obtener productos activos con imágenes
        productos = Producto.objects.filter(is_active=True).prefetch_related('imagenes').select_related('categoria').order_by('categoria__nombre', 'nombre')
        
        if not productos.exists():
            elements.append(Paragraph("No hay productos activos para mostrar", styles['Normal']))
        else:
            # Crear cuadrícula de productos (2 columnas)
            productos_por_fila = []
            fila_actual = []
            
            for producto in productos:
                # Crear tarjeta de producto
                producto_elements = []
                
                # Obtener imagen principal
                imagen_principal = producto.imagenes.filter(is_primary=True).first() or producto.imagenes.first()
                
                if imagen_principal and imagen_principal.imagen:
                    try:
                        # Descargar imagen desde Cloudinary
                        img_url = imagen_principal.imagen.url
                        
                        # Agregar headers para evitar bloqueos
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                        img_response = requests.get(img_url, timeout=15, headers=headers, verify=True)
                        img_response.raise_for_status()
                        
                        # Abrir imagen con PIL
                        pil_img = PILImage.open(BytesIO(img_response.content))
                        
                        # Convertir a RGB si es necesario
                        if pil_img.mode in ('RGBA', 'LA', 'P'):
                            pil_img = pil_img.convert('RGB')
                        
                        # Calcular dimensiones manteniendo aspect ratio
                        max_width = 7*cm
                        max_height = 6*cm
                        
                        # Obtener dimensiones originales
                        orig_width, orig_height = pil_img.size
                        aspect_ratio = orig_width / orig_height
                        
                        # Calcular nuevas dimensiones
                        if aspect_ratio > (max_width / max_height):
                            # Imagen más ancha
                            new_width = max_width
                            new_height = max_width / aspect_ratio
                        else:
                            # Imagen más alta
                            new_height = max_height
                            new_width = max_height * aspect_ratio
                        
                        # Redimensionar manteniendo aspecto
                        pil_img.thumbnail((int(new_width * 3), int(new_height * 3)), PILImage.Resampling.LANCZOS)
                        
                        # Guardar en buffer
                        img_buffer = BytesIO()
                        pil_img.save(img_buffer, format='JPEG', quality=90, optimize=True)
                        img_buffer.seek(0)
                        
                        # Crear imagen para ReportLab con dimensiones calculadas
                        img = RLImage(img_buffer, width=new_width, height=new_height)
                        producto_elements.append(img)
                    except Exception as e:
                        logger.warning(f'Error cargando imagen para producto {producto.id} ({img_url}): {str(e)}')
                        # Placeholder si falla la imagen
                        producto_elements.append(Spacer(1, 2*cm))
                        producto_elements.append(Paragraph("📷 Imagen no disponible", product_desc_style))
                
                producto_elements.append(Spacer(1, 0.2*cm))
                
                # Nombre del producto
                producto_elements.append(Paragraph(f"<b>{producto.nombre}</b>", product_name_style))
                
                # Código y precio
                precio_str = f"${float(producto.precio):,.0f}".replace(',', '.')
                producto_elements.append(Paragraph(f"Código: {producto.id} | {precio_str}", product_price_style))
                
                producto_elements.append(Spacer(1, 0.1*cm))
                
                # Descripción (componentes)
                if producto.descripcion:
                    desc_lines = producto.descripcion.split('\n')
                    desc_text = '<br/>'.join([line.strip() for line in desc_lines if line.strip()][:8])  # Máximo 8 líneas
                    producto_elements.append(Paragraph(f"<b>Componentes:</b><br/>{desc_text}", product_desc_style))
                
                # Agregar a fila
                fila_actual.append(producto_elements)
                
                # Si completamos 2 productos, crear tabla de fila
                if len(fila_actual) == 2:
                    # Crear tabla para esta fila (2 columnas)
                    tabla_fila = Table([fila_actual], colWidths=[9*cm, 9*cm])
                    tabla_fila.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 5),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                        ('TOPPADDING', (0, 0), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#2c5f2d')),
                        ('LINEAFTER', (0, 0), (0, -1), 1, colors.HexColor('#2c5f2d')),
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fdf9')),
                    ]))
                    
                    elements.append(tabla_fila)
                    elements.append(Spacer(1, 0.5*cm))
                    fila_actual = []
            
            # Si queda un producto suelto
            if fila_actual:
                # Agregar celda vacía
                fila_actual.append([])
                tabla_fila = Table([fila_actual], colWidths=[9*cm, 9*cm])
                tabla_fila.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#2c5f2d')),
                    ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f9fdf9')),
                ]))
                elements.append(tabla_fila)
            
            # Resumen final
            elements.append(Spacer(1, 0.5*cm))
            elements.append(Paragraph(f"<b>Total de productos en catálogo: {productos.count()}</b>", product_price_style))
        
        # Construir el PDF
        doc.build(elements)
        
        # Obtener el valor del buffer y escribirlo en la respuesta
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        
        logger.info(f'PDF de catálogo visual generado por {request.user.username}')
        return response
        
    except Exception as e:
        logger.error(f'Error generando PDF de catálogo visual: {str(e)}')
        messages.error(request, f'Error al generar el PDF: {str(e)}')
        return redirect('admin_simple:dashboard')
