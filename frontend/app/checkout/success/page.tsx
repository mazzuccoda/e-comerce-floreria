'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PedidoData {
  id: number;
  nombre_comprador: string;
  nombre_destinatario: string;
  total: number;
  estado: string;
  creado: string;
}

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidoData = async () => {
      if (!pedidoId) {
        setError('No se encontró el ID del pedido');
        setLoading(false);
        return;
      }

      try {
        // Usar nginx como proxy para mantener consistencia con el resto de la app
        const apiUrl = `http://localhost/api/pedidos/${pedidoId}/`;
        
        console.log('🔄 Intentando cargar datos del pedido desde:', apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',  // Importante para mantener la sesión
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('📡 Estado de respuesta:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Datos del pedido cargados:', data);
          setPedidoData(data);
        } else {
          const errorText = await response.text().catch(() => '');
          console.error('❌ Error al cargar el pedido:', response.status, errorText);
          setError(`No se pudo cargar la información del pedido (${response.status})`);
        }
      } catch (err) {
        console.error('❌ Error de conexión:', err);
        setError('Error de conexión al servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidoData();
  }, [pedidoId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-light text-gray-900">Cargando información del pedido...</h2>
          <p className="text-gray-600 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Link href="/" className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Si no hay datos del pedido pero no hay error, mostrar mensaje genérico de éxito
  if (!pedidoData && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
        <div className="container mx-auto px-6 py-16 max-w-4xl">
          <div className="text-center">
            {/* Icono de éxito */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-8 shadow-2xl shadow-green-500/25">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-5xl font-extralight text-gray-900 mb-6 tracking-tight">
                🎉 ¡Pedido Confirmado! 🎉
              </h1>
              <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
                Tu pedido ha sido procesado exitosamente. Gracias por tu compra.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
              <h3 className="text-xl font-medium mb-4">Pedido #{pedidoId}</h3>
              <p className="mb-4">
                Hemos recibido tu pedido correctamente. Recibirás un correo electrónico con los detalles pronto.
              </p>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
              >
                🏠 Volver al inicio
              </Link>
              
              <Link
                href="/productos"
                className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                🛍️ Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sabemos que pedidoData no es null aquí porque ya verificamos arriba
  // Si llegó aquí, significa que tenemos datos del pedido

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center">
          {/* Icono de éxito Premium */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-8 shadow-2xl shadow-green-500/25 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-5xl font-extralight text-gray-900 mb-6 tracking-tight">
              🎉 ¡Pedido Confirmado! 🎉
            </h1>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Tu pedido ha sido procesado exitosamente y está siendo preparado con amor
            </p>
          </div>

          {/* Información del pedido Premium */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 mb-12">
            <div className="flex items-center mb-10">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mr-5 shadow-lg shadow-green-500/25"></div>
              <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Detalles del Pedido</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Número de pedido:</span>
                <span className="text-lg font-medium text-gray-900">#{pedidoData?.id || pedidoId || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Comprador:</span>
                <span className="text-lg font-medium text-gray-900">{pedidoData?.nombre_comprador || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Destinatario:</span>
                <span className="text-lg font-medium text-gray-900">{pedidoData?.nombre_destinatario || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Estado:</span>
                <span className="inline-block px-6 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-lg font-medium shadow-lg shadow-green-500/10">
                  ✅ {pedidoData?.estado || 'Confirmado'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-4 text-2xl font-light">
                <span className="text-gray-900">Total:</span>
                <span className="text-green-600 font-medium">${(pedidoData?.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Próximos pasos Premium */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 mb-12">
            <div className="flex items-center mb-10">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-5 shadow-lg shadow-blue-500/25"></div>
              <h3 className="text-3xl font-extralight text-gray-900 tracking-wide">¿Qué sigue ahora?</h3>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-medium mr-6 shadow-xl shadow-blue-500/25">
                  1
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-2">Confirmación por email</p>
                  <p className="text-gray-600 font-light">Recibirás un email con todos los detalles de tu pedido</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center text-lg font-medium mr-6 shadow-xl shadow-purple-500/25">
                  2
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-2">Preparación del pedido</p>
                  <p className="text-gray-600 font-light">Nuestro equipo comenzará a preparar tu arreglo floral con amor</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-medium mr-6 shadow-xl shadow-green-500/25">
                  3
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-2">Entrega</p>
                  <p className="text-gray-600 font-light">Te contactaremos para coordinar la entrega en la fecha seleccionada</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción Premium */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/"
              className="group bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-6 px-12 rounded-3xl hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center space-x-3">
                <span>🏠 Volver al inicio</span>
              </div>
            </Link>
            
            <Link
              href="/productos"
              className="group bg-white/60 backdrop-blur-sm text-gray-900 py-6 px-12 rounded-3xl hover:shadow-2xl hover:shadow-gray-900/5 border border-white/20 transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center space-x-3">
                <span>🛍️ Seguir comprando</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
