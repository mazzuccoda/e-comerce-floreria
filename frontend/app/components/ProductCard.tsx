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
    router.push(`/productos/${productSlug}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="block cursor-pointer"
    >
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2 cursor-pointer">
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {/* Badge de envío gratis */}
          {product.envio_gratis && (
            <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold z-10 shadow-md">
              Envío gratis
            </div>
          )}
          
          {/* Imagen con efecto hover */}
          <img
            key={`product-${product.id}-img`}
            src={imageUrl}
            alt={product.nombre || 'Producto'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              console.log('Error cargando imagen, usando fallback para:', product.nombre);
              target.src = '/images/no-image.jpg';
              target.classList.add('p-4', 'object-contain');
            }}
            loading="lazy"
          />
          
          {/* Overlay oscuro sutil en hover */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
        </div>

        <div className="p-5">
          {/* Nombre del producto con tipografía elegante */}
          <h3 className="font-serif text-gray-900 text-base mb-3 line-clamp-2 min-h-[3rem] leading-relaxed tracking-wide">
            {product.nombre}
          </h3>
          
          {/* Descripción corta si existe */}
          {product.descripcion_corta && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.descripcion_corta}
            </p>
          )}
          
          {/* Precio */}
          <div className="flex items-baseline justify-between mb-4">
            {product.precio_descuento ? (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-green-700">
                  $ {parseFloat(product.precio_descuento).toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  $ {parseFloat(product.precio).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                $ {parseFloat(product.precio).toLocaleString()}
              </span>
            )}
          </div>

          {/* Botón ver detalles */}
          <div className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 text-sm shadow-sm hover:shadow-md text-center">
            Ver detalles
          </div>
        </div>
      </div>
    </div>
  );
}

