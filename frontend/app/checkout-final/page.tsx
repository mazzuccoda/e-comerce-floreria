'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const CheckoutFinalPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    notas: ''
  });
  const [selectedShipping, setSelectedShipping] = useState(1);

  // Datos mock del carrito
  const cart = {
    items: [
      {
        producto: {
          id: 1,
          nombre: 'Ramo de Rosas Rojas Premium',
          precio: 89000,
          imagen_principal: '/placeholder-product.jpg'
        },
        quantity: 1,
        total_price: 89000
      },
      {
        producto: {
          id: 2,
          nombre: 'Arreglo Floral Mixto',
          precio: 65000,
          imagen_principal: '/placeholder-product.jpg'
        },
        quantity: 1,
        total_price: 65000
      }
    ],
    total_price: 154000,
    total_items: 2,
    is_empty: false
  };

  const shippingMethods = [
    {
      id: 1,
      nombre: 'Envío Express',
      descripcion: 'Entrega el mismo día',
      tiempo_estimado: '2-4 horas',
      precio: 0
    },
    {
      id: 2,
      nombre: 'Envío Programado',
      descripcion: 'Elige fecha y hora',
      tiempo_estimado: '1-3 días',
      precio: 5000
    }
  ];

  const selectedShippingMethod = shippingMethods.find(m => m.id === selectedShipping);
  const totalWithShipping = cart.total_price + (selectedShippingMethod?.precio || 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (methodId: number) => {
    setSelectedShipping(methodId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('¡Pedido procesado con éxito! (Demo)');
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (cart.is_empty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-8">Agrega algunos productos para continuar</p>
          <a href="/" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Ir a la tienda
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-light text-gray-900">Procesando tu pedido...</h2>
          <p className="text-gray-600 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Header Premium */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-8 shadow-2xl shadow-green-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extralight text-gray-900 mb-6 tracking-tight">
            ✨ CHECKOUT PREMIUM FUNCIONANDO ✨
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
            Estás viendo el diseño premium con glassmorphism y gradientes
          </p>
        </div>

        {/* Progress Steps Premium */}
        <div className="mb-20">
          <div className="flex items-center justify-center space-x-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/25">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 mt-3 tracking-wide">Información</span>
            </div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-green-500 to-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-400 mt-3 tracking-wide">Envío</span>
            </div>
            <div className="w-24 h-0.5 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-400 mt-3 tracking-wide">Pago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-16">
          {/* Formulario Premium */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Información de contacto Premium */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center mb-10">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mr-5 shadow-lg shadow-green-500/25"></div>
                  <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Información de contacto</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="Tu apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección de entrega Premium */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center mb-10">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-5 shadow-lg shadow-blue-500/25"></div>
                  <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Dirección de entrega</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Dirección completa *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="Calle, número, piso, departamento"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="Buenos Aires"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleInputChange}
                      required
                      className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner text-lg"
                      placeholder="1234"
                    />
                  </div>
                </div>
              </div>

              {/* Método de envío Premium */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center mb-10">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mr-5 shadow-lg shadow-purple-500/25"></div>
                  <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Método de envío</h2>
                </div>
                <div className="space-y-6">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`group flex items-center justify-between p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                        selectedShipping === method.id
                          ? 'bg-green-50/80 border-2 border-green-200 shadow-lg shadow-green-500/10'
                          : 'bg-white/40 border-2 border-transparent hover:bg-white/60 hover:shadow-lg'
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
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                            selectedShipping === method.id
                              ? 'border-green-500 bg-green-500 shadow-lg shadow-green-500/25'
                              : 'border-gray-300 group-hover:border-green-400'
                          }`}>
                            {selectedShipping === method.id && (
                              <div className="w-3 h-3 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                            )}
                          </div>
                        </div>
                        <div className="ml-6">
                          <p className="font-medium text-gray-900 text-lg">{method.nombre}</p>
                          <p className="text-sm text-gray-600 font-light">{method.descripcion}</p>
                          <p className="text-xs text-gray-500 font-light">{method.tiempo_estimado}</p>
                        </div>
                      </div>
                      <div className="text-xl font-light text-gray-900">
                        {method.precio === 0 ? 'Gratis' : formatPrice(method.precio)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mensaje especial Premium */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center mb-10">
                  <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-5 shadow-lg shadow-amber-500/25"></div>
                  <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Mensaje especial</h2>
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-600 mb-4 tracking-wide">
                    Dedicatoria o instrucciones (opcional)
                  </label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-8 py-6 bg-white/50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-400/50 focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-inner resize-none text-lg"
                    placeholder="Escribe aquí tu dedicatoria o instrucciones especiales para la entrega..."
                  />
                </div>
              </div>

              {/* Botón Premium */}
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-8 px-12 rounded-3xl hover:shadow-2xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 font-light text-2xl tracking-wide transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center space-x-4">
                    {loading ? (
                      <>
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Procesando tu pedido...</span>
                      </>
                    ) : (
                      <>
                        <span>🎉 DISEÑO PREMIUM FUNCIONANDO 🎉</span>
                        <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
                <p className="text-center text-sm text-gray-500 font-light mt-8 tracking-wide">
                  🔒 Conexión segura SSL • 🌸 Garantía de frescura • 🚚 Envío protegido
                </p>
              </div>
            </form>
          </div>

          {/* Resumen Premium */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-2xl shadow-gray-900/5 border border-white/20 sticky top-32 hover:shadow-3xl transition-all duration-500">
              <div className="flex items-center mb-10">
                <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-5 shadow-lg shadow-indigo-500/25"></div>
                <h2 className="text-3xl font-extralight text-gray-900 tracking-wide">Tu pedido</h2>
              </div>
              
              <div className="space-y-6 mb-8">
                {cart.items.map((item) => (
                  <div key={item.producto.id} className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.producto.imagen_principal || '/placeholder-product.jpg'}
                        alt={item.producto.nombre}
                        fill
                        className="object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-gray-900 truncate">
                        {item.producto.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {formatPrice(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(cart.total_price)}</span>
                </div>
                
                {selectedShippingMethod && (
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Envío</span>
                    <span>
                      {selectedShippingMethod.precio === 0 ? 'Gratis' : formatPrice(selectedShippingMethod.precio)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-2xl pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(totalWithShipping)}</span>
                </div>
              </div>

              {/* Información de seguridad Premium */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pago seguro con SSL
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Garantía de frescura
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Entrega rápida garantizada
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFinalPage;
