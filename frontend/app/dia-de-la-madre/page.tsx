import type { Metadata } from 'next';
import Link from 'next/link';

import ProductCard from '../components/ProductCard';
import { getProducts, productUrl, SITE_URL } from '@/utils/catalog';

const CATEGORIA_SLUG = 'dia-de-la-madre';
const CANONICAL = `${SITE_URL}/es/dia-de-la-madre`;
const TITLE = 'Flores para el Día de la Madre en Tucumán | Florería Cristina';
const DESCRIPTION =
  'Ramos y arreglos para el Día de la Madre con entrega en Yerba Buena y San Miguel de Tucumán. Pedidos hasta las 17:00 se entregan el mismo día; también podés programar la entrega para el domingo.';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    type: 'website',
  },
};

export default async function DiaDeLaMadrePage() {
  const productos = (await getProducts()).filter(
    (producto) => producto.categoria?.slug === CATEGORIA_SLUG
  );

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Flores para el Día de la Madre — Florería Cristina',
    url: CANONICAL,
    numberOfItems: productos.length,
    itemListElement: productos.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.nombre,
        url: productUrl(product),
        image: product.imagen_principal || undefined,
        sku: product.sku,
        offers: {
          '@type': 'Offer',
          price: parseFloat(product.precio_descuento || product.precio),
          priceCurrency: 'ARS',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: productUrl(product),
        },
      },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <h1 className="text-3xl font-semibold text-gray-900">
        Flores para el Día de la Madre en Tucumán
      </h1>
      <p className="mt-3 max-w-3xl text-gray-600">
        Ramos y arreglos preparados el mismo día en nuestra florería de Yerba Buena, con entrega a
        domicilio en Yerba Buena y San Miguel de Tucumán o retiro en Av. Solano Vera 480. Los
        pedidos express confirmados hasta las <strong>17:00 hs</strong> se entregan el mismo día;
        también podés programar la entrega para la fecha que quieras.
      </p>

      {productos.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((producto) => (
            <ProductCard key={producto.id} product={producto} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-gray-600">
          Estamos preparando la selección del Día de la Madre. Mientras tanto, mirá todos los ramos
          disponibles.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/es/productos?categoria=${CATEGORIA_SLUG}`}
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:text-emerald-800"
        >
          Ver la categoría completa con filtros
        </Link>
        <Link
          href="/es/zonas"
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:text-emerald-800"
        >
          Zonas y costos de envío
        </Link>
      </div>
    </div>
  );
}
