import { API_ROOT } from '@/utils/apiBase';

export const revalidate = 1800;

export async function GET() {
  const res = await fetch(`${API_ROOT}/feeds/facebook-products.xml`, {
    headers: { Accept: 'application/xml' },
    next: { revalidate },
  });

  if (!res.ok) {
    return new Response('Feed no disponible', { status: 502 });
  }

  return new Response(await res.text(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  });
}
