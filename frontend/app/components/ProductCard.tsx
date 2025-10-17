'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  // Función para obtener URL de imagen memoizada para evitar recálculos
  const imageUrl = useMemo(() => {
    // SOLUCIÓN DEFINITIVA: Usar siempre una imagen local garantizada
    // Esto evita errores de conectividad y problemas con servicios externos
    const fallbackImage = '/images/no-image.jpg';
    
    try {
      const url = product.imagen_principal;
      
      // PASO 1: Si no hay URL, usar inmediatamente la imagen fallback
      if (!url || url === 'null' || url === 'undefined') {
        console.log('Sin imagen para producto:', product.nombre);
        return fallbackImage;
      }
      
      // PASO 2: Si es una URL de media del backend, construir URL completa
      if (url.startsWith('/media/')) {
        const fullUrl = `http://localhost${url}`;
        console.log('✅ Imagen del backend:', product.nombre, fullUrl);
        return fullUrl;
      }
      
      // Si tiene web:8000 (URL interna de Docker), reemplazar con localhost
      if (url.includes('web:8000')) {
        const fixedUrl = url.replace('web:8000', 'localhost');
        console.log('✅ URL Docker corregida:', fixedUrl);
        return fixedUrl;
      }

      // PASO 3: Si es una URL externa válida (no placeholder)
      if ((url.startsWith('http://') || url.startsWith('https://')) && 
          !url.includes('placeholder.com')) {
        return url;
      }

      // PASO 4: Para cualquier otro caso, usar la imagen fallback local
      return fallbackImage;
    } catch (error) {
      console.error('Error procesando URL de imagen:', error);
      return fallbackImage;
    }
  }, [product.imagen_principal, product.nombre]);

  // Generar slug del producto para la URL
  const productSlug = product.id.toString();

  const handleClick = () => {
    console.log('🔗 Click en ProductCard, navegando a:', `/productos/${productSlug}`);
    window.location.href = `/productos/${productSlug}`;
  };

  return (
    <div 
      onClick={handleClick}
      className="block cursor-pointer"
    >
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer">
        {/* Contenedor de imagen con altura fija uniforme */}
        <div className="relative w-full h-64 bg-white overflow-hidden">
          {/* Imagen con tamaño uniforme */}
          <img
            key={`product-${product.id}-img`}
            src={imageUrl}
            alt={product.nombre || 'Producto'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              console.log('Error cargando imagen, usando fallback para:', product.nombre);
              target.src = '/images/no-image.jpg';
            }}
            loading="lazy"
          />
        </div>

        <div className="p-4">
          {/* Nombre del producto */}
          <h3 className="text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem] leading-snug">
            {product.nombre}
          </h3>
          
          {/* Precio */}
          <div className="mb-3">
            {product.precio_descuento ? (
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-gray-900">
                  $ {parseFloat(product.precio_descuento).toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  $ {parseFloat(product.precio).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-gray-900">
                $ {parseFloat(product.precio).toLocaleString()}
              </span>
            )}
          </div>

          {/* Botón comprar */}
          <button className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm">
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

