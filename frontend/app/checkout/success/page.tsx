'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface PedidoItem {
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagen_principal?: string;
  };
  quantity: number;
  price: number;
}

interface PedidoData {
  pedido_id: number;
  numero_pedido: string;
  total: string;
  items: PedidoItem[];
  comprador: {
    nombre: string;
    email: string;
    telefono: string;
  };
  destinatario: {
    nombre: string;
    telefono: string;
    direccion: string;
    ciudad: string;
  };
  dedicatoria?: {
    mensaje: string;
    firmadoComo: string;
    incluirTarjeta: boolean;
  };
  fecha_entrega: string;
  franja_horaria?: string;
  metodo_envio?: string;
  costo_envio?: number;
  medio_pago: string;
}

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);

  useEffect(() => {
    // Cargar datos del pedido desde localStorage
    const storedData = localStorage.getItem('ultimo_pedido');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPedidoData(data);
        console.log('📦 Datos del pedido cargados:', data);
      } catch (error) {
        console.error('Error al parsear datos del pedido:', error);
      }
    }
  }, []);

  // Función para generar mensaje de WhatsApp completo
  const generateWhatsAppMessage = () => {
    if (!pedidoData) return '';

    // Formatear productos con subtotales
    const productosTexto = pedidoData.items
      .map((item) => {
        const subtotal = (item.price * item.quantity).toFixed(2);
        return `• ${item.producto.nombre}\n  Cantidad: ${item.quantity} | Precio: $${item.price} | Subtotal: $${subtotal}`;
      })
      .join('\n\n');

    // Calcular subtotal de productos
    const subtotalProductos = pedidoData.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // Formatear método de pago
    const metodoPagoTexto = {
      'mercadopago': 'Mercado Pago',
      'paypal': 'PayPal',
      'transferencia': 'Transferencia Bancaria',
      'efectivo': 'Efectivo'
    }[pedidoData.medio_pago] || pedidoData.medio_pago;

    // Agregar dedicatoria si existe
    let dedicatoriaTexto = '';
    if (pedidoData.dedicatoria && pedidoData.dedicatoria.mensaje) {
      dedicatoriaTexto = 
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💌 *DEDICATORIA:*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `"${pedidoData.dedicatoria.mensaje}"\n` +
        (pedidoData.dedicatoria.firmadoComo ? `Firmado: ${pedidoData.dedicatoria.firmadoComo}\n` : '') +
        `${pedidoData.dedicatoria.incluirTarjeta ? '📝 Incluir tarjeta' : ''}\n\n`;
    }

    return encodeURIComponent(
      `¡Hola! Necesito asistencia con mi pedido:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *PEDIDO #${pedidoData.numero_pedido}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      
      `🛍️ *PRODUCTOS COMPRADOS:*\n` +
      `${productosTexto}\n\n` +
      `Subtotal productos: $${subtotalProductos.toLocaleString('es-AR')}\n` +
      (pedidoData.costo_envio && pedidoData.costo_envio > 0 
        ? `Costo de envío: $${pedidoData.costo_envio.toLocaleString('es-AR')}\n` 
        : '') +
      `💰 *TOTAL: $${pedidoData.total}*\n\n` +
      
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *DATOS DEL REMITENTE:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Nombre: ${pedidoData.comprador.nombre}\n` +
      `Email: ${pedidoData.comprador.email}\n` +
      `Teléfono: ${pedidoData.comprador.telefono}\n\n` +
      
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *DATOS DE ENTREGA:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Destinatario: ${pedidoData.destinatario.nombre}\n` +
      `Teléfono: ${pedidoData.destinatario.telefono}\n` +
      `Dirección: ${pedidoData.destinatario.direccion}\n` +
      `Ciudad: ${pedidoData.destinatario.ciudad}\n` +
      `📅 Fecha de entrega: ${pedidoData.fecha_entrega}\n` +
      `🚚 Método de envío: ${(() => {
        if (pedidoData.metodo_envio === 'retiro') return '🏪 Retiro en tienda';
        if (pedidoData.metodo_envio === 'express') return '⚡ Envío Express (2-4 horas)';
        if (pedidoData.metodo_envio === 'programado') {
          const franja = pedidoData.franja_horaria === 'manana' ? 'Mañana (9:00-12:00)' : 'Tarde (16:00-20:00)';
          return `📅 Envío Programado (${franja})`;
        }
        return 'No especificado';
      })()}\n\n` +
      
      dedicatoriaTexto +
      
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 *FORMA DE PAGO:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${metodoPagoTexto}\n\n` +
      
      `¿Podrían ayudarme con este pedido? 🙏`
    );
  };

  // Función para abrir WhatsApp con el mensaje
  const handleWhatsAppClick = () => {
    const mensaje = generateWhatsAppMessage();
    const url = `https://wa.me/543813671352?text=${mensaje}`;
    console.log('📱 Abriendo WhatsApp con mensaje:', decodeURIComponent(mensaje));
    window.open(url, '_blank');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
        
        {/* Hero Section - Limpio y elegante */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-xl animate-scaleIn">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Pedido <span className="font-mono font-semibold text-green-600">#{pedidoData?.numero_pedido || pedidoId}</span>
          </p>
          <p className="text-base text-gray-500">
            Tu pedido está siendo preparado con amor 💚
          </p>
        </div>

        {/* Timeline de Estado del Pedido */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estado del Pedido
          </h2>
          
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-green-300 to-gray-200"></div>
            
            <div className="space-y-8">
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-gray-900">Pedido Confirmado</h3>
                  <p className="text-sm text-gray-500 mt-1">Tu pedido ha sido recibido y confirmado</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completado ✓</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-green-400 rounded-full shadow-lg flex-shrink-0 animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-gray-900">En Preparación</h3>
                  <p className="text-sm text-gray-500 mt-1">Estamos preparando tu pedido con cuidado</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">En proceso...</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full shadow flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-gray-400">Listo para Envío</h3>
                  <p className="text-sm text-gray-400 mt-1">Te avisaremos cuando esté listo</p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full shadow flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-gray-400">En Camino</h3>
                  <p className="text-sm text-gray-400 mt-1">{pedidoData?.metodo_envio === 'retiro' ? 'Listo para retiro' : `Fecha estimada: ${pedidoData?.fecha_entrega || 'Por confirmar'}`}</p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full shadow flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-gray-400">Entregado</h3>
                  <p className="text-sm text-gray-400 mt-1">Te confirmaremos la entrega</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos Comprados */}
        {pedidoData && pedidoData.items && pedidoData.items.length > 0 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Tu Compra
            </h2>
            
            <div className="space-y-4">
              {pedidoData.items.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  {item.producto.imagen_principal && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={item.producto.imagen_principal}
                        alt={item.producto.nombre}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{item.producto.nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Cantidad:</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900">${item.price.toLocaleString('es-AR')} c/u</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <span className="text-xs text-gray-500 mb-1">Subtotal</span>
                    <span className="text-lg sm:text-xl font-bold text-green-600">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
              
              {/* Totales */}
              <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal productos</span>
                  <span className="font-semibold">${pedidoData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('es-AR')}</span>
                </div>
                
                {pedidoData.costo_envio !== undefined && pedidoData.costo_envio > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      {pedidoData.metodo_envio === 'express' && '⚡ Envío Express'}
                      {pedidoData.metodo_envio === 'programado' && '📅 Envío Programado'}
                      {pedidoData.metodo_envio === 'retiro' && '🏪 Retiro en tienda'}
                      {!pedidoData.metodo_envio && '🚚 Envío'}
                    </span>
                    <span className="font-semibold">${pedidoData.costo_envio.toLocaleString('es-AR')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">${parseFloat(pedidoData.total).toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicatoria */}
        {pedidoData?.dedicatoria?.mensaje && (
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 sm:p-8 shadow-lg border border-pink-200 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💌</span>
              Dedicatoria
            </h2>
            
            <div className="bg-white rounded-xl p-6 border border-pink-100">
              <p className="text-lg text-gray-800 italic leading-relaxed mb-3">
                "{pedidoData.dedicatoria.mensaje}"
              </p>
              {pedidoData.dedicatoria.firmadoComo && (
                <p className="text-right text-gray-700 font-medium">
                  — {pedidoData.dedicatoria.firmadoComo}
                </p>
              )}
              {pedidoData.dedicatoria.incluirTarjeta && (
                <div className="mt-4 flex items-center gap-2 text-pink-600 text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                  </svg>
                  <span className="font-medium">Se incluirá tarjeta impresa</span>
                </div>
              )}
            </div>
          </div>
        )}

          {/* Información del pedido */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl shadow-gray-900/5 border border-white/20 mb-6 sm:mb-8 md:mb-12">
            <div className="flex items-center mb-4 sm:mb-6 md:mb-8">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mr-2 sm:mr-3 md:mr-5 shadow-lg shadow-green-500/25"></div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">Detalles del Pedido</h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-200 gap-1">
                <span className="text-sm sm:text-base text-gray-600">Número de pedido:</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">#{pedidoData?.numero_pedido || pedidoId}</span>
              </div>
              
              {pedidoData?.destinatario && (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-200 gap-1">
                    <span className="text-sm sm:text-base text-gray-600">Destinatario:</span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">{pedidoData.destinatario.nombre}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-200 gap-1">
                    <span className="text-sm sm:text-base text-gray-600">Dirección:</span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 text-left sm:text-right">{pedidoData.destinatario.direccion}, {pedidoData.destinatario.ciudad}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-200 gap-1">
                    <span className="text-sm sm:text-base text-gray-600">Fecha de entrega:</span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">{pedidoData.fecha_entrega}</span>
                  </div>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-2">
                <span className="text-sm sm:text-base text-gray-600">Estado:</span>
                <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm sm:text-base font-semibold shadow-md w-fit">
                  ✅ Confirmado
                </span>
              </div>
            </div>
          </div>

        {/* Próximos Pasos */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ¿Qué sigue ahora?
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirmación por email</h3>
                <p className="text-gray-600">Recibirás un mail de confirmación. También puedes <Link href={`/pedido/${pedidoData?.pedido_id}`} className="font-medium text-blue-600 hover:text-blue-700 underline">ver tu pedido aquí</Link></p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Nos contactaremos a la brevedad</h3>
                <p className="text-gray-600">También puedes comunicarte con nosotros por WhatsApp</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirmación de entrega</h3>
                <p className="text-gray-600">Te confirmaremos cuando tu pedido esté entregado</p>
              </div>
            </div>
          </div>
        </div>

          {/* Botón de WhatsApp */}
          <div className="mb-6 sm:mb-8 px-4 sm:px-0">
            <button
              onClick={handleWhatsAppClick}
              className="group bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-10 rounded-2xl sm:rounded-3xl hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300 font-medium text-base sm:text-lg md:text-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto cursor-pointer mx-auto shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Informar al Vendedor</span>
            </button>
            <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-sm px-4">¿Necesitas ayuda? Contáctanos por WhatsApp</p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl sm:rounded-3xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 font-medium text-base sm:text-lg transform hover:scale-[1.02] active:scale-[0.98] text-center shadow-lg"
            >
              🏠 Volver al inicio
            </Link>
            
            <Link
              href="/productos"
              className="bg-white text-gray-900 py-3 sm:py-4 px-6 sm:px-8 rounded-2xl sm:rounded-3xl hover:shadow-xl border-2 border-gray-200 transition-all duration-300 font-medium text-base sm:text-lg transform hover:scale-[1.02] active:scale-[0.98] text-center"
            >
              🛑️ Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
