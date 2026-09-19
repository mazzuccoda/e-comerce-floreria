import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductListClient from '../components/ProductListClient';
import { getProducts, productUrl, SITE_URL } from '../../utils/catalog';
import { Product } from '@/types/Product';

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

interface CatalogoPageProps {
  searchParams: { categoria?: string; ocasion?: string; tipo_flor?: string; search?: string };
}

function filtrar(productos: Product[], searchParams: CatalogoPageProps['searchParams']): Product[] {
  const { categoria, ocasion, tipo_flor: tipoFlor, search } = searchParams;
  let resultado = productos;

  if (categoria) {
    resultado = resultado.filter((p) => p.categoria?.slug === categoria);
  }
  if (ocasion) {
    resultado = resultado.filter((p) => p.ocasiones?.some((o) => String(o.id) === ocasion || o.nombre === ocasion));
  }
  if (tipoFlor) {
    resultado = resultado.filter((p) => String(p.tipo_flor?.id) === tipoFlor);
  }
  if (search) {
    const termino = search.toLowerCase();
    resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(termino));
  }
  if (!categoria && !ocasion && !tipoFlor && !search) {
    const sinAdicionales = resultado.filter((p) => !p.es_adicional);
    if (sinAdicionales.length > 0) resultado = sinAdicionales;
  }

  return resultado;
}

export default async function ProductosPage({ searchParams }: CatalogoPageProps) {
  const productos = filtrar(await getProducts(), searchParams);

  // Lista de productos para buscadores y agentes: nombre, precio y URL de cada ficha.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de Florería Cristina',
    numberOfItems: productos.length,
    itemListElement: productos.slice(0, 60).map((product, index) => ({
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
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <Suspense fallback={<div className="p-8 text-center">Cargando productos...</div>}>
        <ProductListClient showFilters={true} initialProducts={productos} />
      </Suspense>
    </div>
  );
}
