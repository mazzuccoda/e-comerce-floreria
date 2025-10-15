'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

interface ProductoAdicional {
  id: number;
  nombre: string;
  descripcion_corta: string;
  precio: number;
  imagen_principal: string;
  stock_disponible: number;
}

export default function AdicionalesSection() {
  const [productos, setProductos] = useState<ProductoAdicional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdicionales = async () => {
      try {
        const response = await fetch(`${API_URL}/catalogo/productos/adicionales/`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Productos adicionales cargados:', data);
          setProductos(data.slice(0, 4)); // Mostrar máximo 4
        }
      } catch (error) {
        console.error('❌ Error cargando productos adicionales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdicionales();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4 tracking-wide">
            AGREGÁ ADICIONALES A TU RAMO
          </h2>
          <p className="text-lg text-gray-600">
            Súmalos dentro de tu compra para completar tu regalo
          </p>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {productos.map((producto) => (
            <Link
              key={producto.id}
              href={`/productos/${producto.id}`}
              className="group flex flex-col items-center"
            >
              {/* Círculo con imagen */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4 rounded-full overflow-hidden bg-white shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                {producto.imagen_principal ? (
                  <Image
                    src={producto.imagen_principal}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-6xl">🎁</span>
                  </div>
                )}
              </div>

              {/* Nombre del producto */}
              <h3 className="text-base md:text-lg font-medium text-gray-800 text-center uppercase tracking-wide">
                {producto.nombre}
              </h3>

              {/* Precio */}
              <p className="text-sm md:text-base text-green-600 font-semibold mt-2">
                ${producto.precio.toLocaleString('es-AR')}
              </p>

              {/* Stock bajo */}
              {producto.stock_disponible < 5 && producto.stock_disponible > 0 && (
                <span className="text-xs text-orange-600 mt-1">
                  Solo {producto.stock_disponible} disponibles
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Botón ver más (opcional) */}
        {productos.length >= 4 && (
          <div className="text-center mt-12">
            <Link
              href="/productos?adicionales=true"
              className="inline-block bg-white text-gray-800 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Ver todos los adicionales
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
