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
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
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

        {/* Botón de compra mejorado */}
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart || product.stock <= 0}
          className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 text-sm shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {addingToCart ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Agregando...
            </span>
          ) : product.stock <= 0 ? (
            'Sin stock'
          ) : (
            'Comprar'
          )}
        </button>
      </div>
    </div>
  );
}

