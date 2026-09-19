'use client';

import ProductCard from './ProductCard';
import { Product } from '@/types/Product';

interface FeaturedGridProps {
  products: Product[];
}

/**
 * Destacados resueltos en el servidor: a diferencia de ProductListClient no
 * depende de la URL, así el HTML inicial de la home ya trae los productos.
 */
export default function FeaturedGrid({ products }: FeaturedGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mt-8 px-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
