from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.generic import ListView, DetailView, TemplateView
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings

# Modelos del catálogo
from catalogo.models import Producto, Categoria
# from .models import Testimonial, BlogPost, Subscriber

def profile_view(request):
    """Perfil de usuario básico"""
    return render(request, 'core/profile.html')

def home(request):
    """Home page view with modern design"""
    # Get active categories and featured products
    featured_categories = Categoria.objects.filter(is_active=True)[:4]  # Show only 4 categories in the modern design
    featured_products = Producto.objects.filter(
        is_active=True,
        is_featured=True
    ).order_by('-created_at')[:8]  # Only show featured products

    context = {
        'featured_categories': featured_categories,
        'featured_products': featured_products,
        'testimonials': [],  # TODO: Add testimonials when model is available
    }
    
    # Use the modern template
    return render(request, 'core/home_modern.html', context)

def about(request):
    """About us page"""
    return render(request, 'core/about.html')

def contact(request):
    """Contact page"""
    if request.method == 'POST':
        # Process contact form
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        
        # TODO: Send email to admin
        messages.success(request, '¡Gracias por contactarnos! Te responderemos a la brevedad.')
        return redirect('core:contact')
    
    return render(request, 'core/contact.html')

def faq(request):
    """Frequently Asked Questions page"""
    faqs = [
        {
            'question': '¿Cómo realizo un pedido?',
            'answer': 'Puedes realizar tu pedido directamente desde nuestra tienda online agregando los productos al carrito y siguiendo los pasos de compra.'
        },
        # Add more FAQs as needed
    ]
    return render(request, 'core/faq.html', {'faqs': faqs})

def shipping(request):
    """Shipping information page"""
    return render(request, 'core/shipping.html')

def returns(request):
    """Returns and refunds page"""
    return render(request, 'core/returns.html')

def privacy_policy(request):
    """Privacy policy page"""
    return render(request, 'core/privacy.html')

def terms(request):
    """Terms and conditions page"""
    return render(request, 'core/terms.html')

def blog(request):
    """Blog listing page"""
    # posts = BlogPost.objects.filter(is_published=True).order_by('-created_at')
    # paginator = Paginator(posts, 6)
    # page_number = request.GET.get('page')
    # page_obj = paginator.get_page(page_number)
    # return render(request, 'core/blog.html', {'page_obj': page_obj})
    return render(request, 'core/blog.html')

def blog_post(request, slug):
    """Single blog post page"""
    # post = get_object_or_404(BlogPost, slug=slug, is_published=True)
    # related_posts = BlogPost.objects.filter(
    #     is_published=True
    # ).exclude(id=post.id).order_by('?')[:3]
    # return render(request, 'core/blog_post.html', {
    #     'post': post,
    #     'related_posts': related_posts
    # })
    return render(request, 'core/blog_post.html')

def subscribe(request):
    """Handle newsletter subscription"""
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            # Check if email already exists
            # subscriber, created = Subscriber.objects.get_or_create(email=email)
            # if created:
            #     messages.success(request, '¡Gracias por suscribirte a nuestro boletín!')
            # else:
            #     messages.info(request, '¡Ya estás suscrito a nuestro boletín!')
            messages.success(request, '¡Gracias por suscribirte a nuestro boletín!')
    
    return redirect('core:home')

def search(request):
    """Site-wide search"""
    query = request.GET.get('q', '').strip()
    results = []
    
    if query:
        # Search in products
        # products = Product.objects.filter(
        #     Q(name__icontains=query) | 
        #     Q(description__icontains=query) |
        #     Q(short_description__icontains=query),
        #     is_active=True
        # )
        
        # Search in blog posts
        # posts = BlogPost.objects.filter(
        #     Q(title__icontains=query) | 
        #     Q(content__icontains=query) |
        #     Q(excerpt__icontains=query),
        #     is_published=True
        # )
        
        # Search in categories
        # categories = Category.objects.filter(
        #     Q(name__icontains=query) | 
        #     Q(description__icontains=query)
        # )
        
        # Combine results
        # results = {
        #     'products': products,
        #     'posts': posts,
        #     'categories': categories,
        # }
        pass
    
    return render(request, 'core/search.html', {
        'query': query,
        'results': results
    })

# Error Handlers
def handler404(request, exception):
    """404 Error handler"""
    return render(request, '404.html', status=404)

def handler500(request):
    """500 Error handler"""
    return render(request, '500.html', status=500)
