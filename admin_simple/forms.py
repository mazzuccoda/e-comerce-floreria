"""Formularios del panel operativo."""

from django import forms

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
                attrs={'class': _CLASE_INPUT, 'type': 'tel'}
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
