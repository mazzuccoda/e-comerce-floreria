from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from .cart import Cart
from .serializers import CartSerializer, AddToCartSerializer
from catalogo.models import Producto


class CartAPIView(APIView):
    """
    API para gestionar el carrito de compras.

    - GET: Devuelve el contenido actual del carrito.
    - POST: Añade, actualiza o elimina un producto.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Devuelve el estado actual del carrito."""
        cart = Cart(request)
        cart_data = {
            'items': list(cart),
            'total_price': cart.get_total_price(),
            'total_items': len(cart)
        }
        serializer = CartSerializer(cart_data)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        """Añade/actualiza un producto o lo elimina del carrito."""
        serializer = AddToCartSerializer(data=request.data)
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            cart = Cart(request)

            try:
                product = Producto.objects.get(id=product_id)
            except Producto.DoesNotExist:
                return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            # Si 'remove' es true, eliminamos el producto
            if serializer.validated_data.get('remove'):
                cart.remove(product)
            # Si no, lo añadimos o actualizamos
            else:
                quantity = serializer.validated_data['quantity']
                update = serializer.validated_data.get('update_quantity', False)
                cart.add(product=product, quantity=quantity, update_quantity=update)
            
            return self.get(request, *args, **kwargs)  # Devuelve el carrito actualizado
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
