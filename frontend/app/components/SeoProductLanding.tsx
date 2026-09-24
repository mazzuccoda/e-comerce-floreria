import type { Metadata } from 'next';
import Link from 'next/link';

import ProductCard from './ProductCard';
import Breadcrumbs from './Breadcrumbs';
import { CUTOFF } from '@/utils/businessHours';
import { getLandingProducts, productUrl, SITE_URL } from '@/utils/catalog';
import { cloudinaryScaled } from '@/utils/cloudinary';
import {
  breadcrumbJsonLd,
  getLanding,
  landingBreadcrumbs,
  landingPath,
  type SeoLanding,
} from '@/utils/seoLandings';

const LINK_CLASS =
  'rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:text-emerald-800';

function canonicalUrl(landing: SeoLanding): string {
  return `${SITE_URL}/es${landingPath(landing)}`;
}

export function landingMetadata(landing: SeoLanding): Metadata {
  const url = canonicalUrl(landing);
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: url },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url,
      type: 'website',
    },
  };
}

/**
 * Landing SEO reutilizable: productos reales del catálogo renderizados en el
 * servidor, con `ItemList` y `BreadcrumbList`. La configuración de cada landing
 * vive en `utils/seoLandings.ts`.
 */
export default async function SeoProductLanding({ landing }: { landing: SeoLanding }) {
  const productos = await getLandingProducts(landing);
  const url = canonicalUrl(landing);
  const breadcrumbs = landingBreadcrumbs(landing);
  const relacionadas = landing.related
    .map((slug) => getLanding(slug))
    .filter((l): l is SeoLanding => Boolean(l));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${landing.h1} — Florería Cristina`,
    url,
    numberOfItems: productos.length,
    itemListElement: productos.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.nombre,
        url: productUrl(product),
        image: product.imagen_principal ? cloudinaryScaled(product.imagen_principal, 1200) : undefined,
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemList, breadcrumbJsonLd(breadcrumbs, SITE_URL, url)]),
        }}
      />

      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{landing.h1}</h1>
      <p className="mt-3 max-w-3xl text-gray-600">{landing.intro}</p>
      <p className="mt-2 max-w-3xl text-sm text-gray-600">
        Pedidos express confirmados de lunes a sábado hasta las <strong>{CUTOFF} hs</strong> se
        entregan el mismo día. El costo de envío se calcula con la dirección en el checkout.
      </p>

      {productos.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((producto) => (
            <ProductCard key={producto.id} product={producto} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-gray-600">
          En este momento no hay productos cargados en esta sección. Mirá el catálogo completo o
          escribinos por WhatsApp y armamos algo a medida.
        </p>
      )}

      <nav aria-label="Secciones relacionadas" className="mt-10 flex flex-wrap gap-3">
        {relacionadas.map((relacionada) => (
          <Link key={relacionada.slug} href={`/es${landingPath(relacionada)}`} className={LINK_CLASS}>
            {relacionada.name}
          </Link>
        ))}
        <Link href="/es/productos" className={LINK_CLASS}>
          Todo el catálogo
        </Link>
        <Link href="/es/zonas" className={LINK_CLASS}>
          Zonas y costos de envío
        </Link>
      </nav>
    </div>
  );
}
