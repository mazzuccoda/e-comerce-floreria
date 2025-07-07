from django import forms
from .models import Pedido, Accesorio, MetodoEnvio
from catalogo.models import Producto
from django.utils import timezone
from datetime import timedelta

class SeleccionProductoForm(forms.Form):
    producto = forms.ModelChoiceField(queryset=Producto.objects.none(), label="Elige tu ramo o planta", widget=forms.Select(attrs={'class': 'form-control'}))
    cantidad = forms.IntegerField(min_value=1, initial=1, label="Cantidad", widget=forms.NumberInput(attrs={'class': 'form-control', 'style': 'max-width: 90px;'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print('Reconstruyendo queryset de productos en cada request')
        self.fields['producto'].queryset = Producto.objects.filter(is_active=True)

class SeleccionAccesoriosForm(forms.Form):
    accesorios = forms.ModelMultipleChoiceField(
        queryset=Accesorio.objects.none(),  # queryset vacío por defecto
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Agrega accesorios a tu pedido"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print('Reconstruyendo queryset de accesorios en cada request')
        self.fields['accesorios'].queryset = Accesorio.objects.filter(activo=True)
    # Se puede extender para cantidades por accesorio si lo deseas

class DedicatoriaForm(forms.Form):
    dedicatoria = forms.CharField(
        label="Dedicatoria personalizada",
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Escribe tu mensaje...'}),
        max_length=300
    )

class DatosEntregaForm(forms.ModelForm):
    metodo_envio = forms.ModelChoiceField(
        queryset=MetodoEnvio.objects.filter(activo=True).order_by('costo'),
        widget=forms.RadioSelect,
        label="Método de Envío",
        required=True,
        empty_label=None
    )

    class Meta:
        model = Pedido
        fields = ['nombre_comprador', 'telefono_comprador', 'nombre_destinatario', 'direccion', 'telefono_destinatario', 'fecha_entrega', 'franja_horaria', 'metodo_envio', 'instrucciones', 'regalo_anonimo']
        widgets = {
            'nombre_comprador': forms.TextInput(attrs={'class': 'form-control'}),
            'telefono_comprador': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 3815123456'}),
            'nombre_destinatario': forms.TextInput(attrs={'class': 'form-control'}),
            'direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'telefono_destinatario': forms.TextInput(attrs={'class': 'form-control'}),
            'fecha_entrega': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'franja_horaria': forms.Select(attrs={'class': 'form-control'}),
            'instrucciones': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Portero, casa al fondo...'}),
            'regalo_anonimo': forms.CheckboxInput(),
        }
        labels = {
            'nombre_comprador': 'Tu nombre completo',
            'telefono_comprador': 'Tu número de WhatsApp (sin 0 ni 15)',
            'nombre_destinatario': 'Nombre de quien recibe',
            'telefono_destinatario': 'Teléfono de quien recibe',
            'regalo_anonimo': 'Quiero que mi regalo sea anónimo (no se revelará mi nombre)',
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user and user.is_authenticated:
            self.fields['nombre_comprador'].initial = user.get_full_name() or user.username
            # Si tuvieras un perfil de usuario con teléfono, lo pre-cargarías aquí
            # self.fields['telefono_comprador'].initial = user.profile.telefono

    def clean_fecha_entrega(self):
        fecha = self.cleaned_data['fecha_entrega']
        if fecha < timezone.now().date() + timedelta(days=1):
            raise forms.ValidationError("La entrega debe ser al menos con 1 día de anticipación.")
        return fecha

class MetodoPagoForm(forms.Form):
    medio_pago = forms.ChoiceField(
        choices=Pedido.MEDIOS_PAGO,
        widget=forms.RadioSelect,
        label="Selecciona un método de pago"
    )


class SeguimientoPedidoForm(forms.Form):
    pedido_id = forms.IntegerField(
        label="Número de Pedido",
        widget=forms.TextInput(attrs={'placeholder': 'Ej: 123', 'class': 'form-control'})
    )
