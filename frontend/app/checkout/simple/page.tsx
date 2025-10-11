'use client';

import React from 'react';

export default function SimpleCheckout() {
  const createOrder = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/pedidos/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_comprador: 'Test User',
          email_comprador: 'test@test.com',
          telefono_comprador: '123456789',
          nombre_destinatario: 'Test Recipient',
          telefono_destinatario: '987654321',
          direccion: 'Test Address 123',
          ciudad: 'Buenos Aires',
          codigo_postal: '1000',
          fecha_entrega: '2025-01-10',
          franja_horaria: 'mañana',
          metodo_envio_id: 1,
          dedicatoria: 'Test order',
          instrucciones: '',
          regalo_anonimo: false,
          medio_pago: 'mercadopago'
        }),
        credentials: 'include',
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Order created! ID: ${result.pedido.id}`);
        window.location.href = `/checkout/success?pedido=${result.pedido.id}`;
      } else {
        alert(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Connection error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Simple Checkout Test</h1>
        
        <button
          onClick={createOrder}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Create Test Order
        </button>
        
        <div className="mt-4 text-sm text-gray-600">
          This is a minimal test page to isolate the order creation issue.
        </div>
      </div>
    </div>
  );
}
