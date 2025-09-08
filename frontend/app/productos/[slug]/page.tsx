'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/Product';
import Image from 'next/image';
import { useCart } from '@/context/CartContext'; // Importamos el hook del carrito

interface ProductPageParams {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageParams) {
  const { slug } = params;
  const [product, setProduct] = useState<Product | null>(null); 
  const { addToCart } = useCart(); // Obtenemos la función para añadir al carrito
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  useEffect(() => {
    if (slug) {
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
    }
  }, [slug]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{product.nombre}</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Image
            src={getImageUrl(product.imagen_principal)}
            alt={product.nombre}
            width={600}
            height={600}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-gray-700 mb-4">{product.descripcion}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">${product.precio}</h2>
          <button 
            onClick={() => addToCart(product)} 
            className="w-full max-w-xs bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold">
            Añadir al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}
