import { API_ROOT } from '@/utils/apiBase';

// Sin ISR: el feed lo leen Meta y los agentes, y una caché congelada publica
// precios y links viejos.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const res = await fetch(`${API_ROOT}/feeds/facebook-products.xml`, {
    headers: { Accept: 'application/xml' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return new Response('Feed no disponible', { status: 502 });
  }

  return new Response(await res.text(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=300',
    },
  });
}
