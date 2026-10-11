import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/utils/catalog';

// Las APIs privadas se listan una por una: un `Disallow: /api/` general obliga
// al robot a resolver el conflicto con `Allow: /api/publico/`, y los lectores
// que no aplican la regla más específica terminan descartando la API pública.
const PRIVATE_API_PATHS = [
  '/api/catalogo/',
  '/api/carrito/',
  '/api/usuarios/',
  '/api/pedidos/',
  '/api/notificaciones/',
  '/api/core/',
];

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
        // El link de confirmación lleva `noindex` en la propia página: dejarlo
        // accesible permite que el asistente que armó el pedido lo abra y
        // verifique el resumen antes de pasárselo a la persona.
        allow: [
          '/',
          '/api/publico/',
          '/feeds/',
          '/llms.txt',
          '/pedido/confirmar/',
          '/*/pedido/confirmar/',
        ],
        disallow: [...PRIVATE_API_PATHS, ...PRIVATE_PATHS],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
