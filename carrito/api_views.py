from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from catalogo.models import Producto
from .cart import Cart
from .serializers import (
    CartSerializer, 
    AddToCartSerializer, 
    UpdateCartItemSerializer,
    RemoveFromCartSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class CartDetailView(APIView):
    """
    Vista para obtener el contenido completo del carrito
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        cart = Cart(request)
        
        # Preparar datos para el serializer
        cart_data = {
            'items': cart.get_items(),
            'total_price': cart.get_total_price(),
            'total_items': len(cart),
            'is_empty': cart.is_empty
        }
        
        serializer = CartSerializer(cart_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AddToCartView(APIView):
    """
    Vista para agregar productos al carrito
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = AddToCartSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            product_id = serializer.validated_data['product_id']
            quantity = serializer.validated_data['quantity']
            
            # Obtener el producto
            try:
                producto = Producto.objects.get(id=product_id, is_active=True)
            except Producto.DoesNotExist:
                return Response(
                    {'error': 'Producto no encontrado o no disponible'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar stock disponible
            cart = Cart(request)
            current_quantity = 0
            
            # Calcular cantidad actual en carrito
            for item in cart:
                if item['producto'].id == product_id:
                    current_quantity = item['quantity']
                    break
            
            total_requested = current_quantity + quantity
            if total_requested > producto.stock:
                return Response({
                    'error': 'Stock insuficiente',
                    'available': producto.stock,
                    'in_cart': current_quantity,
                    'requested': quantity
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Agregar al carrito
                cart.add(producto, quantity)
                
                # Obtener el carrito actualizado
                items = []
                for item in cart:
                    items.append({
                        'producto': item['producto'],
                        'quantity': item['quantity'],
                        'price': str(item['price']),
                        'total_price': str(item['total_price'])
                    })
                
                # Calcular totales
                total_price = sum(float(item['total_price']) for item in items)
                total_items = sum(item['quantity'] for item in items)
                
                # Retornar estado actualizado del carrito
                cart_data = {
                    'items': items,
                    'total_price': str(total_price),
                    'total_items': total_items,
                    'is_empty': len(items) == 0
                }
                
                cart_serializer = CartSerializer(cart_data)
                return Response({
                    'success': True,
                    'message': 'Producto agregado al carrito',
                    'cart': cart_serializer.data
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'error': f'Error al agregar al carrito: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Error en el servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class UpdateCartItemView(APIView):
    """
    Vista para actualizar la cantidad de un producto en el carrito
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # También permitir PUT para compatibilidad
        return self._update_cart_item(request)
    
    def put(self, request):
        return self._update_cart_item(request)
    
    def _update_cart_item(self, request):
        serializer = UpdateCartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            quantity = serializer.validated_data['quantity']
            
            producto = get_object_or_404(Producto, id=product_id, is_active=True)
            cart = Cart(request)
            
            # Si quantity es 0, eliminar del carrito
            if quantity == 0:
                cart.remove(producto)
                message = 'Producto eliminado del carrito'
            else:
                # Verificar stock
                if quantity > producto.stock:
                    return Response({
                        'error': f'Stock insuficiente. Disponible: {producto.stock}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                cart.update_quantity(producto, quantity)
                message = 'Cantidad actualizada'
            
            # Retornar estado actualizado del carrito
            cart_data = {
                'items': cart.get_items(),
                'total_price': cart.get_total_price(),
                'total_items': len(cart),
                'is_empty': cart.is_empty
            }
            
            cart_serializer = CartSerializer(cart_data)
            return Response({
                'message': message,
                'cart': cart_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class RemoveFromCartView(APIView):
    """
    Vista para eliminar un producto del carrito
    """
    permission_classes = [AllowAny]
    
    def delete(self, request):
        serializer = RemoveFromCartSerializer(data=request.data)
        
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            producto = get_object_or_404(Producto, id=product_id)
            
            cart = Cart(request)
            cart.remove(producto)
            
            # Retornar estado actualizado del carrito
            cart_data = {
                'items': cart.get_items(),
                'total_price': cart.get_total_price(),
                'total_items': len(cart),
                'is_empty': cart.is_empty
            }
            
            cart_serializer = CartSerializer(cart_data)
            return Response({
                'message': 'Producto eliminado del carrito',
                'cart': cart_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ClearCartView(APIView):
    """
    Vista para limpiar completamente el carrito
    """
    permission_classes = [AllowAny]
    
    def delete(self, request):
        cart = Cart(request)
        cart.clear()
        
        return Response({
            'message': 'Carrito limpiado',
            'cart': {
                'items': [],
                'total_price': 0,
                'total_items': 0,
                'is_empty': True
            }
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CartSummaryView(APIView):
    """
    Vista para obtener un resumen rápido del carrito (solo totales)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        cart = Cart(request)
        
        return Response({
            'total_items': len(cart),
            'total_price': cart.get_total_price(),
            'is_empty': cart.is_empty
        }, status=status.HTTP_200_OK)
