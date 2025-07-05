from django import template

register = template.Library()

@register.filter(name='get_item')
def get_item(sequence, index):
    """
    Permite acceder a un elemento de una secuencia (lista, tupla) por su índice.
    Uso: {{ mi_lista|get_item:indice }}
    """
    try:
        return sequence[index]
    except (IndexError, TypeError, AttributeError):
        return None
