'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/app/components/ProductCard';
import { Product } from '@/types/Product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

interface RelatedProductsProps {
  categoriaSlug?: string;
  currentProductId: number;
  locale: string;
}

/**
 * Productos de la misma categoría y complementos, para no dejar la ficha sin salida.
 */
export default function RelatedProducts({ categoriaSlug, currentProductId, locale }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([]);
  const [extras, setExtras] = useState<Product[]>([]);

  useEffect(() => {
    const fetchLists = async () => {
      const load = async (url: string): Promise<Product[]> => {
        try {
          const res = await fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } });
          if (!res.ok) return [];
          const data = await res.json();
          if (!Array.isArray(data)) return [];
          return (data as Product[]).filter((p) => p.id !== currentProductId).slice(0, 4);
        } catch {
          return [];
        }
      };

      if (categoriaSlug) {
        setRelated(
          await load(`${API_URL}/catalogo/productos/?categoria=${categoriaSlug}&adicionales=false&lang=${locale}`)
        );
      }
      setExtras(await load(`${API_URL}/catalogo/productos/adicionales/?lang=${locale}`));
    };

    fetchLists();
  }, [categoriaSlug, currentProductId, locale]);

  if (related.length === 0 && extras.length === 0) return null;

  return (
    <div className="mt-16 space-y-12">
      {related.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">También te puede gustar</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {extras.length > 0 && (
        <section>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Completá tu regalo</h2>
          <p className="mb-6 text-gray-600">Sumá un detalle y lo entregamos junto con el arreglo.</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {extras.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
