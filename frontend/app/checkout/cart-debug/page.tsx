'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Interfaz para el tipo de datos del carrito
interface CartItem {
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagen: string;
  };
  quantity: number;
  price: number;
  total_price: number;
}

interface Cart {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

export default function CartDebugPage() {
  const [cart, setCart] = useState<Cart>({
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('http://localhost/api/carrito/simple/');

  // Cargar carrito directamente
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Cargando carrito desde: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('📡 Status:', response.status, response.statusText);
      console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      
      // Normalizar datos
      const normalizedCart = {
        items: Array.isArray(data.items) ? data.items : [],
        total_price: parseFloat(data.total_price) || 0,
        total_items: parseInt(data.total_items) || 0,
        is_empty: Boolean(data.is_empty)
      };
      
      setCart(normalizedCart);
    } catch (err) {
      console.error('❌ Error cargando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [apiUrl]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🛒 Debug de Carrito</h1>
      
      {/* Control Panel */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Panel de Control</h2>
        
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={loadCart}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Cargando...' : '🔄 Recargar Carrito'}
          </button>
          
          <button 
            onClick={() => setApiUrl('http://localhost/api/carrito/simple/')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            API Normal
          </button>
          
          <button 
            onClick={() => setApiUrl('http://localhost:8000/api/carrito/simple/')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            API Directo (Puerto 8000)
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          URL actual: <span className="font-mono bg-gray-100 px-1 rounded">{apiUrl}</span>
        </div>
      </div>
      
      {/* Status */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Estado</h2>
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            ❌ Error: {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Items</div>
            <div className="text-2xl font-bold">{cart.total_items}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">${cart.total_price.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Productos</div>
            <div className="text-2xl font-bold">{cart.items.length}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Estado</div>
            <div className="text-2xl font-bold">
              {cart.is_empty ? '❌ Vacío' : '✅ Con productos'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cart Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Productos en el Carrito</h2>
        
        {cart.items.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
            No hay productos en el carrito
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {cart.items.map((item, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  {item.producto.imagen ? (
                    <img 
                      src={`http://localhost${item.producto.imagen}`} 
                      alt={item.producto.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🌸</span>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="font-medium">{item.producto.nombre}</div>
                  <div className="text-sm text-gray-500">
                    ${Number(item.price).toFixed(2)} × {item.quantity} = ${Number(item.total_price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Raw Data */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Datos Raw</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(cart, null, 2)}
        </pre>
      </div>
      
      {/* Navigation */}
      <div className="flex gap-4">
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Volver al Inicio
        </Link>
        
        <Link 
          href="/checkout/multistep"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ir al Checkout →
        </Link>
      </div>
    </div>
  );
}
