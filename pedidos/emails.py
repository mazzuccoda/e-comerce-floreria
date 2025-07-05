from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

def enviar_email_confirmacion_pedido(pedido):
    """
    Envía un correo electrónico de confirmación de pedido al cliente.
    """
    try:
        # Combinar productos y accesorios para el contexto del email
        items_del_pedido = []
        for item in pedido.items.all():
            items_del_pedido.append({
                'nombre': f"{item.producto.nombre} (x{item.cantidad})",
                'precio': item.precio
            })
        for accesorio in pedido.accesorios_pedido.all():
            items_del_pedido.append({
                'nombre': f"{accesorio.accesorio.nombre} (x{accesorio.cantidad})",
                'precio': accesorio.precio
            })

        context = {
            'pedido': pedido,
            'items_del_pedido': items_del_pedido
        }

        subject = f'Confirmación de tu pedido #{pedido.id} - Florería Cristina'
        html_message = render_to_string('pedidos/emails/confirmacion_pedido.html', context)
        plain_message = render_to_string('pedidos/emails/confirmacion_pedido.txt', context)
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = pedido.email_cliente

        send_mail(
            subject,
            plain_message,
            from_email,
            [to_email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"Correo de confirmación para el pedido #{pedido.id} enviado a {to_email}")
    except Exception as e:
        # En un entorno de producción, aquí se registraría el error
        print(f'Error al enviar el correo de confirmación para el pedido #{pedido.id}: {e}')
