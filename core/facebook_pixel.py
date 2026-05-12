"""
Facebook Pixel Integration para tracking de eventos de comercio electrónico.
"""

from django.conf import settings


def get_facebook_pixel_code():
    """
    Retorna el código del Facebook Pixel para incluir en el <head> del sitio.
    """
    pixel_id = getattr(settings, 'FACEBOOK_PIXEL_ID', '')
    
    if not pixel_id:
        return ''
    
    return f"""
    <!-- Facebook Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s)
      {{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '{pixel_id}');
      fbq('track', 'PageView');
    </script>
    <noscript>
      <img height="1" width="1" style="display:none"
           src="https://www.facebook.com/tr?id={pixel_id}&ev=PageView&noscript=1"/>
    </noscript>
    <!-- End Facebook Pixel Code -->
    """


def track_view_content(product_id, product_name, value, currency='ARS'):
    """
    Genera código JavaScript para rastrear visualización de producto.
    Usar en la página de detalle del producto.
    """
    return f"""
    <script>
      fbq('track', 'ViewContent', {{
        content_ids: ['{product_id}'],
        content_name: '{product_name}',
        content_type: 'product',
        value: {value},
        currency: '{currency}'
      }});
    </script>
    """


def track_add_to_cart(product_id, product_name, value, currency='ARS'):
    """
    Genera código JavaScript para rastrear agregado al carrito.
    Usar cuando el usuario agrega un producto al carrito.
    """
    return f"""
    <script>
      fbq('track', 'AddToCart', {{
        content_ids: ['{product_id}'],
        content_name: '{product_name}',
        content_type: 'product',
        value: {value},
        currency: '{currency}'
      }});
    </script>
    """


def track_initiate_checkout(value, num_items, currency='ARS'):
    """
    Genera código JavaScript para rastrear inicio de checkout.
    Usar cuando el usuario inicia el proceso de compra.
    """
    return f"""
    <script>
      fbq('track', 'InitiateCheckout', {{
        value: {value},
        currency: '{currency}',
        num_items: {num_items}
      }});
    </script>
    """


def track_purchase(order_id, value, currency='ARS'):
    """
    Genera código JavaScript para rastrear compra completada.
    Usar en la página de confirmación de pedido.
    """
    return f"""
    <script>
      fbq('track', 'Purchase', {{
        value: {value},
        currency: '{currency}',
        transaction_id: '{order_id}'
      }});
    </script>
    """
