'use client';

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Product } from '@/types/Product';
import OfflineProductCard from '../components/OfflineProductCard';

// Productos mock para modo offline - SIMPLIFICADO para evitar errores de build
const mockProducts: Product[] = [
  {
    id: 1,
    nombre: "Ramo de 12 Rosas Rojas",
    slug: "ramo-12-rosas-rojas",
    descripcion: "Hermoso ramo de 12 rosas rojas frescas, perfectas para expresar amor y pasión. Incluye papel decorativo elegante.",
    descripcion_corta: "Ramo de 12 rosas rojas",
    categoria: { nombre: "Ramos", slug: "ramos", descripcion: "Ramos florales", imagen: null },
    precio: "45.99",
    precio_descuento: null,
    precio_final: "45.99",
    porcentaje_descuento: null,
    stock: 15,
    is_featured: true,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 1, nombre: "Rosas", descripcion: "Flores tipo rosas", is_active: true },
    ocasiones: ["Amor", "Aniversario", "Cumpleaños"],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  }
];

export default function OfflineModePage() {
  const [products] = useState<Product[]>(mockProducts);

  return (
    <main className="container mx-auto px-4 py-8">
      <Toaster position="top-center" />
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-md shadow-md mb-6" role="alert">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <span className="inline-block px-2 py-1 bg-amber-200 text-amber-800 text-xs font-semibold rounded-md mr-2">MODO SIN CONEXIÓN</span>
              <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded-md">SIN CONEXIÓN AL SERVIDOR</span>
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mt-1">Catálogo de demostración</h3>
            <div className="mt-2 text-amber-700">
              <p className="mb-1">
                Estás utilizando una versión <strong>sin conexión</strong> del catálogo con productos de demostración.
              </p>
              <p>
                El carrito funcionará de manera local y los datos se guardarán en tu navegador hasta que se restablezca la conexión.
              </p>
            </div>
            <div className="mt-3 flex">
              <a href="/" className="text-amber-600 hover:text-amber-800 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Intentar volver al modo normal
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gray-800">Florería Cristina</span>
          <span className="bg-amber-200 text-amber-800 text-lg px-3 py-1 ml-3 rounded-full">
            Modo Offline
          </span>
        </h1>
        <div className="flex space-x-2">
          <a 
            href="/"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Inicio
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {products.map((product) => (
          <OfflineProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Información sobre el modo sin conexión</h3>
        <p className="text-gray-600 mb-3">
          En este modo, todas las operaciones se realizan localmente en tu navegador. Los productos mostrados son solo para demostración.
        </p>
        <div className="flex flex-wrap gap-3 items-center mt-4">
          <a 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Intentar reconectar
          </a>
        </div>
      </div>
    </main>
  );
}
