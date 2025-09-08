'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StockAlert from '../components/StockAlert';

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

const CheckoutPage = () => {
  const { cart, loading: cartLoading, clearCart } = useCart();
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

  const [errors, setErrors] = useState<Partial<CheckoutData>>({});

  // Cargar métodos de envío
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pedidos/metodos-envio/`);
        if (response.ok) {
          const methods = await response.json();
          setShippingMethods(methods);
          if (methods.length > 0) {
            setSelectedShipping(methods[0].id);
            setFormData(prev => ({ ...prev, metodo_envio: methods[0].id }));
          }
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
      }
    };

    fetchShippingMethods();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof CheckoutData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleShippingChange = (methodId: string) => {
    setSelectedShipping(methodId);
    setFormData(prev => ({ ...prev, metodo_envio: methodId }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutData> = {};

    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.codigo_postal.trim()) {
      newErrors.codigo_postal = 'El código postal es requerido';
    }

    if (!formData.metodo_envio) {
      newErrors.metodo_envio = 'Selecciona un método de envío';
    }

    if (!formData.fecha_entrega) {
      newErrors.fecha_entrega = 'Selecciona una fecha de entrega';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.is_empty) {
      toast.error('Tu carrito está vacío.');
      router.push('/carrito');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Procesando tu pedido...');

    try {
      // Primero validar stock
      const stockResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pedidos/validar-stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!stockResponse.ok) {
        const stockError = await stockResponse.json();
        throw new Error(stockError.error || 'Error validando stock');
      }

      // Crear el pedido
      const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pedidos/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      toast.dismiss(loadingToast);

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : Object.values(errorData).flat().join(' ');
        throw new Error(errorMessage || 'Error al procesar el pedido');
      }

      const pedido = await checkoutResponse.json();
      
      toast.success('¡Pedido creado exitosamente!');
      clearCart();
      
      // Redirigir a la página de pago
      router.push(`/checkout/payment/${pedido.id}`);

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const selectedShippingMethod = shippingMethods.find(method => method.id === selectedShipping);
  const shippingCost = selectedShippingMethod?.precio || 0;
  const totalWithShipping = cart.total_price + shippingCost;

  // Fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (cart.is_empty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-8">Agrega algunos productos antes de proceder al checkout</p>
          <Link 
            href="/productos" 
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
        <p className="text-gray-600">Completa tus datos para procesar el pedido</p>
      </div>

      {/* Alerta de stock */}
      <StockAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información personal */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Personal</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nombre_completo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.nombre_completo && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre_completo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+54 11 1234-5678"
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Entrega *
                  </label>
                  <input
                    type="date"
                    name="fecha_entrega"
                    value={formData.fecha_entrega}
                    onChange={handleInputChange}
                    min={minDate}
                    title="Selecciona la fecha de entrega deseada"
                    aria-label="Fecha de entrega"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.fecha_entrega ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fecha_entrega && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha_entrega}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Dirección de Envío</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Calle, número, piso, departamento"
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.ciudad ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ciudad"
                    />
                    {errors.ciudad && (
                      <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.codigo_postal ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1234"
                    />
                    {errors.codigo_postal && (
                      <p className="mt-1 text-sm text-red-600">{errors.codigo_postal}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Método de envío */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Método de Envío</h2>
              
              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedShipping === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleShippingChange(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="metodo_envio"
                          value={method.id}
                          checked={selectedShipping === method.id}
                          onChange={() => handleShippingChange(method.id)}
                          title={`Seleccionar ${method.nombre}`}
                          aria-label={`Método de envío: ${method.nombre}`}
                          className="mr-3"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{method.nombre}</h3>
                          <p className="text-sm text-gray-600">{method.descripcion}</p>
                          <p className="text-sm text-gray-500">{method.tiempo_estimado}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {method.precio === 0 ? 'Gratis' : formatPrice(method.precio)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas adicionales */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notas Adicionales</h2>
              
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Instrucciones especiales para la entrega, dedicatoria, etc. (opcional)"
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {loading ? 'Procesando...' : 'Continuar al Pago'}
            </button>
          </form>
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pedido</h2>
            
            {/* Productos */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
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
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(item.total_price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(cart.total_price)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">
                  {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                </span>
              </div>
              
              <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                <span>Total</span>
                <span>{formatPrice(totalWithShipping)}</span>
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center text-sm text-gray-600 mb-2">
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
  );
};

export default CheckoutPage;
