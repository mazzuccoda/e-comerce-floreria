from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Pedido
from .serializers import PedidoWriteSerializer

class PedidoCreateAPIView(generics.CreateAPIView):
    """
    API endpoint para crear un nuevo pedido.
    Recibe los datos del cliente y los items del carrito, crea el pedido en la base de datos
    y devuelve el objeto del pedido creado.
    La lógica de creación y cálculo de total está en el serializer.
    """
    queryset = Pedido.objects.all()
    serializer_class = PedidoWriteSerializer
    permission_classes = [AllowAny] # Permitir a cualquier usuario (incluso anónimo) crear un pedido
