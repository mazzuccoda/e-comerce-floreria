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
      {/* Estilo EXACTO de Florería Palermo */}
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
        {/* Imagen con overlay de "Envío gratis" */}
        <div className="relative w-full h-48 sm:h-56 lg:h-64 bg-gray-50 overflow-hidden">
          <img
            key={`product-${product.id}-img`}
            src={imageUrl}
            alt={product.nombre || 'Producto'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              console.log('Error cargando imagen, usando fallback para:', product.nombre);
              target.src = '/images/no-image.jpg';
            }}
            loading="lazy"
          />
          {/* Badge "Envío gratis" solo si está marcado en la BD */}
          {product.envio_gratis && (
            <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
              Envío gratis
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Nombre del producto */}
          <h3 className="text-gray-900 text-sm sm:text-base font-normal mb-2 leading-tight min-h-[2.5rem] line-clamp-2">
            {product.nombre}
          </h3>
          
          {/* Precio */}
          <div className="mb-3">
            {product.precio_descuento ? (
              <div className="space-y-0.5">
                <p className="text-lg sm:text-xl font-normal text-gray-900">
                  $ {parseFloat(product.precio_descuento).toLocaleString()}
                </p>
                <p className="text-sm sm:text-base text-gray-400 line-through">
                  $ {parseFloat(product.precio).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                $ {parseFloat(product.precio).toLocaleString()}
              </p>
            )}
          </div>

          {/* Botón EXACTO estilo Florería Palermo - OUTLINE */}
          <button className="w-full border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-medium py-2.5 sm:py-3 px-4 rounded-md transition-all duration-200 text-sm">
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

