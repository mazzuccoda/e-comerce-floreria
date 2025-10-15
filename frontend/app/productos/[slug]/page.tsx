'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types/Product';
import Image from 'next/image';
import { useCartRobust } from '@/context/CartContextRobust';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProductPageParams {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageParams) {
  const [slug, setSlug] = React.useState<string>('');
  const [product, setProduct] = useState<Product | null>(null); 
  const { addToCart, loading: cartLoading } = useCartRobust();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const getImageUrl = (url: string) => {
    const fallbackImage = '/images/no-image.jpg';
    
    if (!url || url === 'null' || url === 'undefined') {
      return fallbackImage;
    }
    
    if (url.startsWith('/media/')) {
      return `http://localhost${url}`;
    }
    
    if (url.includes('web:8000')) {
      return url.replace('web:8000', 'localhost');
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    return fallbackImage;
  };

  const handleAddToCart = async () => {
    if (addingToCart || !product) return;
    
    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      toast.success(`${product.nombre} agregado al carrito`);
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'No se pudo agregar al carrito'}`);
    } finally {
      setAddingToCart(false);
    }
  };

  // Resolver params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    resolveParams();
  }, [params]);

  // Fetch product cuando tenemos el slug
  useEffect(() => {
    if (!slug) return;
    
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/productos/${slug}/`);
        if (!res.ok) {
          throw new Error('Producto no encontrado');
        }
        const data = await res.json();
        setProduct(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/productos" className="text-green-700 hover:underline">
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h2>
          <Link href="/productos" className="text-green-700 hover:underline">
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón volver */}
        <Link 
          href="/productos" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver a productos</span>
        </Link>

        {/* Grid principal */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Imagen del producto */}
          <div className="relative">
            <div className="sticky top-8">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={getImageUrl(product.imagen_principal)}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/no-image.jpg';
                    target.classList.add('p-8', 'object-contain');
                  }}
                />
              </div>
              
              {/* Badge de envío gratis */}
              {product.envio_gratis && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  Envío gratis
                </div>
              )}
            </div>
          </div>

          {/* Información del producto */}
          <div className="flex flex-col">
            {/* Título */}
            <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4 leading-tight">
              {product.nombre}
            </h1>

            {/* Descripción corta */}
            {product.descripcion_corta && (
              <p className="text-lg text-gray-600 mb-6 italic border-l-4 border-green-600 pl-4">
                {product.descripcion_corta}
              </p>
            )}

            {/* Precio */}
            <div className="mb-8">
              {product.precio_descuento ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-green-700">
                    $ {parseFloat(product.precio_descuento).toLocaleString()}
                  </span>
                  <span className="text-2xl text-gray-400 line-through">
                    $ {parseFloat(product.precio).toLocaleString()}
                  </span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {Math.round((1 - parseFloat(product.precio_descuento) / parseFloat(product.precio)) * 100)}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  $ {parseFloat(product.precio).toLocaleString()}
                </span>
              )}
            </div>

            {/* Descripción completa */}
            {product.descripcion && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción:</h2>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {product.descripcion}
                  </p>
                </div>
              </div>
            )}

            {/* Selector de cantidad */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-colors font-semibold"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-colors font-semibold"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">
                  ({product.stock} disponibles)
                </span>
              </div>
            </div>

            {/* Botón agregar al carrito */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock <= 0}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {addingToCart ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Agregando...
                </span>
              ) : product.stock <= 0 ? (
                'Sin stock'
              ) : (
                'Agregar al carrito'
              )}
            </button>

            {/* Información adicional */}
            <div className="mt-8 space-y-3">
              {product.tipo_flor && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-2xl">🌸</span>
                  <span>Tipo: <strong>{product.tipo_flor.nombre}</strong></span>
                </div>
              )}
              {product.ocasiones && product.ocasiones.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-2xl">🎉</span>
                  <span>Ocasiones: <strong>{product.ocasiones.map(o => o.nombre).join(', ')}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
