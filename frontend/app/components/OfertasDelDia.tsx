'use client';
// Updated: 2025-11-16 21:55 - Badge only shows when discount > 0

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
      
      // Usar la misma URL que usa el resto de la aplicación
      const apiUrl = 'https://e-comerce-floreria-production.up.railway.app';
      
      // Construir URL con query params para evitar problemas de trailing slash
      const url = new URL('/api/catalogo/productos/', apiUrl);
      // Agregar timestamp para evitar cache
      url.searchParams.append('t', Date.now().toString());
      
      const urlString = url.toString();
      
      const response = await fetch(urlString, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Asegurarse de que data es un array
      const productosArray = Array.isArray(data) ? data : [];
      
      // Filtrar productos de la categoría "Oferta del día" en el cliente
      const productosOfertas = productosArray.filter((p: Product) => {
        const esOferta = p.categoria?.nombre?.toLowerCase().includes('oferta') ||
                        p.categoria?.slug === 'oferta-del-dia';
        const estaActivo = p.is_active;
        return esOferta && estaActivo;
      });
      
      setProductos(productosOfertas);
      setError(null);
    } catch (err: any) {
      console.error('Error cargando ofertas del día:', err.message);
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
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con badge verde */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2 rounded-full shadow-lg">
            <Tag className="w-5 h-5" />
            <span className="font-bold text-lg">OFERTAS DEL DÍA</span>
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
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
                      {/* Badge de descuento verde - SOLO si hay descuento MAYOR a 0 */}
                      {(producto.porcentaje_descuento && producto.porcentaje_descuento > 0) ? (
                        <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                          -{producto.porcentaje_descuento}%
                        </div>
                      ) : null}
                      {/* ProductCard sin su propio badge para evitar duplicación */}
                      <ProductCard product={producto} hideDiscountBadge={true} />
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
