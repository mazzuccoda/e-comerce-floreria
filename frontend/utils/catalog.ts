import { Product } from '@/types/Product';
import { API_URL } from '@/utils/apiBase';

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

/**
 * Resuelve un producto a partir del segmento de URL, que históricamente puede
 * ser el id interno o el slug.
 */
export async function getProduct(param: string): Promise<Product | null> {
  const byId = /^\d+$/.test(param);

  if (byId) {
    try {
      const res = await fetch(`${API_URL}/catalogo/productos/${param}/`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (res.ok) return await res.json();
    } catch {
      // cae al listado
    }
  }

  const productos = await getProducts();
  return productos.find((p) => p.slug === param || String(p.id) === param) ?? null;
}
