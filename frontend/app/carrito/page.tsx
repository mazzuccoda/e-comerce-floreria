"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartRobust } from '@/context/CartContextRobust';

const CartPage = () => {
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, refreshCart } = useCartRobust();
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error de Conexión</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={refreshCart}
            className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">🛒 Tu Carrito</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {cart?.total_items || 0} {cart?.total_items === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        {cart?.is_empty ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-8xl mb-6">🌸</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-8">¡Descubre nuestros hermosos arreglos florales!</p>
            <Link 
              href="/" 
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition font-medium"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cart?.items?.map((item) => (
                <div key={item.producto.id} className="bg-white rounded-lg shadow-sm p-3 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {/* Mobile: Horizontal layout */}
                  <div className="flex gap-3 sm:contents">
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.producto.imagen_principal ? (
                        <img 
                          src={item.producto.imagen_principal}
                          alt={item.producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                          🌸
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.producto.nombre}</h3>
                      <p className="text-green-700 font-medium text-sm sm:text-base">${item.price}</p>
                      {/* Mobile: Show total here */}
                      <p className="font-bold text-gray-800 mt-1 sm:hidden text-sm">Total: ${item.total_price}</p>
                    
                    </div>
                  </div>

                  {/* Quantity Controls - Full width on mobile */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 sm:ml-0">
                    <button
                      onClick={async () => {
                        if (item.quantity <= 1) return;
                        setUpdatingItem(item.producto.id);
                        try {
                          await updateQuantity(item.producto.id, item.quantity - 1);
                        } finally {
                          setUpdatingItem(null);
                        }
                      }}
                      disabled={updatingItem === item.producto.id || item.quantity <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center text-lg"
                    >
                      −
                    </button>
                    <span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                    <button
                      onClick={async () => {
                        setUpdatingItem(item.producto.id);
                        try {
                          await updateQuantity(item.producto.id, item.quantity + 1);
                        } finally {
                          setUpdatingItem(null);
                        }
                      }}
                      disabled={updatingItem === item.producto.id}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                    <button
                      onClick={async () => {
                        setUpdatingItem(item.producto.id);
                        try {
                          await removeFromCart(item.producto.id);
                        } finally {
                          setUpdatingItem(null);
                        }
                      }}
                      disabled={updatingItem === item.producto.id}
                      className="ml-auto text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Item Total - Desktop only */}
                  <div className="hidden sm:block text-right">
                    <p className="font-bold text-gray-800">${item.total_price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm sm:text-base">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart?.total_items} {cart?.total_items === 1 ? 'producto' : 'productos'})</span>
                    <span className="font-medium">${cart?.total_price}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-green-600 font-medium">A calcular</span>
                  </div>
                  <div className="border-t pt-2 sm:pt-3 flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span className="text-green-700">${cart?.total_price}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-green-700 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-green-800 transition font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  Proceder al Checkout
                </Link>

                <Link
                  href="/"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-2.5 sm:py-3 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                >
                  Seguir Comprando
                </Link>

                {/* Trust Badges */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Entrega garantizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Flores frescas del día</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Pago seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
