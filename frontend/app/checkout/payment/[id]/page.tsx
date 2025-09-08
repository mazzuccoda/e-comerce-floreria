'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Pedido {
  id: number;
  numero_pedido: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  fecha_entrega: string;
  notas: string;
  estado: string;
  total: number;
  items: Array<{
    id: number;
    producto: {
      id: number;
      nombre: string;
      imagen_principal: string;
    };
    quantity: number;
    precio: number;
    total_price: number;
  }>;
  metodo_envio: {
    nombre: string;
    precio: number;
    tiempo_estimado: string;
  };
}

const PaymentPage = () => {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pedidos/${pedidoId}/`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Pedido no encontrado');
        }

        const pedidoData = await response.json();
        setPedido(pedidoData);
      } catch (error) {
        console.error('Error fetching pedido:', error);
        toast.error('Error al cargar el pedido');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (pedidoId) {
      fetchPedido();
    }
  }, [pedidoId, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePayment = async () => {
    if (!pedido) return;

    setPaymentLoading(true);
    const loadingToast = toast.loading('Creando pago...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pedidos/crear-pago/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pedido_id: pedido.id
        }),
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pago');
      }

      const paymentData = await response.json();
      
      // Redirigir a Mercado Pago
      if (paymentData.init_point) {
        window.location.href = paymentData.init_point;
      } else {
        throw new Error('No se pudo obtener el enlace de pago');
      }

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h1>
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const totalConEnvio = pedido.total + pedido.metodo_envio.precio;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmar Pago</h1>
          <p className="text-gray-600">Pedido #{pedido.numero_pedido}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del pedido */}
          <div className="space-y-6">
            {/* Datos de entrega */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Entrega</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{pedido.nombre_completo}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{pedido.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{pedido.telefono}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium">{pedido.direccion}</p>
                  <p className="text-sm text-gray-500">{pedido.ciudad}, {pedido.codigo_postal}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Fecha de entrega</p>
                  <p className="font-medium">{formatDate(pedido.fecha_entrega)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Método de envío</p>
                  <p className="font-medium">{pedido.metodo_envio.nombre}</p>
                  <p className="text-sm text-gray-500">{pedido.metodo_envio.tiempo_estimado}</p>
                </div>

                {pedido.notas && (
                  <div>
                    <p className="text-sm text-gray-600">Notas</p>
                    <p className="font-medium">{pedido.notas}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos</h2>
              
              <div className="space-y-4">
                {pedido.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.producto.imagen_principal || '/placeholder-product.jpg'}
                        alt={item.producto.nombre}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.producto.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity} × {formatPrice(item.precio)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.total_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen y pago */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pago</h2>
              
              {/* Totales */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(pedido.total)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">
                    {pedido.metodo_envio.precio === 0 ? 'Gratis' : formatPrice(pedido.metodo_envio.precio)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total a pagar</span>
                    <span>{formatPrice(totalConEnvio)}</span>
                  </div>
                </div>
              </div>

              {/* Botón de pago */}
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg mb-4"
              >
                {paymentLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  'Pagar con Mercado Pago'
                )}
              </button>

              {/* Información de seguridad */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pago 100% seguro
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Protección al comprador
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Múltiples medios de pago
                </div>
              </div>

              {/* Métodos de pago aceptados */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 mb-3">Métodos de pago aceptados:</p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                    Tarjetas de crédito
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                    Tarjetas de débito
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                    Transferencia
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                    Efectivo
                  </div>
                </div>
              </div>

              {/* Botón volver */}
              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/carrito"
                  className="block w-full text-center py-3 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Volver al carrito
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
