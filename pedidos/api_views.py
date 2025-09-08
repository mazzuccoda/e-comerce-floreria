from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Pedido, MetodoEnvio
from .serializers import (
    CheckoutSerializer,
    PedidoReadSerializer,
    MetodoEnvioSerializer,
    ValidateStockSerializer
)
from carrito.cart import Cart


class MetodoEnvioListView(APIView):
    """
    Vista para listar métodos de envío disponibles
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        metodos = MetodoEnvio.objects.filter(activo=True)
        serializer = MetodoEnvioSerializer(metodos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ValidateStockView(APIView):
    """
    Vista para validar stock antes del checkout
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ValidateStockSerializer(data={}, context={'request': request})
        
        if serializer.is_valid():
            return Response({
                'valid': True,
                'message': 'Stock disponible para todos los productos'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'valid': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class StockStatusView(APIView):
    """
    Vista para obtener el estado actual del stock de productos en el carrito
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        cart = Cart(request)
        
        if cart.is_empty:
            return Response({
                'items': [],
                'has_stock_issues': False
            }, status=status.HTTP_200_OK)
        
        stock_status = []
        has_issues = False
        
        for item in cart:
            producto = item['producto']
            cantidad = item['quantity']
            
            stock_info = {
                'product_id': producto.id,
                'product_name': producto.nombre,
                'requested_quantity': cantidad,
                'available_stock': producto.stock,
                'is_active': producto.is_active,
                'has_sufficient_stock': producto.stock >= cantidad and producto.is_active,
                'stock_difference': producto.stock - cantidad if producto.is_active else 0
            }
            
            if not stock_info['has_sufficient_stock']:
                has_issues = True
            
            stock_status.append(stock_info)
        
        return Response({
            'items': stock_status,
            'has_stock_issues': has_issues,
            'total_items': len(stock_status)
        }, status=status.HTTP_200_OK)


class CheckoutView(APIView):
    """
    Vista principal para procesar el checkout
    """
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request):
        # Validar que el carrito no esté vacío
        cart = Cart(request)
        if cart.is_empty:
            return Response({
                'error': 'El carrito está vacío'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar datos del checkout
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                # Crear el pedido
                pedido = serializer.save()
                
                # Serializar el pedido creado para la respuesta
                pedido_serializer = PedidoReadSerializer(pedido)
                
                return Response({
                    'success': True,
                    'message': 'Pedido creado exitosamente',
                    'pedido': pedido_serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'error': f'Error al procesar el pedido: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'error': 'Datos inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PedidoDetailView(APIView):
    """
    Vista para obtener detalles de un pedido específico
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id)
            
            # Verificar que el usuario tenga acceso al pedido
            if request.user.is_authenticated:
                if pedido.cliente != request.user:
                    return Response({
                        'error': 'No tienes acceso a este pedido'
                    }, status=status.HTTP_403_FORBIDDEN)
            else:
                # Para usuarios anónimos, podrían acceder con un token o email
                # Por ahora permitimos el acceso si conocen el ID
                pass
            
            serializer = PedidoReadSerializer(pedido)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Pedido.DoesNotExist:
            return Response({
                'error': 'Pedido no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class PedidoListView(APIView):
    """
    Vista para listar pedidos del usuario autenticado
    """
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({
                'error': 'Debes estar autenticado para ver tus pedidos'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        pedidos = Pedido.objects.filter(cliente=request.user).order_by('-creado')
        serializer = PedidoReadSerializer(pedidos, many=True)
        
        return Response({
            'pedidos': serializer.data
        }, status=status.HTTP_200_OK)


class CheckoutSummaryView(APIView):
    """
    Vista para obtener resumen del checkout (carrito + costos de envío)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        metodo_envio_id = request.data.get('metodo_envio_id')
        
        if not metodo_envio_id:
            return Response({
                'error': 'Se requiere método de envío'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            metodo_envio = MetodoEnvio.objects.get(id=metodo_envio_id, activo=True)
        except MetodoEnvio.DoesNotExist:
            return Response({
                'error': 'Método de envío no válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart = Cart(request)
        
        if cart.is_empty:
            return Response({
                'error': 'El carrito está vacío'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        subtotal = cart.get_total_price()
        costo_envio = metodo_envio.costo
        total = subtotal + costo_envio
        
        return Response({
            'subtotal': subtotal,
            'costo_envio': costo_envio,
            'total': total,
            'metodo_envio': MetodoEnvioSerializer(metodo_envio).data,
            'items_count': len(cart)
        }, status=status.HTTP_200_OK)
