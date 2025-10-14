'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartRobust } from '../../context/CartContextRobust';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading } = useCartRobust();
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart || product.stock <= 0) {
      console.log('⛔ No se puede agregar aún', {
        addingToCart,
        stock: product.stock,
        globalLoading: loading
      });
      
      if (product.stock <= 0) {
        toast.error('Producto sin stock disponible');
      } else if (addingToCart) {
        toast.error('Ya se está procesando tu solicitud');
      }
      return;
    }
    
    if (!product.id) {
      console.error('Producto sin ID válido:', product);
      toast.error('Error con el producto seleccionado');
      return;
    }
    
    setAddingToCart(true);
    try {
      console.log('🛒 Intentando agregar al carrito:', { 
        id: product.id, 
        nombre: product.nombre,
        stock: product.stock 
      });
      
      await addToCart(product, 1);
      toast.success(`${product.nombre} agregado al carrito`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
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
      
      <div className="relative aspect-square bg-gray-50">
        <img
          key={`product-${product.id}-img`}
          src={imageUrl}
          alt={product.nombre || 'Producto'}
          className="w-full h-full object-contain"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            console.log('Error cargando imagen, usando fallback para:', product.nombre);
            // Usar la imagen local garantizada
            target.src = '/images/no-image.jpg';
            // Aplicar clases para mejorar apariencia del fallback
            target.classList.add('p-4');
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
          className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
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

