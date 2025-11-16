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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app';
      
      console.log('🔍 Fetching ofertas del día from:', apiUrl);
      
      // Buscar productos de la categoría "Oferta del día" - URL encode del parámetro
      const categoriaParam = encodeURIComponent('Oferta del día');
      const url = `${apiUrl}/api/catalogo/productos/?categoria__nombre=${categoriaParam}`;
      console.log('📡 URL completa:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store', // Evitar cache
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        throw new Error('Error al cargar ofertas del día');
      }

      const data = await response.json();
      console.log('📦 Productos recibidos:', data);
      console.log('📦 Total productos:', Array.isArray(data) ? data.length : 'No es array');
      
      // Asegurarse de que data es un array
      const productosArray = Array.isArray(data) ? data : [];
      
      // Filtrar solo productos activos
      const productosActivos = productosArray.filter((p: Product) => p.is_active);
      console.log('✅ Productos activos:', productosActivos.length);
      
      setProductos(productosActivos);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching ofertas del día:', err);
      setError('No se pudieron cargar las ofertas del día');
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

  // No mostrar la sección si no hay productos
  if (!loading && productos.length === 0) {
    return null;
  }

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
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        )}

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
