'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const SimpleCartPage = () => {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Fetching cart directly from API...');
      
      const response = await fetch('http://localhost:8000/api/carrito/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Cart data received:', data);
      
      setCart(data);
    } catch (err: any) {
      console.error('❌ Error fetching cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando carrito directamente desde API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h1>
          <p className="text-gray-600 mb-4">Error: {error}</p>
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
      <h1 className="text-3xl font-bold mb-6">🛒 Carrito Simple (Sin Context)</h1>
      
      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2 text-green-800">✅ Conexión Directa API Exitosa</h2>
        <p className="text-green-700">Datos obtenidos directamente del backend sin Context</p>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Raw API Response:</h2>
        <pre className="text-sm overflow-auto bg-white p-2 rounded">
          {JSON.stringify(cart, null, 2)}
        </pre>
      </div>

      {cart?.is_empty ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega algunos productos para comenzar.</p>
          <Link 
            href="/productos" 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 inline-block"
          >
            🌸 Ver productos
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Productos: {cart?.total_items || 0} items
          </h2>
          <p className="mb-4 text-lg font-semibold">Total: ${cart?.total_price || 0}</p>
          
          {cart?.items?.map((item: any, index: number) => (
            <div key={index} className="border p-4 mb-4 rounded-lg bg-white shadow">
              <h3 className="font-bold text-lg">{item.producto?.nombre || 'Producto sin nombre'}</h3>
              <p className="text-gray-600">Cantidad: {item.quantity}</p>
              <p className="text-gray-600">Precio unitario: ${item.price}</p>
              <p className="font-semibold">Total: ${item.total_price}</p>
            </div>
          ))}
          
          <div className="mt-6 text-center">
            <Link 
              href="/checkout" 
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 inline-block text-lg font-semibold"
            >
              Proceder al Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCartPage;
