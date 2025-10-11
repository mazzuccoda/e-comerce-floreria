'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ShippingMethod {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  tiempo_estimado: string;
}

interface CheckoutData {
  nombre_completo: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  metodo_envio: string;
  fecha_entrega: string;
  notas: string;
}

const CheckoutSimplePage = () => {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');

  const [formData, setFormData] = useState<CheckoutData>({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    metodo_envio: '',
    fecha_entrega: '',
    notas: ''
  });

  // Mock cart data para evitar useContext
  const mockCart = {
    items: [
      {
        producto: {
          id: 1,
          nombre: 'Ramo de Rosas Rojas',
          imagen_principal: '/placeholder-product.jpg'
        },
        quantity: 2,
        total_price: 15000
      }
    ],
    total_price: 15000,
    total_items: 2,
    is_empty: false
  };

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      const API_URL = typeof window === 'undefined' 
        ? 'http://web:8000' 
        : 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/pedidos/metodos-envio/`);
      if (response.ok) {
        const methods = await response.json();
        setShippingMethods(methods);
        if (methods.length > 0) {
          setSelectedShipping(methods[0].id);
          setFormData(prev => ({ ...prev, metodo_envio: methods[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      // Fallback data
      const fallbackMethods = [
        { id: '1', nombre: 'Envío estándar', precio: 0, descripcion: 'Gratis en CABA', tiempo_estimado: '2-3 días' },
        { id: '2', nombre: 'Envío express', precio: 2500, descripcion: 'Entrega rápida', tiempo_estimado: '24 horas' }
      ];
      setShippingMethods(fallbackMethods);
      setSelectedShipping('1');
      setFormData(prev => ({ ...prev, metodo_envio: '1' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (methodId: string) => {
    setSelectedShipping(methodId);
    setFormData(prev => ({ ...prev, metodo_envio: methodId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('¡Pedido procesado correctamente!');
      router.push('/checkout/success');
    } catch (error) {
      toast.error('Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const selectedShippingMethod = shippingMethods.find(method => method.id === selectedShipping);
  const totalWithShipping = mockCart.total_price + (selectedShippingMethod?.precio || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      {/* Header elegante */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl mb-4 shadow-xl shadow-green-500/20">
              <span className="text-2xl">🌸</span>
            </div>
            <h1 className="text-4xl font-light text-gray-900 mb-2 tracking-wide">
              Finalizar Pedido
            </h1>
            <p className="text-lg text-gray-600 font-light tracking-wide">
              Completa tus datos para recibir tus flores frescas
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center mb-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Carrito</span>
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-blue-600">Checkout</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-400">Confirmación</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="xl:col-span-3 order-2 xl:order-1 space-y-8">
            {/* Información personal */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl shadow-gray-900/5 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Información personal</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="Tu nombre y apellido"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
            </div>

            {/* Dirección de entrega */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl shadow-gray-900/5 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Dirección de entrega</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Dirección completa *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="Calle, número, piso, departamento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="Buenos Aires"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                    Código postal *
                  </label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner"
                    placeholder="1234"
                  />
                </div>
              </div>
            </div>

            {/* Método de envío */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl shadow-gray-900/5 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Método de envío</h2>
              </div>
              
              <div className="space-y-4">
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`group flex items-center justify-between p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                      selectedShipping === method.id
                        ? 'bg-green-50 border-2 border-green-200 shadow-lg'
                        : 'bg-white/50 border-2 border-transparent hover:bg-white/80 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <input
                          type="radio"
                          name="metodo_envio"
                          value={method.id}
                          checked={selectedShipping === method.id}
                          onChange={() => handleShippingChange(method.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                          selectedShipping === method.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 group-hover:border-green-400'
                        }`}>
                          {selectedShipping === method.id && (
                            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{method.nombre}</p>
                        <p className="text-sm text-gray-600 font-light">{method.descripcion}</p>
                        <p className="text-xs text-gray-500 font-light">{method.tiempo_estimado}</p>
                      </div>
                    </div>
                    <div className="text-lg font-light text-gray-900">
                      {method.precio === 0 ? 'Gratis' : formatPrice(method.precio)}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notas adicionales */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl shadow-gray-900/5 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Mensaje especial</h2>
              </div>
              <div>
                <label className="block text-sm font-light text-gray-600 mb-3 tracking-wide">
                  Dedicatoria o instrucciones (opcional)
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-6 py-5 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner resize-none"
                  placeholder="Escribe aquí tu dedicatoria o instrucciones especiales para la entrega..."
                />
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-6 px-8 rounded-2xl hover:shadow-2xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Procesando tu pedido...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar al pago</span>
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-sm text-gray-500 font-light mt-6 tracking-wide">
                🔒 Conexión segura SSL • 🌸 Garantía de frescura • 🚚 Envío protegido
              </p>
            </div>
          </form>

          {/* Resumen del pedido */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl shadow-gray-900/5 border border-white/20 sticky top-32">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Tu pedido</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                {mockCart.items.map((item) => (
                  <div key={item.producto.id} className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.producto.imagen_principal || '/placeholder-product.jpg'}
                        alt={item.producto.nombre}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.producto.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(mockCart.total_price)}</span>
                </div>
                
                {selectedShippingMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span>
                      {selectedShippingMethod.precio === 0 ? 'Gratis' : formatPrice(selectedShippingMethod.precio)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(totalWithShipping)}</span>
                </div>
              </div>

              {/* Información de seguridad */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pago seguro con SSL
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Garantía de frescura
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSimplePage;
