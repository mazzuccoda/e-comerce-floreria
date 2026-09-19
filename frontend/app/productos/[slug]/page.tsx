import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Product } from '@/types/Product';
import { getProduct, productUrl, SITE_URL } from '@/utils/catalog';
import ProductPageClient from './ProductPageClient';

interface ProductPageParams {
  params: Promise<{ slug: string }>;
}

function getLocale(): string {
  return headers().get('x-locale') === 'en' ? 'en' : 'es';
}

function precioFinal(product: Product): number {
  return parseFloat(product.precio_descuento || product.precio);
}

function descripcion(product: Product): string {
  const texto = (product.descripcion_corta || product.descripcion || '').replace(/\s+/g, ' ').trim();
  if (texto) return texto.slice(0, 160);
  return `${product.nombre} de Florería Cristina. Entrega en Yerba Buena y San Miguel de Tucumán, o retiro en tienda.`;
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Producto no encontrado | Florería Cristina' };
  }

  const url = productUrl(product, getLocale());
  const title = `${product.nombre} | Florería Cristina Tucumán`;
  const description = descripcion(product);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: product.imagen_principal ? [{ url: product.imagen_principal, alt: product.nombre }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageParams) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const locale = getLocale();

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.nombre,
        description: descripcion(product),
        image: product.imagen_principal ? [product.imagen_principal] : undefined,
        sku: product.sku || String(product.id),
        brand: { '@type': 'Brand', name: 'Florería Cristina' },
        category: product.categoria?.nombre,
        offers: {
          '@type': 'Offer',
          url: productUrl(product, locale),
          price: precioFinal(product),
          priceCurrency: 'ARS',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'Florería Cristina', url: SITE_URL },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient slug={slug} initialProduct={product} />
    </>
  );
}
