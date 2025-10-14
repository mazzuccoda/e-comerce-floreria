'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CartItem {
  producto: {
    id: number;
    nombre: string;
    precio: string;
    imagen_principal?: string;
  };
  quantity: number;
  price: string;
  total_price: string;
}

interface Cart {
  items: CartItem[];
  total_price: string;
  total_items: number;
  is_empty: boolean;
}

// Función auxiliar para obtener la URL base de la API
const getApiBaseUrl = (): string => {
  // Usar variable de entorno (incluye /api al final)
  return process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
};

const CartPage = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBaseUrl = getApiBaseUrl();
      console.log('📡 Conectando con API en:', `${apiBaseUrl}/carrito/simple/`);
        
      const response = await fetch(`${apiBaseUrl}/carrito/simple/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCart(data);
    } catch (err: any) {
      console.error('❌ Error fetching cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItem(productId);
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('📡 Enviando actualización a:', `${apiBaseUrl}/carrito/simple/update/`);
        
      const response = await fetch(`${apiBaseUrl}/carrito/simple/update/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        await fetchCart();
      } else {
        console.error('Error en respuesta:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (productId: number) => {
    setUpdatingItem(productId);
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('📡 Eliminando producto:', `${apiBaseUrl}/carrito/simple/remove/`);
        
      const response = await fetch(`${apiBaseUrl}/carrito/simple/remove/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ product_id: productId })
      });

      if (response.ok) {
        await fetchCart();
      } else {
        console.error('Error en respuesta:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setUpdatingItem(null);
    }
  };

  const clearCart = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('📡 Vaciando carrito:', `${apiBaseUrl}/carrito/simple/clear/`);
        
      const response = await fetch(`${apiBaseUrl}/carrito/simple/clear/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        await fetchCart();
      } else {
        console.error('Error en respuesta:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error de Conexión</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchCart}
            className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🛒 Tu Carrito</h1>
          <p className="text-gray-600">
            {cart?.total_items || 0} {cart?.total_items === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        {cart?.is_empty ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-8xl mb-6">🌸</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-8">¡Descubre nuestros hermosos arreglos florales!</p>
            <Link 
              href="/" 
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition font-medium"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart?.items?.map((item) => (
                <div key={item.producto.id} className="bg-white rounded-lg shadow-sm p-6 flex gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.producto.imagen_principal ? (
                      <img 
                        src={item.producto.imagen_principal}
                        alt={item.producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        🌸
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{item.producto.nombre}</h3>
                    <p className="text-green-700 font-medium">${item.price}</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.quantity - 1)}
                        disabled={updatingItem === item.producto.id || item.quantity <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.quantity + 1)}
                        disabled={updatingItem === item.producto.id}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.producto.id)}
                        disabled={updatingItem === item.producto.id}
                        className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-bold text-gray-800">${item.total_price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart?.total_items} {cart?.total_items === 1 ? 'producto' : 'productos'})</span>
                    <span>${cart?.total_price}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-green-600">A calcular</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-700">${cart?.total_price}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-green-700 text-white text-center py-3 rounded-lg hover:bg-green-800 transition font-medium mb-3"
                >
                  Proceder al Checkout
                </Link>

                <Link
                  href="/"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Seguir Comprando
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Entrega garantizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Flores frescas del día</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Pago seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
