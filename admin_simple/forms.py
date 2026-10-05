"""Formularios del panel operativo."""

from decimal import Decimal

from django import forms
from django.utils import timezone

from catalogo.models import Producto
from pedidos.models import Pedido

_CLASE_INPUT = 'input-field'


class PedidoOperativoForm(forms.ModelForm):
    """Datos de entrega que el operador corrige por teléfono, sin tocar importes."""

    class Meta:
        model = Pedido
        fields = [
            'fecha_entrega',
            'franja_horaria',
            'hora_retiro',
            'tipo_envio',
            'nombre_destinatario',
            'telefono_destinatario',
            'direccion',
            'ciudad',
            'dedicatoria',
            'instrucciones',
        ]
        widgets = {
            'fecha_entrega': forms.DateInput(
                attrs={'type': 'date', 'class': _CLASE_INPUT}, format='%Y-%m-%d'
            ),
            'hora_retiro': forms.TimeInput(
                attrs={'type': 'time', 'class': _CLASE_INPUT}, format='%H:%M'
            ),
            'franja_horaria': forms.Select(attrs={'class': _CLASE_INPUT}),
            'tipo_envio': forms.Select(attrs={'class': _CLASE_INPUT}),
            'nombre_destinatario': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'telefono_destinatario': forms.TextInput(
                attrs={'class': _CLASE_INPUT, 'type': 'tel', 'inputmode': 'tel'}
            ),
            'direccion': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'ciudad': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'dedicatoria': forms.Textarea(attrs={'class': _CLASE_INPUT, 'rows': 3}),
            'instrucciones': forms.TextInput(attrs={'class': _CLASE_INPUT}),
        }
        labels = {
            'fecha_entrega': 'Fecha de entrega',
            'franja_horaria': 'Franja horaria',
            'hora_retiro': 'Hora de retiro',
            'tipo_envio': 'Tipo de envío',
            'nombre_destinatario': 'Destinatario',
            'telefono_destinatario': 'Teléfono',
            'direccion': 'Dirección',
            'ciudad': 'Ciudad',
            'dedicatoria': 'Dedicatoria',
            'instrucciones': 'Instrucciones',
        }

    def clean(self):
        datos = super().clean()
        tipo_envio = datos.get('tipo_envio')
        if tipo_envio == 'retiro':
            if not datos.get('hora_retiro'):
                self.add_error('hora_retiro', 'Indicá a qué hora pasa a retirar.')
        elif not (datos.get('direccion') or '').strip():
            self.add_error('direccion', 'Un envío necesita dirección de entrega.')
        return datos

    def resumen_de_cambios(self) -> str:
        """Campos modificados, para dejarlos en el log de la operación."""
        return ', '.join(
            f'{self.fields[campo].label or campo}: '
            f'{self.initial.get(campo)} → {self.cleaned_data.get(campo)}'
            for campo in self.changed_data
        )


