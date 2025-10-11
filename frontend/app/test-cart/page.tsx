'use client';

import React, { useEffect } from 'react';
import { useCartRobust } from '@/context/CartContextRobust';

export default function TestCartPage() {
  const { cart, loading, error } = useCartRobust();

  useEffect(() => {
    console.log('=== TEST CART PAGE ===');
    console.log('Cart:', cart);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Items count:', cart?.items?.length);
    console.log('Total items:', cart?.total_items);
    console.log('======================');
  }, [cart, loading, error]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🧪 Test de Carrito</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Estado del Carrito</h2>
        
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? '✅ Sí' : '❌ No'}</p>
          <p><strong>Error:</strong> {error || '✅ Ninguno'}</p>
          <p><strong>Total Items:</strong> {cart?.total_items || 0}</p>
          <p><strong>Total Price:</strong> ${cart?.total_price || 0}</p>
          <p><strong>Is Empty:</strong> {cart?.is_empty ? '✅ Sí' : '❌ No'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Productos en el Carrito</h2>
        
        {cart?.items && cart.items.length > 0 ? (
          <div className="space-y-4">
            {cart.items.map((item: any, index: number) => (
              <div key={index} className="border-b pb-4">
                <p><strong>Producto:</strong> {item.producto?.nombre || 'Sin nombre'}</p>
                <p><strong>Cantidad:</strong> {item.quantity}</p>
                <p><strong>Precio:</strong> ${item.price}</p>
                <p><strong>Total:</strong> ${item.total_price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay productos en el carrito</p>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📋 Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ve a la página principal</li>
          <li>Agrega productos al carrito</li>
          <li>Vuelve a esta página</li>
          <li>Verifica que los productos aparezcan aquí</li>
        </ol>
      </div>

      <div className="mt-6">
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(cart, null, 2)}
        </pre>
      </div>
    </div>
  );
}
