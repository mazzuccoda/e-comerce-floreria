'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';
import { addToLocalCart } from '@/context/LocalCartStorage';

interface ProductCardProps {
  product: Product;
}

export default function OfflineProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Función para obtener URL de imagen memoizada para evitar recálculos
  const imageUrl = useMemo(() => {
    // SOLUCIÓN DEFINITIVA: Usar siempre una imagen local garantizada
    // Esto evita errores de conectividad y problemas con servicios externos
    const fallbackImage = '/images/no-image.jpg';
    
    try {
      const url = product.imagen_principal;
      
      // PASO 1: Si no hay URL, usar inmediatamente la imagen fallback
      if (!url || url === 'null' || url === 'undefined') {
        console.log('Sin imagen para producto en modo offline:', product.nombre);
        return fallbackImage;
      }
      
      // PASO 2: Modo Offline: Si tenemos imágenes en /media (backend) usar fallback
      if (url.includes('/media/') || url.includes('web:8000') || 
          url.includes('localhost:8000')) {
        // En modo offline, usar la imagen fallback garantizada
        console.log('Modo offline: Usando imagen fallback para producto:', product.nombre);
        return fallbackImage;
      }

      // PASO 3: Si es una URL externa válida (no placeholder)
      if ((url.startsWith('http://') || url.startsWith('https://')) && 
          !url.includes('placeholder.com')) {
        // En modo offline, es mejor usar fallback siempre para evitar solicitudes externas
        return fallbackImage;
      }

      // PASO 4: Para cualquier otro caso, usar la imagen fallback local
      return fallbackImage;
    } catch (error) {
      console.error('Error procesando URL de imagen en modo offline:', error);
      return fallbackImage;
    }
  }, [product.imagen_principal, product.nombre]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart || product.stock <= 0) {
      if (product.stock <= 0) {
        toast.error('Producto sin stock disponible');
      } else if (addingToCart) {
        toast.error('Ya se está procesando tu solicitud');
      }
      return;
    }
    
    if (!product.id) {
      toast.error('Error con el producto seleccionado');
      return;
    }
    
    setAddingToCart(true);
    try {
      // Usar SOLO el carrito local
      const localCart = addToLocalCart(product, 1);
      
      // Mostrar mensaje de éxito
      toast.success(`${product.nombre} agregado al carrito local`);
      console.log('🛒 Producto agregado al carrito local:', product.nombre);
      
    } catch (error: any) {
      console.error('Error adding to local cart:', error);
      toast.error(`Error: ${error.message || 'No se pudo agregar al carrito'}`);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
      {product.envio_gratis && (
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-semibold z-10">
          ENVÍO GRATIS
        </div>
      )}
      
      <div 
        className="relative cursor-pointer h-48 overflow-hidden bg-gray-50"
        onClick={() => router.push(`/productos/${product.slug}`)}
      >
        <img
          key={`offline-product-${product.id}-img`}
          src={imageUrl}
          alt={product.nombre || 'Producto offline'}
          className="w-full h-full object-contain"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            console.log('Error cargando imagen en modo offline, usando fallback para:', product.nombre);
            // Usar la imagen local garantizada
            target.src = '/images/no-image.jpg';
            // Aplicar clases para mejorar apariencia del fallback
            target.classList.add('p-4');
          }}
          loading="lazy"
        />
        
        {/* Descuento */}
        {product.porcentaje_descuento && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md font-semibold">
            {product.porcentaje_descuento}% OFF
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-semibold line-clamp-2" title={product.nombre}>{product.nombre}</h2>
        </div>
        
        <div className="text-sm text-gray-500 mb-2 line-clamp-1" title={product.descripcion_corta}>
          {product.descripcion_corta || product.descripcion.substring(0, 50)}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-lg font-bold">
            ${product.precio_final}
            {product.precio_descuento && (
              <span className="text-sm text-gray-400 line-through ml-2">${product.precio}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock <= 0}
            className={`px-2 py-1 rounded text-white text-sm font-semibold transition 
              ${product.stock <= 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : addingToCart 
                  ? 'bg-yellow-500 cursor-wait'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {product.stock <= 0 
              ? 'Sin Stock' 
              : addingToCart 
                ? 'Agregando...' 
                : 'Agregar'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
