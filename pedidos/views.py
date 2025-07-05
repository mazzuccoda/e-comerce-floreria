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
from .models import Pedido, PedidoItem, PedidoAccesorio, Accesorio
from .db_utils import execute_with_retry, ensure_connection, close_connection
from catalogo.models import Producto
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .emails import enviar_email_confirmacion_pedido

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

    def _save_pedido(self, data):
        """Función interna para guardar el pedido con manejo de errores."""
        # Crear el pedido
        pedido = Pedido(
            dedicatoria=data['dedicatoria'],
            nombre_destinatario=data['nombre_destinatario'],
            direccion=data['direccion'],
            telefono_destinatario=data['telefono_destinatario'],
            fecha_entrega=data['fecha_entrega'],
            franja_horaria=data['franja_horaria'],
            instrucciones=data.get('instrucciones', ''),
            regalo_anonimo=data.get('regalo_anonimo', False),
            medio_pago=data['medio_pago'],
            total=data['total'],
            **({'cliente': self.request.user, 'anonimo': False} 
               if self.request.user.is_authenticated 
               else {'anonimo': True})
        )
        pedido.save()
        
        # Obtener el producto
        producto = Producto.objects.get(id=data['producto'], activo=True)
        
        # Crear el ítem del pedido
        PedidoItem.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=data.get('cantidad', 1)
        )
        
        # Procesar accesorios si los hay
        accesorios = data.get('accesorios', [])
        if accesorios:
            # Obtener todos los accesorios activos en una sola consulta
            accesorios_activos = {
                str(a.id): a 
                for a in Accesorio.objects.filter(
                    id__in=accesorios, 
                    activo=True
                )
            }
            
            # Crear los accesorios del pedido en lote
            pedido_accesorios = [
                PedidoAccesorio(
                    pedido=pedido,
                    accesorio=accesorio,
                    cantidad=1
                )
                for accesorio_id, accesorio in accesorios_activos.items()
            ]
            
            if pedido_accesorios:
                PedidoAccesorio.objects.bulk_create(pedido_accesorios)
            
            # Registrar accesorios no encontrados
            for accesorio_id in set(accesorios) - set(accesorios_activos.keys()):
                logger.warning(f"Accesorio no encontrado o inactivo: {accesorio_id}")
        
        logger.info(f"Pedido {pedido.id} creado exitosamente")
        return pedido

    def done(self, form_list, **kwargs):
        """Maneja la finalización exitosa del wizard de compra con manejo de errores robusto."""
        try:
            # Obtener y validar datos
            data = self.serialize_wizard_data(self.get_all_cleaned_data())
            logger.info("Iniciando proceso de guardado de pedido")
            
            # Validar datos mínimos requeridos
            required_fields = [
                'producto', 'nombre_destinatario', 'direccion', 
                'telefono_destinatario', 'fecha_entrega', 
                'franja_horaria', 'medio_pago', 'total'
            ]
            
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValueError(f"Campo requerido faltante: {field}")
            
            # Usar execute_with_retry para manejar la operación de base de datos
            pedido = execute_with_retry(
                lambda: self._save_pedido(data),
                max_retries=3,
                initial_delay=1
            )
            
            # Enviar correo de confirmación
            enviar_email_confirmacion_pedido(pedido)

            # Enviar notificación por WhatsApp
            enviar_whatsapp_confirmacion_pedido(pedido)

            # Limpiar el carrito después de una compra exitosa
            if 'carrito' in self.request.session:
                del self.request.session['carrito']
            
            messages.success(self.request, "¡Pedido realizado con éxito! Revisa tu correo para ver la confirmación.")

            # Limpiar la sesión del wizard
            self.storage.reset()

            # Redirigir a la página de confirmación
            return redirect(reverse('pedidos:confirmacion_pedido', kwargs={'pedido_id': pedido.id}))
            
        except Exception as e:
            logger.error(f"Error en el proceso de compra: {str(e)}", exc_info=True)
            messages.error(
                self.request,
                f"Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente. Error: {str(e)}"
            )
            return redirect('catalogo:inicio')
            
        except ObjectDoesNotExist as e:
            logger.error(f"Recurso no encontrado: {str(e)}", exc_info=True)
            messages.error(
                self.request,
                "Uno o más productos de tu pedido ya no están disponibles. "
                "Por favor, actualiza tu carrito e inténtalo de nuevo."
            )
            
        except Exception as e:
            logger.error(f"Error inesperado: {str(e)}", exc_info=True)
            messages.error(
                self.request,
                f"Ocurrió un error inesperado: {str(e)}. Por favor, inténtalo de nuevo."
            )
        
        # En caso de error, limpiar la sesión del wizard y redirigir
        self.storage.reset()
        return redirect(reverse('pedidos:iniciar_compra'))

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
                            cantidad=item['cantidad'],
                            precio=item['producto'].precio # Extraer precio del objeto producto
                        )
                    
                    # Limpiar el carrito
                    cart.clear()

                    # Guardar el ID del pedido en la sesión para el siguiente paso (pago)
                    request.session['pedido_id'] = pedido.id
                    messages.success(request, "Los datos de entrega se han guardado. Ahora, procede con el pago.")
                    # Redirigir a la página de pago (que crearemos después)
                    return redirect(reverse('pedidos:procesar_pago')) # Asumimos que esta URL existirá

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
def procesar_pago(request):
    pedido_id = request.session.get('pedido_id')
    if not pedido_id:
        messages.warning(request, "No hay un pedido en proceso de pago.")
        return redirect('catalogo:productos')

    # Aquí irá la lógica de integración con Mercado Pago
    # Por ahora, solo mostramos una página de confirmación temporal.
    html = f"""    <h1>Revisando Pedido #{pedido_id}</h1>    <p>Próximamente, aquí se integrará el pago con Mercado Pago.</p>    """
    return HttpResponse(html)

