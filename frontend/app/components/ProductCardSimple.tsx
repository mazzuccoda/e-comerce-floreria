'use client';

import React, { useState } from 'react';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCardSimple({ product }: ProductCardProps) {
  const [addingToCart, setAddingToCart] = useState(false);

  const getImageUrl = (url: string): string => {
    if (!url || url === 'null') {
      return '/images/no-image.jpg';
    }
    
    try {
      // Si es una URL de Unsplash, usar la URL base sin parámetros
      if (url.includes('unsplash.com')) {
        const unsplashUrl = new URL(url);
        return `${unsplashUrl.origin}${unsplashUrl.pathname}`;
      }
      
      // Si es una URL absoluta, usarla directamente
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Si es una ruta relativa, asumir que es una imagen local
      return url;
    } catch (error) {
      console.error('Error procesando URL:', error);
      return '/images/no-image.jpg';
    }
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(product.imagen_principal));
  const [imgError, setImgError] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/images/placeholder.jpg';
    target.onerror = null; // Prevenir loops infinitos
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart || product.stock <= 0) return;
    
    setAddingToCart(true);
    
    try {
      console.log('🛒 Agregando al carrito:', { producto: product.nombre, id: product.id });
      
      const response = await fetch('/api/carrito/simple/add/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      });

      console.log('📝 Headers:', response.headers);
      console.log('🍪 Cookies:', document.cookie);

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error al agregar al carrito: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta del servidor:', data);
      
      if (data.cart && !data.cart.is_empty) {
        toast.success(`${product.nombre} agregado al carrito`);
        // Esperar un momento para que se vea el toast
        setTimeout(() => window.location.reload(), 500);
      } else {
        throw new Error('Error al agregar al carrito: respuesta inválida del servidor');
      }
      
    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      toast.error('Error al agregar al carrito: ' + error.message);
    } finally {
      setAddingToCart(false);
    }
  };

  // Forzar valores para depuración
  const debugInfo = {
    id: product.id,
    nombre: product.nombre,
    stock: product.stock,
    is_active: product.is_active,
    precio: product.precio,
    tipo: typeof product.stock,
    rawData: JSON.stringify(product, null, 2)
  };

  console.log('🔍 Debug Producto:', debugInfo);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border-2 border-blue-500">
      {product.envio_gratis && (
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-semibold z-10">
          ENVÍO GRATIS
        </div>
      )}
      
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">Sin imagen</span>
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={product.nombre}
            width={300}
            height={300}
            className="object-cover transition-all duration-300 hover:scale-105"
            onError={() => {
              console.error('Error cargando imagen:', imgSrc);
              setImgError(true);
              setImgSrc('/images/no-image.jpg');
            }}
            loading="lazy"
          />
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.nombre}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          {product.precio_descuento ? (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-green-600">
                ${parseFloat(product.precio_descuento).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${parseFloat(product.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-800">
              ${parseFloat(product.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <div className="mb-2 p-2 bg-blue-50 text-xs text-gray-800 border border-blue-200 rounded">
          <div><strong>DEBUG INFO:</strong></div>
          <div>ID: {product.id}</div>
          <div>Nombre: {product.nombre}</div>
          <div>Stock: <span className="font-bold">{product.stock}</span> (tipo: {typeof product.stock})</div>
          <div>is_active: <span className="font-bold">{String(product.is_active)}</span> (tipo: {typeof product.is_active})</div>
          <div>Precio: ${product.precio}</div>
        </div>
        <div className="relative">
          <button 
            onClick={handleAddToCart}
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              backgroundColor: '#db2777',
              color: 'white',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              border: 'none',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#be185d'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
            title="Botón forzado a habilitado"
          >
            {addingToCart ? '⏳ AGREGANDO...' : 'AGREGAR AL CARRITO'}
          </button>
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.2)',
              display: 'none',
              zIndex: 5
            }}
          ></div>
        </div>
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-bold text-yellow-800">⚠️ MODO PRUEBA ACTIVO</div>
          <div className="text-yellow-700">• Botón forzado a habilitado</div>
          <div className="text-yellow-700">• Stock: {product.stock}</div>
          <div className="text-yellow-700">• is_active: {String(product.is_active)}</div>
          <div className="mt-1 text-yellow-600 text-xs">Revisa la consola para más detalles (F12 > Consola)</div>
        </div>
      </div>
    </div>
  );
}
