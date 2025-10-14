'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PedidoItem {
  id: number;
  producto_nombre: string;
  cantidad: number;
  precio: string;
}

interface Pedido {
  id: number;
  numero_pedido: string;
  estado: string;
  estado_display: string;
  total: string;
  creado: string;
  medio_pago: string;
  medio_pago_display: string;
  nombre_comprador: string;
  email_comprador: string;
  telefono_comprador: string;
  nombre_destinatario: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  telefono_destinatario: string;
  fecha_entrega: string;
  franja_horaria: string;
  dedicatoria: string;
  instrucciones: string;
  items: PedidoItem[];
}

const PedidoDetallePage: React.FC = () => {
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params?.id;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchPedido = async () => {
      if (!token || !pedidoId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost/api/pedidos/simple/${pedidoId}/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setPedido(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Error al cargar el pedido');
        }
      } catch (err) {
        console.error('Error cargando pedido:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && token && pedidoId) {
      fetchPedido();
    }
  }, [isAuthenticated, token, pedidoId]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Pedido no encontrado'}
        </div>
        <Link href="/mis-pedidos" className="text-pink-600 hover:underline">
          ← Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const subtotal = pedido.items.reduce((sum, item) => 
    sum + (parseFloat(item.precio) * item.cantidad), 0
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/mis-pedidos" className="text-pink-600 hover:underline flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Mis Pedidos
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pedido #{pedido.numero_pedido}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(pedido.creado).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
              pedido.estado === 'confirmado' ? 'bg-blue-100 text-blue-800' :
              pedido.estado === 'en_camino' ? 'bg-purple-100 text-purple-800' :
              pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {pedido.estado_display || pedido.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Datos del Comprador</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Nombre:</span> {pedido.nombre_comprador}</p>
              <p><span className="font-medium">Email:</span> {pedido.email_comprador}</p>
              <p><span className="font-medium">Teléfono:</span> {pedido.telefono_comprador}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Datos de Entrega</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Destinatario:</span> {pedido.nombre_destinatario}</p>
              <p><span className="font-medium">Dirección:</span> {pedido.direccion}</p>
              {pedido.ciudad && <p><span className="font-medium">Ciudad:</span> {pedido.ciudad}</p>}
              <p><span className="font-medium">Teléfono:</span> {pedido.telefono_destinatario}</p>
              <p><span className="font-medium">Fecha:</span> {new Date(pedido.fecha_entrega).toLocaleDateString('es-AR')}</p>
              <p><span className="font-medium">Horario:</span> {pedido.franja_horaria === 'mañana' ? 'Mañana (9-12hs)' : 'Tarde (16-20hs)'}</p>
            </div>
          </div>
        </div>

        {pedido.dedicatoria && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Dedicatoria</h3>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <p className="italic">{pedido.dedicatoria}</p>
            </div>
          </div>
        )}

        {pedido.instrucciones && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Instrucciones Especiales</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>{pedido.instrucciones}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Productos</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Producto</th>
                  <th className="text-center p-4">Cantidad</th>
                  <th className="text-right p-4">Precio Unit.</th>
                  <th className="text-right p-4">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4">{item.producto_nombre}</td>
                    <td className="text-center p-4">{item.cantidad}</td>
                    <td className="text-right p-4">${parseFloat(item.precio).toFixed(2)}</td>
                    <td className="text-right p-4 font-medium">
                      ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Método de pago:</span>
            <span className="font-medium">{pedido.medio_pago_display || pedido.medio_pago}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold mt-4 pt-4 border-t">
            <span>Total:</span>
            <span className="text-pink-600">${parseFloat(pedido.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoDetallePage;
