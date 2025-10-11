'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartRobust } from '../../context/CartContextRobust';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading } = useCartRobust();
  const [addingToCart, setAddingToCart] = useState(false);

  const getImageUrl = (url: string) => {
    // Fallback local
    if (!url || url === 'null' || url === 'undefined') return '/images/no-image.jpg';

    // URLs absolutas externas
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Si es una URL del backend local, convertirla a ruta relativa para que nginx la sirva
      if (url.includes('localhost:8000') || url.includes('web:8000')) {
        const urlObj = new URL(url);
        return urlObj.pathname; // Retorna solo /media/productos/...
      }
      return url;
    }

    // Rutas relativas: dejar que Next.js/Nginx reescriba /media hacia el backend
    if (url.startsWith('/')) {
      return url;
    }

    // En caso de que llegue una ruta relativa sin slash inicial
    return `/${url}`;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart || product.stock <= 0) {
      console.log('⛔ No se puede agregar aún', {
        addingToCart,
        stock: product.stock,
        globalLoading: loading
      });
      return;
    }
    
    setAddingToCart(true);
    try {
      await addToCart(product, 1);
      toast.success(`${product.nombre} agregado al carrito`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
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
      
      <div className="relative aspect-square">
        <img
          src={getImageUrl(product.imagen_principal)}
          alt={product.nombre}
          className="w-full h-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/no-image.jpg';
          }}
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.nombre}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          {product.precio_descuento ? (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-green-600">
                ${parseFloat(product.precio_descuento).toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${parseFloat(product.precio).toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-800">
              ${parseFloat(product.precio).toLocaleString()}
            </span>
          )}
        </div>

        <button 
          onClick={handleAddToCart}
          disabled={addingToCart || product.stock <= 0}
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
        >
          {addingToCart ? (
            <span>⏳ Agregando...</span>
          ) : product.stock <= 0 ? (
            'Sin stock'
          ) : (
            'Agregar al carrito'
          )}
        </button>
      </div>
    </div>
  );
}

