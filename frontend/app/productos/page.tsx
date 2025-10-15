import { Suspense } from 'react';
import ProductListClient from '../components/ProductListClient';

export default function ProductosPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8 text-center">Cargando productos...</div>}>
        <ProductListClient showFilters={true} />
      </Suspense>
    </div>
  );
}
