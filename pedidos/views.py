import logging
from django.shortcuts import render, redirect, get_object_or_404, HttpResponse
from django.urls import reverse_lazy, reverse
from .notificaciones import enviar_whatsapp_confirmacion_pedido
from django.db import transaction, DatabaseError, OperationalError, InterfaceError
from django.core.exceptions import ObjectDoesNotExist
from formtools.wizard.views import SessionWizardView
from .forms import (
    SeleccionProductoForm, SeleccionAccesoriosForm,
    DedicatoriaForm, DatosEntregaForm, MetodoPagoForm,
    SeguimientoPedidoForm
)
from .models import Pedido, PedidoItem, PedidoAccesorio, MetodoEnvio
from catalogo.models import Producto
from pedidos.models import Accesorio
from catalogo.models import Producto
from pedidos.models import Accesorio
from .db_utils import execute_with_retry, ensure_connection, close_connection
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .emails import enviar_email_confirmacion_pedido
import mercadopago
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

# Configuración de logging
logger = logging.getLogger(__name__)
MAX_RETRIES = 3  # Número máximo de reintentos para operaciones de base de datos

FORMS = [
    ("producto", SeleccionProductoForm),
    ("accesorios", SeleccionAccesoriosForm),
    ("dedicatoria", DedicatoriaForm),
    ("entrega", DatosEntregaForm),
    ("pago", MetodoPagoForm),
]
TEMPLATES = {
    "producto": "pedidos/compra_producto.html",
    "accesorios": "pedidos/compra_accesorios.html",
    "dedicatoria": "pedidos/compra_dedicatoria.html",
    "entrega": "pedidos/compra_entrega.html",
    "pago": "pedidos/compra_pago.html",
    "resumen": "pedidos/compra_resumen.html",
}

