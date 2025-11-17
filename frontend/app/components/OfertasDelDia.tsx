'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/Product';
import { ChevronLeft, ChevronRight, Tag, Clock } from 'lucide-react';

interface OfertasDelDiaProps {
  className?: string;
}

export default function OfertasDelDia({ className = '' }: OfertasDelDiaProps) {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOfertasDelDia();
  }, []);

  const fetchOfertasDelDia = async () => {
    try {
      setLoading(true);
      
      // Obtener la URL base del window.location para asegurar que use el mismo dominio
      const isClient = typeof window !== 'undefined';
      const apiUrl = isClient 
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://floreriaviverocristian.up.railway.app';
      
      console.log('🔍 Fetching ofertas del día from:', apiUrl);
      console.log('🌐 Window location:', isClient ? window.location.href : 'SSR');
      
      // Obtener TODOS los productos y filtrar en el cliente
      const url = `${apiUrl}/api/catalogo/productos/`;
      console.log('📡 URL completa:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        mode: 'cors',
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Productos recibidos:', data);
      console.log('📦 Total productos:', Array.isArray(data) ? data.length : 'No es array');
      
      // Asegurarse de que data es un array
      const productosArray = Array.isArray(data) ? data : [];
      
      // Filtrar productos de la categoría "Oferta del día" en el cliente
      const productosOfertas = productosArray.filter((p: Product) => {
        const esOferta = p.categoria?.nombre?.toLowerCase().includes('oferta') ||
                        p.categoria?.slug === 'oferta-del-dia';
        const estaActivo = p.is_active;
        return esOferta && estaActivo;
      });
      
      console.log('✅ Productos de ofertas encontrados:', productosOfertas.length);
      console.log('✅ Productos ofertas detalle:', productosOfertas);
      
      setProductos(productosOfertas);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching ofertas del día:', err);
      console.error('❌ Error stack:', err.stack);
      setError(`No se pudieron cargar las ofertas: ${err.message}`);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Mostrar siempre durante desarrollo para debugging
  // if (!loading && productos.length === 0) {
  //   return null;
  // }

  return (
    <section className={`py-12 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con diseño especial */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <Tag className="w-5 h-5" />
            <span className="font-bold text-lg">OFERTAS DEL DÍA</span>
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Aprovechá estas ofertas especiales!
          </h2>
          <p className="text-gray-600 text-lg">
            Productos seleccionados con descuentos exclusivos por tiempo limitado
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg p-4">
            <p className="font-bold">❌ {error}</p>
          </div>
        )}

        {/* Debug Info - Siempre visible */}
        <div className="text-center py-4 bg-blue-50 rounded-lg mb-4 border-2 border-blue-300">
          <p className="text-sm text-blue-800 font-bold mb-2">
            🔍 DEBUG INFO
          </p>
          <p className="text-xs text-blue-700">
            Productos encontrados: <span className="font-bold text-lg">{productos.length}</span>
          </p>
          <p className="text-xs text-blue-700">
            Estado: <span className="font-bold">{loading ? '⏳ Cargando...' : '✅ Listo'}</span>
          </p>
          <p className="text-xs text-blue-700">
            Error: <span className="font-bold">{error || '✅ Ninguno'}</span>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Versión: 1.0.5 | {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Carrusel de productos */}
        {!loading && productos.length > 0 && (
          <div className="relative group">
            {/* Botón Izquierdo */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>

            {/* Contenedor del carrusel */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-hide scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex gap-4 md:gap-6 pb-4">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex-shrink-0 w-72 md:w-80"
                  >
                    <div className="relative">
                      {/* Badge de oferta */}
                      {producto.porcentaje_descuento && (
                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                          -{producto.porcentaje_descuento}%
                        </div>
                      )}
                      <ProductCard product={producto} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón Derecho */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        )}

        {/* Indicador de scroll en móvil */}
        {!loading && productos.length > 1 && (
          <div className="mt-4 text-center text-sm text-gray-500 md:hidden">
            <p>← Deslizá para ver más ofertas →</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
