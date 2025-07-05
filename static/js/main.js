/**
 * Main JavaScript file for Florería Cristina
 * Contains all the interactive functionality for the e-commerce site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
            this.classList.toggle('active');
        });
    }
    
    // Cerrar menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                mainNav.style.display = 'none';
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
            }
        });
    });
    
    // Actualizar contador del carrito
    function updateCartCount() {
        // Aquí iría la lógica para obtener el número de ítems del carrito
        // Por ahora, usaremos un valor estático
        const cartCount = document.querySelectorAll('.cart-count');
        cartCount.forEach(counter => {
            counter.textContent = '0'; // Actualizar con el valor real del carrito
        });
    }
    
    // Inicializar el contador del carrito
    updateCartCount();
    // Back to top button
    const backToTopButton = document.createElement('a');
    backToTopButton.href = '#';
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '<i class="bi bi-arrow-up"></i>';
    backToTopButton.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(backToTopButton);

    // Show/hide back to top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Product quantity controls
    document.querySelectorAll('.quantity-control').forEach(control => {
        const input = control.querySelector('.quantity-input');
        const minusBtn = control.querySelector('.quantity-minus');
        const plusBtn = control.querySelector('.quantity-plus');
        const min = parseInt(input.getAttribute('min') || '1');
        const max = parseInt(input.getAttribute('max') || '100');

        function updateButtons() {
            minusBtn.disabled = parseInt(input.value) <= min;
            plusBtn.disabled = parseInt(input.value) >= max;
        }

        minusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            if (value > min) {
                input.value = value - 1;
                updateButtons();
            }
        });

        plusBtn.addEventListener('click', () => {
            let value = parseInt(input.value);
            if (value < max) {
                input.value = value + 1;
                updateButtons();
            }
        });

        input.addEventListener('change', () => {
            let value = parseInt(input.value);
            if (isNaN(value) || value < min) input.value = min;
            if (value > max) input.value = max;
            updateButtons();
        });

        updateButtons();
    });

    // Image zoom functionality for product details
    const productImages = document.querySelectorAll('.product-image-zoom');
    if (productImages.length > 0) {
        productImages.forEach(img => {
            img.addEventListener('click', function() {
                this.classList.toggle('zoomed');
                document.body.classList.toggle('modal-open');
            });
        });

        // Close zoom when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('product-image-zoom')) {
                productImages.forEach(img => {
                    img.classList.remove('zoomed');
                });
                document.body.classList.remove('modal-open');
            }
        });
    }

    // Product gallery thumbnails
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    const mainImage = document.getElementById('product-main-image');
    
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function(e) {
                e.preventDefault();
                const newSrc = this.getAttribute('data-image');
                const newAlt = this.getAttribute('alt');
                
                // Update main image
                mainImage.src = newSrc;
                mainImage.alt = newAlt;
                
                // Update active thumbnail
                document.querySelector('.product-thumbnail.active').classList.remove('active');
                this.classList.add('active');
            });
        });
    }

    // Add to cart animation
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const button = this;
            const originalText = button.innerHTML;
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Agregando...';
            
            // Simulate API call (replace with actual fetch/AJAX call)
            setTimeout(() => {
                // Show success state
                button.innerHTML = '<i class="bi bi-check2 me-2"></i>¡Agregado!';
                button.classList.add('btn-success');
                
                // Reset button after delay
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.classList.remove('btn-success');
                }, 2000);
                
                // Update cart count
                updateCartCount(1);
            }, 1000);
        });
    });

    // Update cart count in the UI
    function updateCartCount(quantity = 1) {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const currentCount = parseInt(cartCount.textContent) || 0;
            const newCount = currentCount + quantity;
            cartCount.textContent = newCount > 0 ? newCount : 0;
            
            // Add animation
            cartCount.parentElement.classList.add('animate__animated', 'animate__bounceIn');
            setTimeout(() => {
                cartCount.parentElement.classList.remove('animate__animated', 'animate__bounceIn');
            }, 1000);
        }
    }

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Lazy loading for images
    if ('loading' in HTMLImageElement.prototype) {
        const lazyImages = document.querySelectorAll('img.lazy');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }

    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.navbar-toggler');
    const mobileMenu = document.querySelector('.navbar-collapse');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
        });
        
        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains('show')) {
                    mobileMenu.classList.remove('show');
                }
            });
        });
    }

    // Initialize AOS (Animate On Scroll) if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    // Handle product variations
    const variationSelects = document.querySelectorAll('.variation-select');
    if (variationSelects.length > 0) {
        variationSelects.forEach(select => {
            select.addEventListener('change', function() {
                // Update price, image, etc. based on selected variation
                updateProductVariation();
            });
        });
    }

    // Update product variation details
    function updateProductVariation() {
        // This would be replaced with actual logic to update product details
        // based on selected variations (color, size, etc.)
        console.log('Product variation updated');
    }

    // Newsletter subscription
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            const submitButton = this.querySelector('button[type="submit"]');n            const originalText = submitButton.innerHTML;
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando...';
            
            // Simulate API call (replace with actual fetch/AJAX call)
            setTimeout(() => {
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-3';
                alert.role = 'alert';
                alert.innerHTML = '¡Gracias por suscribirte a nuestro boletín!';
                
                // Insert after form
                this.parentNode.insertBefore(alert, this.nextSibling);
                
                // Reset form and button
                this.reset();
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                
                // Remove alert after 5 seconds
                setTimeout(() => {
                    alert.remove();
                }, 5000);
            }, 1000);
        });
    }

    // Initialize any carousels
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        new bootstrap.Carousel(carousel, {
            interval: 5000,
            touch: true
        });
    });
});

// Debounce function for scroll/resize events
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
