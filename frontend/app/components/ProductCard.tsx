'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const getImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/300x200/f0f0f0/666666?text=Sin+Imagen';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Para imágenes locales, usar el servidor Django
    const baseUrl = 'http://localhost:8000';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart || loading || product.stock <= 0) return;
    
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
    <div className="product-card">
      {product.envio_gratis && (
        <div className="shipping-badge">
          Envío gratis
        </div>
      )}
      
      <Image
        src={getImageUrl(product.imagen_principal)}
        alt={product.nombre}
        width={300}
        height={250}
        className="product-image"
        priority={false}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://via.placeholder.com/300x200/f0f0f0/666666?text=Sin+Imagen';
        }}
      />

      <div className="product-info">
        <h3 className="product-name">{product.nombre}</h3>
        
        <div className="product-price">
          ${product.precio?.toLocaleString()}
        </div>

        {product.descripcion && (
          <p className="product-description">
            {product.descripcion.length > 100 
              ? `${product.descripcion.substring(0, 100)}...` 
              : product.descripcion
            }
          </p>
        )}

        <button 
          onClick={handleAddToCart}
          disabled={addingToCart || loading || product.stock <= 0}
          className="add-to-cart-btn"
        >
          {addingToCart ? (
            <span>⏳</span>
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

