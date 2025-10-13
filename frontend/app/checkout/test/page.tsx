'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';

export const dynamic = 'force-dynamic';

export default function TestCheckout() {
  const [testMessage, setTestMessage] = useState('Inicial');
  const { cart, clearCart } = useCart();

  const handleSimpleTest = () => {
    setTestMessage('¡Botón funciona!');
    alert('¡Test exitoso!');
  };

  const handleCreateOrder = async () => {
    try {
      alert('Iniciando creación de pedido...');
      
      const orderData = {
        nombre_comprador: 'Test Usuario',
        email_comprador: 'test@test.com',
        telefono_comprador: '123456789',
        nombre_destinatario: 'Test Destinatario',
        telefono_destinatario: '987654321',
        direccion: 'Test Direccion 123',
        ciudad: 'Buenos Aires',
        codigo_postal: '1000',
        fecha_entrega: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        franja_horaria: 'mañana',
        metodo_envio_id: 1,
        dedicatoria: 'Test dedicatoria',
        instrucciones: '',
        regalo_anonimo: false,
        medio_pago: 'mercadopago'
      };

      console.log('Enviando datos:', orderData);

      const response = await fetch('http://localhost:8000/api/pedidos/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        credentials: 'include',
      });

      const result = await response.json();
      console.log('Respuesta:', result);

      if (response.ok) {
        alert(`¡Pedido creado! ID: ${result.pedido.id}`);
        await clearCart();
        window.location.href = `/checkout/success?pedido=${result.pedido.id}`;
      } else {
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Test Checkout</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <strong>Estado:</strong> {testMessage}
            <br />
            <strong>Carrito:</strong> {cart.items?.length || 0} productos
            <br />
            <strong>Total:</strong> ${cart.total_price || 0}
          </div>

          <button
            onClick={handleSimpleTest}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            🧪 Test Simple
          </button>

          <button
            onClick={handleCreateOrder}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            🎉 Crear Pedido de Prueba
          </button>

          <a
            href="/checkout/multistep"
            className="block w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-center"
          >
            ← Volver al Checkout Original
          </a>
        </div>
      </div>
    </div>
  );
}
