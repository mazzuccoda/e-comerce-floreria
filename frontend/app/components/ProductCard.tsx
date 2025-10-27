'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  // Verificar si el producto requiere cotización (precio = 0)
  const requiresQuote = parseFloat(product.precio) === 0;

  // Generar mensaje de WhatsApp para cotización
  const generateWhatsAppUrl = () => {
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491112345678';
    const message = `Hola! Me interesa obtener una cotización para:\n\n- Producto: ${product.nombre}\n- Categoría: ${product.categoria.nombre}\n\n¿Podrían brindarme más información?`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

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
          
          {/* Precio o Cotización */}
          <div className="mb-3">
            {requiresQuote ? (
              <div className="text-center">
                <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full inline-block">
                  Solicitar cotización
                </span>
              </div>
            ) : product.precio_descuento ? (
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

          {/* Botón comprar o WhatsApp */}
          {requiresQuote ? (
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-md transition-colors duration-200 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Consultar por WhatsApp
            </a>
          ) : (
            <button className="w-full border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-medium py-2.5 sm:py-3 px-4 rounded-md transition-all duration-200 text-sm">
              Comprar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

