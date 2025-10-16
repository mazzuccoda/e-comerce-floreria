from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q, Count, Sum
from django.core.paginator import Paginator
from django.views.decorators.http import require_POST
from catalogo.models import Producto, Categoria
import logging

logger = logging.getLogger(__name__)


def is_superuser(user):
    """Verificar que el usuario sea superusuario"""
    return user.is_superuser


@login_required
@user_passes_test(is_superuser)
def dashboard(request):
    """
    Dashboard principal con estadísticas
    """
    # Estadísticas
    total_productos = Producto.objects.count()
    productos_activos = Producto.objects.filter(disponible=True).count()
    productos_stock_bajo = Producto.objects.filter(stock__lt=5, stock__gt=0).count()
    productos_sin_stock = Producto.objects.filter(stock=0).count()
    
    context = {
        'total_productos': total_productos,
        'productos_activos': productos_activos,
        'productos_stock_bajo': productos_stock_bajo,
        'productos_sin_stock': productos_sin_stock,
    }
    
    return render(request, 'admin_simple/dashboard.html', context)


@login_required
@user_passes_test(is_superuser)
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
    
    # Aplicar filtros
    if filtro == 'activos':
        productos = productos.filter(disponible=True)
    elif filtro == 'inactivos':
        productos = productos.filter(disponible=False)
    elif filtro == 'stock_bajo':
        productos = productos.filter(stock__lt=5, stock__gt=0)
    elif filtro == 'sin_stock':
        productos = productos.filter(stock=0)
    
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
    }
    
    return render(request, 'admin_simple/productos_list.html', context)


@login_required
@user_passes_test(is_superuser)
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
            producto.precio = float(request.POST.get('precio', 0))
            producto.stock = int(request.POST.get('stock', 0))
            producto.disponible = request.POST.get('disponible') == 'on'
            
            # Validaciones
            if producto.precio <= 0:
                messages.error(request, 'El precio debe ser mayor a 0')
                return render(request, 'admin_simple/producto_edit.html', {'producto': producto})
            
            if producto.stock < 0:
                messages.error(request, 'El stock no puede ser negativo')
                return render(request, 'admin_simple/producto_edit.html', {'producto': producto})
            
            producto.save()
            messages.success(request, f'Producto "{producto.nombre}" actualizado exitosamente')
            logger.info(f'Producto {producto.id} actualizado por {request.user.username}')
            
            return redirect('admin_simple:productos-list')
            
        except ValueError as e:
            messages.error(request, f'Error en los datos: {str(e)}')
            logger.error(f'Error actualizando producto {pk}: {str(e)}')
        except Exception as e:
            messages.error(request, f'Error inesperado: {str(e)}')
            logger.error(f'Error inesperado actualizando producto {pk}: {str(e)}')
    
    context = {
        'producto': producto,
    }
    
    return render(request, 'admin_simple/producto_edit.html', context)


@login_required
@user_passes_test(is_superuser)
@require_POST
def producto_toggle(request, pk):
    """
    Toggle disponibilidad de un producto (AJAX)
    """
    try:
        producto = get_object_or_404(Producto, pk=pk)
        producto.disponible = not producto.disponible
        producto.save()
        
        logger.info(f'Producto {producto.id} disponibilidad cambiada a {producto.disponible} por {request.user.username}')
        
        return JsonResponse({
            'success': True,
            'disponible': producto.disponible,
            'message': f'Producto {"activado" if producto.disponible else "desactivado"}'
        })
    except Exception as e:
        logger.error(f'Error toggling producto {pk}: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@user_passes_test(is_superuser)
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
            producto.precio = float(value)
            if producto.precio <= 0:
                return JsonResponse({
                    'success': False,
                    'error': 'El precio debe ser mayor a 0'
                }, status=400)
        elif field == 'stock':
            producto.stock = int(value)
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
    except ValueError:
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
