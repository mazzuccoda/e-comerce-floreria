'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CartItem {
  producto: {
    id: number;
    nombre: string;
    descripcion: string;
    precio: string;
    stock: number;
    imagen_principal: string;
  };
  quantity: number;
  price: number;
  total_price: number;
}

interface CartData {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

const CartPageNew = () => {
  const [cart, setCart] = useState<CartData>({
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:8000/api';

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/carrito/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cart data from server:', data);
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Set empty cart on error
      setCart({
        items: [],
        total_price: 0,
        total_items: 0,
        is_empty: true
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/carrito/update/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: number) => {
    await updateQuantity(productId, 0);
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/carrito/clear/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err.message : 'Error al limpiar carrito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchCart}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🛒 Tu Carrito</h1>
        {!cart.is_empty && (
          <button
            onClick={clearCart}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            🗑️ Vaciar carrito
          </button>
        )}
      </div>

      {cart.is_empty ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">¡Descubre nuestros hermosos arreglos florales!</p>
          <Link 
            href="/productos" 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 inline-block"
          >
            🌸 Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">
              Productos ({cart.total_items} {cart.total_items === 1 ? 'item' : 'items'})
            </h2>
            
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.producto.id} className="border rounded-lg p-4 flex items-center space-x-4">
                  <img
                    src={item.producto.imagen_principal || 'https://via.placeholder.com/100x100/f0f0f0/666666?text=🌸'}
                    alt={item.producto.nombre}
                    className="w-20 h-20 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/100x100/f0f0f0/666666?text=🌸';
                    }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold">{item.producto.nombre}</h3>
                    <p className="text-gray-600 text-sm">{item.producto.descripcion}</p>
                    <p className="text-lg font-bold">{formatPrice(item.price)} c/u</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.quantity - 1)}
                      className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded flex items-center justify-center"
                    >
                      −
                    </button>
                    
                    <span className="w-12 text-center font-bold">{item.quantity}</span>
                    
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.quantity + 1)}
                      disabled={item.quantity >= item.producto.stock}
                      className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 w-8 h-8 rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(item.total_price)}</p>
                    <button
                      onClick={() => removeFromCart(item.producto.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">💰 Resumen del pedido</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.total_items} items)</span>
                  <span>{formatPrice(cart.total_price)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>🚚 Envío</span>
                  <span className="text-green-600">Gratis</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.total_price)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  href="/checkout" 
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 block text-center"
                >
                  💳 Finalizar compra
                </Link>
                
                <Link 
                  href="/productos" 
                  className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 block text-center"
                >
                  🌸 Continuar comprando
                </Link>
              </div>

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <div>✅ Envío gratuito en CABA</div>
                <div>✅ Flores frescas garantizadas</div>
                <div>✅ Pago seguro con Mercado Pago</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPageNew;
