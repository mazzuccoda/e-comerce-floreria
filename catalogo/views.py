
from django.shortcuts import render, get_object_or_404, redirect
from carrito.forms import CartAddProductForm
from django.views.generic import ListView, DetailView
from django.db.models import Q
from django.core.paginator import Paginator
from django.contrib import messages
from django.core.paginator import EmptyPage, PageNotAnInteger

from .models import Producto, Categoria

def product_list(request):
    """Vista para listar todos los productos"""
    products = Producto.objects.filter(is_active=True).order_by('-created_at')
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'categories': Categoria.objects.filter(is_active=True)
    }
    return render(request, 'catalogo/product_list.html', context)

def product_detail(request, slug):
    """Vista para el detalle de un producto"""
    product = get_object_or_404(Producto, slug=slug, is_active=True)
    related_products = Producto.objects.filter(
        categoria=product.categoria,
        is_active=True
    ).exclude(id=product.id)[:4]
    
    cart_product_form = CartAddProductForm()

    context = {
        'product': product,
        'related_products': related_products,
        'cart_product_form': cart_product_form
    }
    return render(request, 'catalogo/product_detail.html', context)

def category_detail(request, slug):
    """Vista para mostrar los productos de una categoría"""
    category = get_object_or_404(Categoria, slug=slug, is_active=True)
    products = Producto.objects.filter(categoria=category, is_active=True).order_by('-created_at')
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'category': category,
        'page_obj': page_obj
    }
    return render(request, 'catalogo/category_detail.html', context)

def search(request):
    """Vista para buscar productos"""
    query = request.GET.get('q', '').strip()
    
    if not query:
        messages.warning(request, 'Por favor ingresa un término de búsqueda.')
        return redirect('catalogo:productos')
    
    # TODO: Descomentar cuando se tengan los modelos
    # products = Product.objects.filter(
    #     Q(name__icontains=query) | 
    #     Q(description__icontains=query) |
    #     Q(category__name__icontains=query),
    #     is_active=True
    # ).order_by('-created_at').distinct()
    
    # Paginación
    products = Producto.objects.filter(
        Q(nombre__icontains=query) | Q(descripcion__icontains=query) | Q(categoria__nombre__icontains=query),
        is_active=True).order_by('-created_at').distinct()
    paginator = Paginator(products, 12)
    page = request.GET.get('page')
    
    try:
        results = paginator.page(page)
    except PageNotAnInteger:
        results = paginator.page(1)
    except EmptyPage:
        results = paginator.page(paginator.num_pages)
    
    context = {
        'query': query,
        'page_obj': results,
        'results_count': products.count()
    }
    
    return render(request, 'catalogo/search_results.html', context)
