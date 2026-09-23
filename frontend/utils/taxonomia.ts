import { API_URL } from '@/utils/apiBase';

const REVALIDATE_SECONDS = 3600;

export interface TipoFlor {
  id: number;
  nombre: string;
}

export interface Ocasion {
  id: number;
  nombre: string;
}

async function getTaxonomia<T>(path: string, locale: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}/catalogo/${path}/?lang=${locale}`, {
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

export function getTiposFlor(locale = 'es'): Promise<TipoFlor[]> {
  return getTaxonomia<TipoFlor>('tipos-flor', locale);
}

export function getOcasiones(locale = 'es'): Promise<Ocasion[]> {
  return getTaxonomia<Ocasion>('ocasiones', locale);
}