class CompraWizard(SessionWizardView):
    step_titles = [
        "Producto",
        "Accesorios",
        "Dedicatoria",
        "Entrega",
        "Pago"
    ]

    form_list = [f[1] for f in FORMS]

    def get_context_data(self, form, **kwargs):
        context = super().get_context_data(form=form, **kwargs)
        context['step_titles'] = self.step_titles
        # Añadimos el producto al contexto para mostrarlo si ya fue seleccionado
        cleaned_data = self.get_cleaned_data_for_step('producto') or {}
        if cleaned_data.get('producto'):
            context['producto_seleccionado'] = cleaned_data['producto']
        return context
    template_name = "pedidos/compra_step.html"  # Fallback por si falta alguno

    def get_form_initial(self, step):
        initial = super().get_form_initial(step)
        if step == 'producto' and 'producto_id' in self.kwargs:
            producto_id = self.kwargs['producto_id']
            try:
                producto = Producto.objects.get(id=producto_id, is_active=True)
                initial['producto'] = producto
                initial['cantidad'] = 1
            except Producto.DoesNotExist:
                pass  # Manejar el caso de que el producto no exista
        return initial

    def serialize_wizard_data(self, data):
        # Convierte todos los objetos modelo a IDs o listas de IDs
        if not data:
            return data
        result = {}
        for k, v in data.items():
            if hasattr(v, 'id'):
                result[k] = v.id
            elif hasattr(v, '__iter__') and not isinstance(v, str):
                result[k] = [item.id if hasattr(item, 'id') else item for item in v]
            else:
                result[k] = v
        return result

    def get_cleaned_data_for_step(self, step):
        data = super().get_cleaned_data_for_step(step)
        print(f"[DEBUG] Datos limpios serializados en el paso '{step}': {self.serialize_wizard_data(data)}")
        return self.serialize_wizard_data(data)

    def get_template_names(self):
        return [TEMPLATES.get(self.steps.current, self.template_name)]

    def get_form_kwargs(self, step=None):
        kwargs = super().get_form_kwargs(step)
        if step == 'entrega':
            kwargs['user'] = self.request.user
        return kwargs
        context['step_titles'] = [
            "Producto", "Accesorios", "Dedicatoria", "Entrega", "Pago"
        ]
        context['current_step'] = self.steps.current
        # Resumen parcial para mostrar en sidebar/wizard
        context['wizard_data'] = self.serialize_wizard_data(self.get_all_cleaned_data())
        return context

    def _ensure_connection(self):
        """Asegura que la conexión a la base de datos esté activa."""
        from django.db import connection
        try:
            if connection.connection is None or connection.connection.closed != 0:
                connection.connect()
                logger.info("Nueva conexión a la base de datos establecida")
        except Exception as e:
            logger.error(f"Error al conectar a la base de datos: {str(e)}")
            raise

    def _close_connection(self):
        """Cierra la conexión a la base de datos de manera segura."""
        from django.db import connection
        try:
            if connection.connection is not None:
                connection.close()
                logger.debug("Conexión a la base de datos cerrada")
        except Exception as e:
            logger.warning(f"Error al cerrar la conexión: {str(e)}")

    def _save_pedido(self, form_data, confirmado=False):
        """Función interna para guardar el pedido con manejo de errores."""
        
        # El total ya viene calculado desde el método `done`.
        # Se asocia el cliente si está autenticado.
        pedido_kwargs = {
            'cliente': self.request.user if self.request.user.is_authenticated else None,
            'anonimo': not self.request.user.is_authenticated,
            'dedicatoria': form_data.get('dedicatoria', ''),
            'nombre_destinatario': form_data.get('nombre_destinatario', ''),
            'direccion': form_data.get('direccion', ''),
            'telefono_destinatario': form_data.get('telefono_destinatario', ''),
            'fecha_entrega': form_data.get('fecha_entrega'),
            'franja_horaria': form_data.get('franja_horaria', ''),
            'instrucciones': form_data.get('instrucciones', ''),
            'regalo_anonimo': form_data.get('regalo_anonimo', False),
            'medio_pago': form_data.get('medio_pago', 'efectivo'),
            'metodo_envio_id': form_data.get('metodo_envio'), # Clave: Usar el ID del método de envío
            'total': form_data['total'],
            'confirmado': confirmado,
            'estado': 'confirmado' if confirmado else 'pendiente'
        }

        # Crear el pedido
        pedido = Pedido.objects.create(**pedido_kwargs)
        
        # Obtener el producto
        producto = Producto.objects.get(id=form_data['producto'], is_active=True)
        
        # Crear el ítem del pedido
        PedidoItem.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=form_data.get('cantidad', 1)
        )
        
        # Procesar accesorios si los hay
        accesorio_ids = form_data.get('accesorios', [])
        if accesorio_ids:
            accesorios_activos = Accesorio.objects.filter(id__in=accesorio_ids, activo=True)
            
            pedido_accesorios = [
                PedidoAccesorio(pedido=pedido, accesorio=acc, cantidad=1)
                for acc in accesorios_activos
            ]
            
            if pedido_accesorios:
                PedidoAccesorio.objects.bulk_create(pedido_accesorios)
            
            # Opcional: Registrar accesorios no encontrados o inactivos
            ids_activos = {str(acc.id) for acc in accesorios_activos}
            ids_solicitados = {str(id) for id in accesorio_ids}
            ids_no_encontrados = ids_solicitados - ids_activos
            if ids_no_encontrados:
                logger.warning(f"Pedido {pedido.id}: Accesorios no encontrados o inactivos: {', '.join(ids_no_encontrados)}")
        
        logger.info(f"Pedido {pedido.id} creado exitosamente en _save_pedido.")
        return pedido

    def get(self, request, *args, **kwargs):
        # Guardar datos temporales antes de cada paso
        current_step = self.steps.current
        if current_step in ['accesorios', 'dedicatoria', 'entrega']:
            prev_step = self.steps.prev
            if prev_step:
                cleaned_data = self.get_cleaned_data_for_step(prev_step) or {}
                request.session[f'temp_{prev_step}_data'] = cleaned_data
        return super().get(request, *args, **kwargs)

    def done(self, form_list, **kwargs):
        # form_list contiene los formularios validados de cada paso.
        # Se combinan los datos limpios en un solo diccionario.
        form_data = {}
        for form in form_list:
            form_data.update(form.cleaned_data)

        try:
            total = 0

            # 1. Validar y calcular costo del producto.
            producto = form_data.get('producto')
            cantidad = form_data.get('cantidad', 1)
            if not producto or not producto.is_active:
                raise ObjectDoesNotExist("El producto seleccionado no es válido o está inactivo.")
            total += producto.precio * cantidad

            # 2. Validar y calcular costo de accesorios.
            accesorios_activos = []
            for accesorio in form_data.get('accesorios', []):
                if accesorio.activo:
                    total += accesorio.precio
                    accesorios_activos.append(accesorio)

            # 3. Validar y calcular costo del envío.
            metodo_envio = form_data.get('metodo_envio')
            if not metodo_envio or not metodo_envio.activo:
                raise ObjectDoesNotExist("El método de envío seleccionado no es válido o está inactivo.")
            total += metodo_envio.costo
            
            # 4. Preparar datos para guardar el pedido.
            # El método _save_pedido parece esperar un diccionario con IDs.
            save_data = {key: value for key, value in form_data.items()}
            save_data['total'] = total
            save_data['producto'] = producto.id
            save_data['accesorios'] = [acc.id for acc in accesorios_activos]
            save_data['metodo_envio'] = metodo_envio.id

            # 5. Guardar el pedido en la base de datos.
            pedido = self._save_pedido(save_data, confirmado=True)
            logger.info(f"Pedido #{pedido.id} creado exitosamente. Total: {total}")

            # 6. Limpiar el almacenamiento del wizard y redirigir.
            self.storage.reset()
            return redirect('pedidos:pago_exitoso', pedido_id=pedido.id)

        except ObjectDoesNotExist as e:
            logger.warning(f"Fallo al procesar la compra: {e}")
            messages.error(self.request, "Uno de los ítems de tu pedido ya no está disponible. Por favor, intenta de nuevo.")
            return redirect(reverse('pedidos:compra'))
        except Exception as e:
            logger.error(f"Error inesperado al finalizar la compra: {e}", exc_info=True)
            messages.error(self.request, "Ocurrió un error inesperado. Nuestro equipo ha sido notificado. Por favor, intenta más tarde.")
            return redirect(reverse('core:home'))

