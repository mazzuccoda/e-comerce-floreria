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
  fecha_entrega: string;
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

    // Formatear método de pago
    const metodoPagoTexto = {
      'mercadopago': 'Mercado Pago',
      'paypal': 'PayPal',
      'transferencia': 'Transferencia Bancaria',
      'efectivo': 'Efectivo'
    }[pedidoData.medio_pago] || pedidoData.medio_pago;

    return encodeURIComponent(
      `¡Hola! Necesito asistencia con mi pedido:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *PEDIDO #${pedidoData.numero_pedido}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      
      `🛍️ *PRODUCTOS COMPRADOS:*\n` +
      `${productosTexto}\n\n` +
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
      `📅 Fecha de entrega: ${pedidoData.fecha_entrega}\n\n` +
      
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 *FORMA DE PAGO:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${metodoPagoTexto}\n\n` +
      
      `¿Podrían ayudarme con este pedido? 🙏`
    );
  };

  const whatsappUrl = `https://wa.me/543813671352?text=${generateWhatsAppMessage()}`;

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

          {/* Productos comprados */}
          {pedidoData && pedidoData.items && pedidoData.items.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 mb-12">
              <div className="flex items-center mb-10">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mr-5 shadow-lg shadow-purple-500/25"></div>
                <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Productos Comprados</h2>
              </div>
              
              <div className="space-y-6">
                {pedidoData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-6 p-6 bg-white/40 rounded-2xl border border-gray-100">
                    {item.producto.imagen_principal && (
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                        <Image
                          src={item.producto.imagen_principal}
                          alt={item.producto.nombre}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{item.producto.nombre}</h3>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-lg">Cantidad: <span className="font-medium text-gray-900">{item.quantity}</span></span>
                        <span className="text-lg">Precio: <span className="font-medium text-green-600">${item.price}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                      <p className="text-2xl font-medium text-green-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                {/* Total */}
                <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
                  <span className="text-2xl font-light text-gray-900">Total:</span>
                  <span className="text-3xl font-medium text-green-600">${pedidoData.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Información del pedido */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 mb-12">
            <div className="flex items-center mb-10">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mr-5 shadow-lg shadow-green-500/25"></div>
              <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Detalles del Pedido</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg text-gray-600 font-light">Número de pedido:</span>
                <span className="text-lg font-medium text-gray-900">#{pedidoData?.numero_pedido || pedidoId}</span>
              </div>
              
              {pedidoData?.destinatario && (
                <>
                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-lg text-gray-600 font-light">Destinatario:</span>
                    <span className="text-lg font-medium text-gray-900">{pedidoData.destinatario.nombre}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-lg text-gray-600 font-light">Dirección:</span>
                    <span className="text-lg font-medium text-gray-900">{pedidoData.destinatario.direccion}, {pedidoData.destinatario.ciudad}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-lg text-gray-600 font-light">Fecha de entrega:</span>
                    <span className="text-lg font-medium text-gray-900">{pedidoData.fecha_entrega}</span>
                  </div>
                </>
              )}
              
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

          {/* Botón de WhatsApp */}
          <div className="mb-8">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-6 px-12 rounded-3xl hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-4 w-full sm:w-auto"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>💬 Asistencia del Vendedor</span>
            </a>
            <p className="text-center text-gray-600 mt-3 text-sm">¿Necesitas ayuda? Contáctanos por WhatsApp</p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/"
              className="group bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white py-6 px-12 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98]"
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
