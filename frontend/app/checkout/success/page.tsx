'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido');

  if (!pedidoId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">No se encontró el ID del pedido</p>
          <Link href="/" className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center">
          {/* Icono de éxito */}
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

          {/* Información del pedido */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 mb-12">
            <div className="flex items-center mb-10">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mr-5 shadow-lg shadow-green-500/25"></div>
              <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Detalles del Pedido</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Número de pedido:</span>
                <span className="text-lg font-medium text-gray-900">#{pedidoId}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Estado:</span>
                <span className="inline-block px-6 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-lg font-medium shadow-lg shadow-green-500/10">
                  ✅ Confirmado
                </span>
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
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
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-medium mr-6 shadow-xl shadow-green-500/25">
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

          {/* Botones de acción */}
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
