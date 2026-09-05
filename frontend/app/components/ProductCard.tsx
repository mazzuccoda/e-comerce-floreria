'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/types/Product';
import { useI18n } from '../../context/I18nContext';
import { API_ROOT } from '@/utils/apiBase';

interface ProductCardProps {
  product: Product;
  hideDiscountBadge?: boolean; // Prop para ocultar el badge de descuento
}

export default function ProductCard({ product, hideDiscountBadge = false }: ProductCardProps) {
  const { t } = useI18n();

  // Verificar si el producto requiere cotización (precio = 0)
  const requiresQuote = parseFloat(product.precio) === 0;

  // Función para obtener URL de imagen memoizada para evitar recálculos
  const imageUrl = useMemo(() => {
    // SOLUCIÓN DEFINITIVA: Usar siempre una imagen local garantizada
    // Esto evita errores de conectividad y problemas con servicios externos
    const fallbackImage = '/images/no-image.jpg';
    
    try {
      const url = product.imagen_principal;
      
      // PASO 1: Si no hay URL, usar inmediatamente la imagen fallback
      if (!url || url === 'null' || url === 'undefined') {
        return fallbackImage;
      }
      
      // PASO 2: Si es una URL de media del backend, construir URL completa
      if (url.startsWith('/media/')) {
        return `${API_ROOT}${url}`;
      }
      
      // Si tiene web:8000 (URL interna de Docker), reemplazar con localhost
      if (url.includes('web:8000')) {
        return url.replace(/https?:\/\/web:8000/, API_ROOT);
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

  return (
    <Link
      href={`/productos/${productSlug}`}
      className="block"
      aria-label={product.nombre}
    >
      {/* Estilo EXACTO de Florería Palermo */}
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
        {/* Imagen con overlay de "Envío gratis" y badge de descuento */}
        <div className="relative w-full h-48 sm:h-56 lg:h-64 bg-gray-50 overflow-hidden">
          <img
            key={`product-${product.id}-img`}
            src={imageUrl}
            alt={product.nombre || 'Producto'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
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
          {/* Badge de descuento en esquina superior derecha */}
          {!hideDiscountBadge && (product.porcentaje_descuento ?? 0) > 0 && (
            <div className="absolute top-3 right-3 bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
              -{product.porcentaje_descuento}%
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Nombre del producto */}
          <h3 className="text-gray-900 text-sm sm:text-base font-normal mb-2 leading-tight min-h-[2.5rem] line-clamp-2">
            {product.nombre}
          </h3>
          
          {/* Precio o Cotización */}
          <div className="mb-3">
            {requiresQuote ? (
              <div className="text-center">
                <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full inline-block">
                  Solicitar cotización
                </span>
              </div>
            ) : product.precio_descuento && (product.porcentaje_descuento ?? 0) > 0 ? (
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-green-700">
                  $ {parseFloat(product.precio_descuento).toLocaleString('es-AR')}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 line-through">
                  $ {parseFloat(product.precio).toLocaleString('es-AR')}
                </p>
              </div>
            ) : (
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                $ {parseFloat(product.precio).toLocaleString('es-AR')}
              </p>
            )}
          </div>

          {/* CTA: la tarjeta completa lleva al detalle del producto */}
          <span className="block w-full text-center border-2 border-green-600 text-green-600 group-hover:bg-green-600 group-hover:text-white font-medium py-2.5 sm:py-3 px-4 rounded-md transition-all duration-200 text-sm">
            {t('products.seeDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}

