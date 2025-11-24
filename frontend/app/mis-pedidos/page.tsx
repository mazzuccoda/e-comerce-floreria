'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Pedido {
  id: number;
  numero_pedido: string;
  estado: string;
  total: string;
  creado: string;
  medio_pago: string;
  medio_pago_display?: string;
  items: any[];
  costo_envio?: string | number;
  tipo_envio?: string;
}

const MisPedidosPage: React.FC = () => {
  const { user, token, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Cargar pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      if (!token) {
        console.log('❌ No hay token, no se pueden cargar pedidos');
        return;
      }
      
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
        console.log('🔍 Cargando pedidos desde:', `${apiUrl}/pedidos/simple/mis-pedidos/`);
        console.log('🔑 Token:', token ? `${token.substring(0, 10)}...` : 'No hay token');
        
        const response = await fetch(`${apiUrl}/pedidos/simple/mis-pedidos/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Pedidos recibidos:', data);
          console.log('📦 Array de pedidos:', data.pedidos);
          console.log('📊 Cantidad de pedidos:', data.pedidos?.length || 0);
          
          // Log para verificar si costo_envio viene del backend
          if (data.pedidos && data.pedidos.length > 0) {
            console.log('🔍 Primer pedido completo:', JSON.stringify(data.pedidos[0], null, 2));
            console.log('💰 Costo envío:', data.pedidos[0].costo_envio);
            console.log('🚚 Tipo envío:', data.pedidos[0].tipo_envio);
            console.log('📊 Total:', data.pedidos[0].total);
            console.log('🔑 Campos disponibles:', Object.keys(data.pedidos[0]));
          }
          
          setPedidos(data.pedidos || []);
        } else {
          const errorData = await response.json();
          console.error('❌ Error del servidor:', errorData);
          setError(errorData.error || 'Error al cargar pedidos');
        }
      } catch (err) {
        console.error('❌ Error cargando pedidos:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && token) {
      console.log('✅ Usuario autenticado, cargando pedidos...');
      fetchPedidos();
    } else {
      console.log('❌ Usuario no autenticado o sin token');
    }
  }, [isAuthenticated, token]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Pedidos</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aún no tienes pedidos
            </h3>
            <p className="text-gray-500 mb-6">
              Cuando realices tu primer pedido, aparecerá aquí con toda la información de seguimiento.
            </p>
            <button
              onClick={() => router.push('/productos')}
              className="bg-green-700 text-white px-6 py-3 rounded-md hover:bg-green-800 transition-colors"
            >
              Explorar Productos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pedido #{pedido.numero_pedido}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(pedido.creado).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      pedido.estado === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                      pedido.estado === 'en_camino' ? 'bg-purple-100 text-purple-800' :
                      pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pedido.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium">{pedido.medio_pago_display || pedido.medio_pago}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{pedido.items?.length || 0} items</span>
                  </div>
                  
                  {/* Desglose de costos */}
                  {pedido.costo_envio && parseFloat(String(pedido.costo_envio)) > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal productos:</span>
                        <span className="font-medium">
                          ${(parseFloat(pedido.total) - parseFloat(String(pedido.costo_envio))).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {pedido.tipo_envio === 'express' ? 'Envío Express' :
                           pedido.tipo_envio === 'programado' ? 'Envío Programado' :
                           pedido.tipo_envio === 'retiro' ? 'Retiro en tienda' : 'Envío'}:
                        </span>
                        <span className="font-medium">${parseFloat(String(pedido.costo_envio)).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                    <span>Total:</span>
                    <span className="text-green-700">${parseFloat(pedido.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push(`/pedido/${pedido.id}`)}
                  className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisPedidosPage;
