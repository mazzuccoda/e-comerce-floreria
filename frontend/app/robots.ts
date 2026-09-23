import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/utils/catalog';

const PRIVATE_PATHS = [
  '/admin',
  '/*/admin',
  '/checkout',
  '/*/checkout',
  '/carrito',
  '/*/carrito',
  '/perfil',
  '/*/perfil',
  '/mis-pedidos',
  '/*/mis-pedidos',
  '/pedido/',
  '/*/pedido/',
  '/login',
  '/*/login',
  '/registro',
  '/*/registro',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/_next/` y `/static/` quedan permitidos: bloquearlos impide que Google
        // renderice el sitio y evalúe su experiencia de página.
        allow: ['/', '/api/publico/', '/feeds/', '/llms.txt'],
        disallow: ['/api/', ...PRIVATE_PATHS],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
