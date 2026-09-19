import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductListClient from '../components/ProductListClient';
import { SITE_URL } from '../../utils/catalog';

export const metadata: Metadata = {
  title: 'Catálogo de ramos, plantas y arreglos florales | Florería Cristina',
  description:
    'Todo el catálogo de Florería Cristina: ramos de flores frescas, plantas, arreglos y regalos. Filtrá por categoría, ocasión y tipo de flor, con envío en Tucumán o retiro en tienda.',
  alternates: {
    canonical: `${SITE_URL}/es/productos`,
  },
  openGraph: {
    title: 'Catálogo de ramos, plantas y arreglos florales | Florería Cristina',
    description:
      'Ramos de flores frescas, plantas, arreglos y regalos con envío en Yerba Buena y San Miguel de Tucumán.',
    url: `${SITE_URL}/es/productos`,
    type: 'website',
  },
};

export default function ProductosPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8 text-center">Cargando productos...</div>}>
        <ProductListClient showFilters={true} />
      </Suspense>
    </div>
  );
}