# Vista para mostrar el resumen final del pedido
from django.shortcuts import get_object_or_404

def compra_resumen(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    
    # Combinar productos y accesorios para simplificar la plantilla
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
    return render(request, "pedidos/compra_resumen.html", context)


def seguimiento_pedido(request):
    """
    Permite a un usuario buscar un pedido por su ID para ver su estado.
    """
    pedido = None
    # Inicializa el formulario siempre
    form = SeguimientoPedidoForm()

    if request.method == 'POST':
        form = SeguimientoPedidoForm(request.POST)
        if form.is_valid():
            pedido_id = form.cleaned_data['pedido_id']
            try:
                # Por simplicidad, cualquier persona con el ID puede ver el pedido.
                # En un entorno de producción, se podría requerir un email o token.
                pedido = Pedido.objects.get(id=pedido_id)
            except Pedido.DoesNotExist:
                messages.error(request, f"No se encontró ningún pedido con el número '{pedido_id}'.")
        else:
            # Si el formulario no es válido (ej. no es un número)
            messages.error(request, "Por favor, introduce un número de pedido válido.")

    context = {
        'form': form,
        'pedido': pedido
    }
    return render(request, 'pedidos/seguimiento_pedido.html', context)


from carrito.cart import Cart

@login_required
def crear_pedido(request):
    cart = Cart(request)
    if not cart:
        messages.warning(request, "Tu carrito está vacío. No puedes proceder al pago.")
        return redirect('catalogo:productos')

    if request.method == 'POST':
        form = DatosEntregaForm(request.POST, user=request.user)
        if form.is_valid():
            try:
                with transaction.atomic():
                    pedido = form.save(commit=False)
                    if request.user.is_authenticated:
                        pedido.cliente = request.user
                    pedido.save()

                    for item in cart:
                        PedidoItem.objects.create(
                            pedido=pedido,
                            producto=item['producto'],
                            cantidad=item['quantity'],
                            precio=item['producto'].precio # Extraer precio del objeto producto
                        )
                    
                    # Guardar el ID del pedido en la sesión para el siguiente paso (pago)
                    request.session['pedido_id'] = pedido.id

                    # Limpiar el carrito
                    cart.clear()
                    messages.success(request, "Los datos de entrega se han guardado. Ahora, procede con el pago.")
                    # Redirigir a la página de pago (que crearemos después)
                    return redirect(reverse('pedidos:pago_confirmado', args=[pedido.id])) # Redirigir a la página de confirmación

            except Exception as e:
                logger.error(f"Error al crear el pedido: {e}", exc_info=True)
                messages.error(request, "Hubo un error inesperado al procesar tu pedido. Por favor, inténtalo de nuevo.")
                return redirect('pedidos:crear_pedido')
        else:
            logger.warning(f"El formulario de entrega no es válido. Errores: {form.errors.as_json()}")
    else:
        form = DatosEntregaForm(user=request.user)

    context = {
        'cart': cart,
        'form': form
    }
    return render(request, 'pedidos/crear_pedido.html', context)


@login_required
def procesar_pago(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    
    # Lógica de procesamiento de pago (simulada)
    pedido.confirmado = True
    pedido.estado = 'PAGADO'
    pedido.save()
    
    # Enviar notificaciones
    enviar_email_confirmacion_pedido(pedido)
    enviar_whatsapp_confirmacion_pedido(pedido)
    
    return redirect('pedidos:pago_confirmado', pedido_id=pedido.id)


def resumen_pago(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    
    # Verificar que el pedido pertenece al usuario actual o es anónimo
    if not pedido.anonimo and pedido.cliente != request.user:
        raise PermissionDenied
    
    # Verificar que el pedido no esté ya confirmado
    if pedido.confirmado:
        return redirect('pedidos:pago_confirmado', pedido_id=pedido.id)
    
    return render(request, 'pedidos/resumen_pago.html', {'pedido': pedido})

def pago_exitoso(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    return render(request, 'pedidos/pago_exitoso.html', {'pedido': pedido})

def pago_fallido(request):
    return render(request, 'pedidos/pago_fallido.html')

def pago_pendiente(request):
    pedido_id = request.session.get('last_order_id')
    context = {'pedido': get_object_or_404(Pedido, id=pedido_id) if pedido_id else None}
    return render(request, 'pedidos/pago_pendiente.html', context)

def crear_preferencia_pago(request, pedido):
    try:
        if not settings.MERCADOPAGO['ACCESS_TOKEN']:
            raise ValueError("Access Token de MercadoPago no configurado")

        sdk = mercadopago.SDK(settings.MERCADOPAGO['ACCESS_TOKEN'])
        
        preference_data = {
            "items": [{
                "title": f"Pedido #{pedido.id}",
                "quantity": 1,
                "unit_price": float(pedido.total),
                "currency_id": "ARS"
            }],
            "payer": {
                "name": pedido.nombre_destinatario,
                "email": pedido.cliente.email if pedido.cliente else "compra@floreriacristina.com",
                "phone": {"number": pedido.telefono_comprador}
            },
            "back_urls": {
                "success": request.build_absolute_uri(reverse('pedidos:pago_exitoso', args=[pedido.id])),
                "failure": request.build_absolute_uri(reverse('pedidos:pago_fallido')),
                "pending": request.build_absolute_uri(reverse('pedidos:pago_pendiente'))
            },
            "auto_return": "approved",
            "notification_url": request.build_absolute_uri(reverse('pedidos:mercadopago_webhook')),
            "external_reference": str(pedido.id)
        }
        
        preference_response = sdk.preference().create(preference_data)
        
        if not preference_response or 'response' not in preference_response:
            error_msg = preference_response.get('message', 'Respuesta inválida de MercadoPago')
            logger.error(f"Error MercadoPago: {error_msg}")
            return {'error': error_msg}
            
        return preference_response["response"]
        
    except Exception as e:
        logger.error(f"Error al crear preferencia: {str(e)}", exc_info=True)
        return {'error': f"Error interno: {str(e)}"}

@login_required
def detalle_pedido(request, pedido_id):
    """Muestra el detalle de un pedido específico del usuario actual."""
    pedido = get_object_or_404(Pedido, id=pedido_id, cliente=request.user)
    return render(request, 'pedidos/detalle_pedido.html', {'pedido': pedido})

@login_required
def mis_pedidos(request):
    """Muestra el historial de pedidos del usuario actual."""
    pedidos = Pedido.objects.filter(cliente=request.user).order_by('-fecha_creacion')
    return render(request, 'pedidos/mis_pedidos.html', {'pedidos': pedidos})

@csrf_exempt
def mercadopago_webhook(request):
    if request.method == "POST":
        payment_id = request.POST.get('data.id')
        sdk = mercadopago.SDK(settings.MERCADOPAGO['ACCESS_TOKEN'])
        payment_info = sdk.payment().get(payment_id)
        
        if payment_info['status'] == 200:
            pedido_id = payment_info['response']['external_reference']
            pedido = Pedido.objects.get(id=pedido_id)
            pedido.estado_pago = payment_info['response']['status']
            pedido.save()
            
    return HttpResponse(status=200)
