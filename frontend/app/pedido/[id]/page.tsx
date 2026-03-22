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
  producto?: {
    nombre: string;
    imagen_principal?: string;
  };
}

interface Pedido {
  id: number;
  numero_pedido: string;
  estado: string;
  estado_display: string;
  estado_pago: string;
  estado_pago_display: string;
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
  firmado_como?: string;
  instrucciones: string;
  metodo_envio?: string;
  tipo_envio?: string;
  costo_envio?: string | number;
  preference_id?: string;
  link_pago?: string;
  items: PedidoItem[];
}

const PedidoDetallePage: React.FC = () => {
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params?.id as string;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [changingPaymentMethod, setChangingPaymentMethod] = useState(false);

  // Detectar si es un token (string largo con letras) o un ID numérico
  const isTokenAccess = pedidoId && pedidoId.length > 15 && /[a-zA-Z-_]/.test(pedidoId);

  useEffect(() => {
    // Solo redirigir a login si NO es un token
    if (!isTokenAccess && !authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isTokenAccess, isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) return;
      
      // Si es token, esperar que termine de cargar auth pero no requerir autenticación
      if (isTokenAccess && authLoading) return;
      
      // Si es ID numérico, requerir autenticación
      if (!isTokenAccess && (!token || !isAuthenticated)) return;
      
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
        
        // Usar endpoint diferente según si es token o ID
        const endpoint = isTokenAccess 
          ? `${apiUrl}/pedidos/token/${pedidoId}/`
          : `${apiUrl}/pedidos/simple/${pedidoId}/`;
        
        const headers: HeadersInit = {
          'Accept': 'application/json',
        };
        
        // Solo agregar Authorization si NO es token
        if (!isTokenAccess && token) {
          headers['Authorization'] = `Token ${token}`;
        }
        
        const response = await fetch(endpoint, {
          headers,
          credentials: isTokenAccess ? 'omit' : 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setPedido(data);
          setSelectedPaymentMethod(data.medio_pago || '');
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

    if ((isAuthenticated && token && pedidoId) || (isTokenAccess && pedidoId)) {
      fetchPedido();
    }
  }, [token, pedidoId, isTokenAccess, authLoading, isAuthenticated]);

  const handleChangePaymentMethod = async (newMethod: string) => {
    if (!pedidoId || !pedido) return;
    
    setChangingPaymentMethod(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
      const response = await fetch(`${apiUrl}/pedidos/token/${pedidoId}/link-pago/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ medio_pago: newMethod }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar método de pago');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setSelectedPaymentMethod(newMethod);
        setPedido({ ...pedido, medio_pago: newMethod });
        
        // Limpiar datos de pago anteriores
        setPaymentData(null);
      } else {
        alert(data.error || 'Error al cambiar método de pago');
      }
    } catch (err) {
      console.error('Error al cambiar método de pago:', err);
      alert('Error al cambiar método de pago. Por favor, intenta nuevamente.');
    } finally {
      setChangingPaymentMethod(false);
    }
  };

  const handlePayNow = async () => {
    if (!pedidoId) return;
    
    setPaymentLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
      const response = await fetch(`${apiUrl}/pedidos/token/${pedidoId}/link-pago/`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener link de pago');
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentData(data);
        
        // Si es Mercado Pago, abrir link directamente
        if (data.medio_pago === 'mercadopago' && data.link_pago) {
          window.open(data.link_pago, '_blank');
        } 
        // Si es PayPal, abrir link directamente o mostrar mensaje
        else if (data.medio_pago === 'paypal') {
          if (data.link_pago) {
            window.open(data.link_pago, '_blank');
          } else {
            alert(data.message || 'PayPal estará disponible próximamente. Por favor, selecciona otro método de pago.');
          }
        }
        // Si es transferencia, mostrar modal con datos
        else if (data.medio_pago === 'transferencia') {
          setShowPaymentModal(true);
        }
      } else {
        alert(data.error || 'Error al obtener link de pago');
      }
    } catch (err) {
      console.error('Error al obtener link de pago:', err);
      alert('Error al obtener link de pago. Por favor, intenta nuevamente.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Pedido no encontrado'}
        </div>
        <Link href="/mis-pedidos" className="text-green-700 hover:underline">
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
        <Link href="/mis-pedidos" className="text-green-700 hover:underline flex items-center gap-2">
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
          
          {/* Badge de Estado de Pago */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Estado del pago:</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              pedido.estado_pago === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
              pedido.estado_pago === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {pedido.estado_pago_display || pedido.estado_pago}
            </span>
          </div>
        </div>

        {/* Banner de Pago Pendiente */}
        {pedido.estado_pago === 'pendiente' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pago Pendiente
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Tu pedido está confirmado pero el pago aún está pendiente.</p>
                  <p className="mt-1">Total a pagar: <span className="font-bold">${parseFloat(pedido.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                </div>

                {/* Selector de Métodos de Pago */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-yellow-800 mb-3">Selecciona tu método de pago:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Mercado Pago */}
                    <label className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === 'mercadopago' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    } ${changingPaymentMethod ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        value="mercadopago"
                        checked={selectedPaymentMethod === 'mercadopago'}
                        onChange={(e) => handleChangePaymentMethod(e.target.value)}
                        disabled={changingPaymentMethod}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">💳 Mercado Pago</div>
                        <div className="text-xs text-gray-600 mt-1">Tarjetas (ARS)</div>
                      </div>
                      {selectedPaymentMethod === 'mercadopago' && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>

                    {/* PayPal */}
                    <label className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === 'paypal' 
                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'
                    } ${changingPaymentMethod ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        value="paypal"
                        checked={selectedPaymentMethod === 'paypal'}
                        onChange={(e) => handleChangePaymentMethod(e.target.value)}
                        disabled={changingPaymentMethod}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">💵 PayPal</div>
                        <div className="text-xs text-gray-600 mt-1">Pago en USD</div>
                      </div>
                      {selectedPaymentMethod === 'paypal' && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>

                    {/* Transferencia */}
                    <label className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === 'transferencia' 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                    } ${changingPaymentMethod ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        value="transferencia"
                        checked={selectedPaymentMethod === 'transferencia'}
                        onChange={(e) => handleChangePaymentMethod(e.target.value)}
                        disabled={changingPaymentMethod}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">🏦 Transferencia</div>
                        <div className="text-xs text-gray-600 mt-1">Bancaria</div>
                      </div>
                      {selectedPaymentMethod === 'transferencia' && (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  </div>
                  
                  {changingPaymentMethod && (
                    <p className="text-xs text-yellow-700 mt-2 flex items-center">
                      <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Actualizando método de pago...
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={handlePayNow}
                    disabled={paymentLoading || changingPaymentMethod}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando...
                      </>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pagar Ahora
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <p><span className="font-medium">Horario:</span> {pedido.franja_horaria === 'mañana' ? 'Mañana (9-12hs)' : (pedido.franja_horaria === 'tarde' ? 'Tarde (16-20hs)' : 'Durante el día')}</p>
            </div>
          </div>
        </div>

        {pedido.dedicatoria && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Dedicatoria</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="italic">{pedido.dedicatoria}</p>
              {pedido.firmado_como && (
                <p className="text-sm text-gray-600 mt-2 text-right">
                  — {pedido.firmado_como}
                </p>
              )}
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
                {pedido.items.map((item) => {
                  // Si la imagen ya tiene http/https, usarla directamente (Cloudinary)
                  // Si no, agregar el apiUrl (imágenes locales)
                  const imagenPrincipal = item.producto?.imagen_principal;
                  const imagenUrl = imagenPrincipal
                    ? (imagenPrincipal.startsWith('http') 
                        ? imagenPrincipal 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app'}${imagenPrincipal}`)
                    : null;
                  
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {imagenUrl ? (
                            <img 
                              src={imagenUrl}
                              alt={item.producto?.nombre || item.producto_nombre}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <span>{item.producto?.nombre || item.producto_nombre}</span>
                        </div>
                      </td>
                      <td className="text-center p-4">{item.cantidad}</td>
                      <td className="text-right p-4">${parseFloat(item.precio).toFixed(2)}</td>
                      <td className="text-right p-4 font-medium">
                        ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal productos:</span>
            <span className="font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          {/* Mostrar costo de envío si existe */}
          {pedido.costo_envio !== undefined && pedido.costo_envio !== null && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                {pedido.tipo_envio === 'retiro' && '🏪 Retiro en tienda'}
                {pedido.tipo_envio === 'express' && '⚡ Envío Express'}
                {pedido.tipo_envio === 'programado' && '📅 Envío Programado'}
                {!pedido.tipo_envio && 'Envío'}:
              </span>
              <span className="font-medium">
                {parseFloat(pedido.costo_envio.toString()) === 0 
                  ? 'Gratis ✓' 
                  : `$${parseFloat(pedido.costo_envio.toString()).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Método de pago:</span>
            <span className="font-medium">{pedido.medio_pago_display || pedido.medio_pago}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold mt-4 pt-4 border-t">
            <span>Total:</span>
            <span className="text-green-700">${parseFloat(pedido.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Modal de Transferencia Bancaria */}
      {showPaymentModal && paymentData?.medio_pago === 'transferencia' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full my-8 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar fijo en la esquina */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="sticky top-0 right-0 float-right m-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-lg z-10"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 pt-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Datos para Transferencia</h3>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">Total a transferir:</p>
                <p className="text-2xl font-bold text-green-700">${parseFloat(paymentData.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Banco:</p>
                  <p className="text-sm font-semibold text-gray-900">{paymentData.datos_transferencia?.banco}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Titular:</p>
                  <p className="text-sm font-semibold text-gray-900">{paymentData.datos_transferencia?.titular}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">CVU:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-semibold text-gray-900">{paymentData.datos_transferencia?.cvu}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.datos_transferencia?.cvu);
                        alert('CVU copiado al portapapeles');
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Alias:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{paymentData.datos_transferencia?.alias}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.datos_transferencia?.alias);
                        alert('Alias copiado al portapapeles');
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {paymentData.datos_transferencia?.cuit && (
                  <div>
                    <p className="text-xs text-gray-600 font-medium">CUIT:</p>
                    <p className="text-sm font-semibold text-gray-900">{paymentData.datos_transferencia?.cuit}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 font-medium">Referencia (incluir en la transferencia):</p>
                  <p className="text-sm font-bold text-green-700">{paymentData.datos_transferencia?.referencia}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Importante:</strong> Una vez realizada la transferencia, el pago será verificado manualmente. 
                  Recibirás una confirmación por email cuando se apruebe.
                </p>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
              >
                Entendido
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoDetallePage;