class PedidoManualForm(forms.ModelForm):
    """Pedido tomado por teléfono o WhatsApp y cargado a mano por el operador."""

    class Meta:
        model = Pedido
        fields = [
            'nombre_comprador',
            'telefono_comprador',
            'email_comprador',
            'nombre_destinatario',
            'telefono_destinatario',
            'direccion',
            'ciudad',
            'tipo_envio',
            'fecha_entrega',
            'franja_horaria',
            'hora_retiro',
            'costo_envio',
            'medio_pago',
            'estado_pago',
            'dedicatoria',
            'firmado_como',
            'regalo_anonimo',
            'instrucciones',
        ]
        widgets = {
            'nombre_comprador': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'telefono_comprador': forms.TextInput(
                attrs={'class': _CLASE_INPUT, 'type': 'tel', 'inputmode': 'tel'}
            ),
            'email_comprador': forms.EmailInput(
                attrs={'class': _CLASE_INPUT, 'inputmode': 'email'}
            ),
            'nombre_destinatario': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'telefono_destinatario': forms.TextInput(
                attrs={'class': _CLASE_INPUT, 'type': 'tel', 'inputmode': 'tel'}
            ),
            'direccion': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'ciudad': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'tipo_envio': forms.Select(attrs={'class': _CLASE_INPUT}),
            'fecha_entrega': forms.DateInput(
                attrs={'type': 'date', 'class': _CLASE_INPUT}, format='%Y-%m-%d'
            ),
            'franja_horaria': forms.Select(attrs={'class': _CLASE_INPUT}),
            'hora_retiro': forms.TimeInput(
                attrs={'type': 'time', 'class': _CLASE_INPUT}, format='%H:%M'
            ),
            'costo_envio': forms.NumberInput(
                attrs={'class': _CLASE_INPUT, 'step': '100', 'min': '0', 'inputmode': 'numeric'}
            ),
            'medio_pago': forms.Select(attrs={'class': _CLASE_INPUT}),
            'estado_pago': forms.Select(attrs={'class': _CLASE_INPUT}),
            'dedicatoria': forms.Textarea(attrs={'class': _CLASE_INPUT, 'rows': 3}),
            'firmado_como': forms.TextInput(attrs={'class': _CLASE_INPUT}),
            'instrucciones': forms.TextInput(attrs={'class': _CLASE_INPUT}),
        }
        labels = {
            'nombre_comprador': 'Quién compra',
            'telefono_comprador': 'Teléfono de quien compra',
            'email_comprador': 'Email (opcional)',
            'nombre_destinatario': 'Destinatario',
            'telefono_destinatario': 'Teléfono del destinatario',
            'direccion': 'Dirección de entrega',
            'ciudad': 'Ciudad',
            'tipo_envio': 'Forma de entrega',
            'fecha_entrega': 'Fecha de entrega',
            'franja_horaria': 'Franja horaria',
            'hora_retiro': 'Hora de retiro',
            'costo_envio': 'Costo de envío',
            'medio_pago': 'Medio de pago',
            'estado_pago': 'Estado del pago',
            'dedicatoria': 'Dedicatoria',
            'firmado_como': 'Firmado como',
            'regalo_anonimo': 'Regalo anónimo',
            'instrucciones': 'Instrucciones',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tipo_envio'].required = True
        self.fields['nombre_comprador'].required = True
        self.fields['telefono_comprador'].required = True
        self.fields['dedicatoria'].required = False
        self.fields['direccion'].required = False
        self.fields['estado_pago'].help_text = (
            'Marcá "Aprobado" sólo si ya cobraste; el pedido suma a Facturado igual.'
        )
        self.fields['email_comprador'].required = False
        self.fields['fecha_entrega'].initial = timezone.localdate()

    def _grupo(self, nombres):
        return [self[nombre] for nombre in nombres]

    def comprador_fields(self):
        return self._grupo(['nombre_comprador', 'telefono_comprador', 'email_comprador'])

    def entrega_fields(self):
        return self._grupo([
            'tipo_envio', 'fecha_entrega', 'franja_horaria', 'hora_retiro',
            'nombre_destinatario', 'telefono_destinatario', 'direccion', 'ciudad',
        ])

    def pago_fields(self):
        return self._grupo(['medio_pago', 'estado_pago', 'costo_envio'])

    def tarjeta_fields(self):
        return self._grupo(['dedicatoria', 'firmado_como', 'regalo_anonimo', 'instrucciones'])

    def clean(self):
        datos = super().clean()
        tipo_envio = datos.get('tipo_envio')

        if tipo_envio == 'retiro':
            if not datos.get('hora_retiro'):
                self.add_error('hora_retiro', 'Indicá a qué hora pasa a retirar.')
            if not (datos.get('direccion') or '').strip():
                datos['direccion'] = 'Retiro en tienda'
        elif not (datos.get('direccion') or '').strip():
            self.add_error('direccion', 'Un envío necesita dirección de entrega.')

        if datos.get('medio_pago') == 'efectivo' and tipo_envio != 'retiro':
            self.add_error(
                'medio_pago',
                'El efectivo se cobra al retirar; para un envío usá transferencia.',
            )

        if (datos.get('costo_envio') or Decimal('0')) < 0:
            self.add_error('costo_envio', 'El costo de envío no puede ser negativo.')

        return datos


class ItemManualForm(forms.Form):
    """Una línea de producto del pedido manual, al precio vigente del catálogo."""

    producto = forms.ModelChoiceField(
        queryset=Producto.objects.none(),
        required=False,
        empty_label='— elegí un producto —',
        widget=forms.Select(attrs={'class': _CLASE_INPUT}),
        label='Producto',
    )
    cantidad = forms.IntegerField(
        min_value=1,
        initial=1,
        required=False,
        widget=forms.NumberInput(
            attrs={'class': _CLASE_INPUT, 'min': '1', 'inputmode': 'numeric'}
        ),
        label='Cantidad',
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['producto'].queryset = Producto.objects.filter(
            is_active=True
        ).order_by('nombre')

    def clean(self):
        datos = super().clean()
        producto = datos.get('producto')
        cantidad = datos.get('cantidad')

        if producto and not cantidad:
            self.add_error('cantidad', 'Indicá cuántos.')
        if cantidad and not producto:
            self.add_error('producto', 'Elegí el producto.')
        return datos


class BaseItemManualFormSet(forms.BaseFormSet):
    """Un pedido sin productos no es un pedido."""

    def clean(self):
        super().clean()
        if any(self.errors):
            return

        lineas = self.lineas()
        if not lineas:
            raise forms.ValidationError('Agregá al menos un producto al pedido.')

        faltantes = [
            f'{producto.nombre}: pediste {cantidad} y hay {producto.stock}'
            for producto, cantidad in lineas
            if producto.stock < cantidad
        ]
        if faltantes:
            raise forms.ValidationError(
                'No hay stock suficiente. ' + '; '.join(faltantes) + '.'
            )

    def lineas(self):
        """Pares (producto, cantidad) con las repeticiones del mismo producto sumadas."""
        acumulado = {}
        for form in self.forms:
            datos = form.cleaned_data if hasattr(form, 'cleaned_data') else {}
            producto = datos.get('producto')
            cantidad = datos.get('cantidad')
            if producto and cantidad:
                if producto.pk in acumulado:
                    anterior, total = acumulado[producto.pk]
                    acumulado[producto.pk] = (anterior, total + cantidad)
                else:
                    acumulado[producto.pk] = (producto, cantidad)
        return list(acumulado.values())


ItemManualFormSet = forms.formset_factory(
    ItemManualForm, formset=BaseItemManualFormSet, extra=3, max_num=20
)
