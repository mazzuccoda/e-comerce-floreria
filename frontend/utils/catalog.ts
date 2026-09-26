import { Product } from '@/types/Product';
import { API_URL } from '@/utils/apiBase';
import { productMatchesLanding, type SeoLanding } from '@/utils/seoLandings';

const REVALIDATE_SECONDS = 300;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriacristina.com.ar').replace(/\/+$/, '');

export function productPath(product: Pick<Product, 'id' | 'slug'>): string {
  return `/productos/${product.slug || product.id}`;
}

export function productUrl(product: Pick<Product, 'id' | 'slug'>, locale = 'es'): string {
  return `${SITE_URL}/${locale}${productPath(product)}`;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/catalogo/productos/`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

async function fetchBySlug(slug: string, fresh: boolean): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/catalogo/productos/?slug=${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: REVALIDATE_SECONDS } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list: Product[] = Array.isArray(data) ? data : data.results ?? [];
    // find y no list[0]: si el backend todavía no tiene el filtro ?slug=, devuelve todo.
    return list.find((p) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

/**
 * Resuelve un producto a partir del segmento de URL, que históricamente puede
 * ser el id interno o el slug. Consulta sólo ese producto (no el listado
 * cacheado), así un producto recién creado no da 404.
 */
export async function getProduct(param: string): Promise<Product | null> {
  if (/^\d+$/.test(param)) {
    try {
      const res = await fetch(`${API_URL}/catalogo/productos/${param}/`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (res.ok) return await res.json();
    } catch {
      // sigue por slug
    }
  }
  // Primero con caché; si no está (producto nuevo o caché vieja), una vez sin caché antes del 404.
  return (await fetchBySlug(param, false)) ?? (await fetchBySlug(param, true));
}

/**
 * SKUs de la intención (p. ej. `romantico`) según la API pública, ya ordenados
 * por relevancia. La lista de términos vive sólo en `catalogo/public_api.py`.
 */
async function getSkusByIntention(intencion: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/publico/productos?intencion=${encodeURIComponent(intencion)}&limit=50`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.productos) ? data.productos.map((p: { sku: string }) => p.sku) : [];
  } catch {
    return [];
  }
}

/** Productos reales de una landing SEO, con los disponibles primero. */
export async function getLandingProducts(landing: SeoLanding): Promise<Product[]> {
  const productos = (await getProducts()).filter((p) => !p.es_adicional);

  if (landing.source.kind === 'intencion') {
    const skus = await getSkusByIntention(landing.source.intencion);
    const porSku = new Map(productos.filter((p) => p.sku).map((p) => [p.sku as string, p]));
    return skus.map((sku) => porSku.get(sku)).filter((p): p is Product => Boolean(p));
  }

  const deLanding = productos.filter((p) => productMatchesLanding(landing, p));
  return [...deLanding.filter((p) => p.stock > 0), ...deLanding.filter((p) => p.stock <= 0)];
}
