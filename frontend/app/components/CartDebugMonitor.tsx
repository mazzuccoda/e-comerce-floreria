'use client';

import React, { useEffect, useState } from 'react';
import { useCartRobust } from '../../context/CartContextRobust';

const CartDebugMonitor = () => {
  const { cart, loading, error } = useCartRobust();
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = `${timestamp} - Cart: ${cart?.total_items || 0} items, Loading: ${loading}`;
    setLogs(prev => [...prev.slice(-9), newLog]); // Mantener solo los últimos 10 logs
  }, [cart, loading]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Mostrar Debug del Carrito"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🛒 Cart Debug Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div className="bg-gray-100 p-2 rounded">
          <strong>Estado Actual:</strong><br/>
          Items: {cart?.total_items || 0}<br/>
          Total: ${cart?.total_price || 0}<br/>
          Vacío: {cart?.is_empty ? 'Sí' : 'No'}<br/>
          Cargando: {loading ? 'Sí' : 'No'}<br/>
          {error && <span className="text-red-500">Error: {error}</span>}
        </div>
        
        <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
          <strong>Historial:</strong><br/>
          {logs.map((log, index) => (
            <div key={index} className="text-xs text-gray-600">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartDebugMonitor;
