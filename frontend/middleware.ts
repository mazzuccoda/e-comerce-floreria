import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['es', 'en'];
const defaultLocale = 'es';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Un solo host canónico: www duplica todo el sitio en un segundo dominio.
  const host = request.headers.get('host');
  if (host?.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4);
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  // Ignorar rutas especiales (API, assets, Next internals)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/media') ||
    pathname.includes('.') // archivos estáticos (favicon, robots, etc)
  ) {
    return NextResponse.next();
  }

  // Detectar si la ruta ya tiene locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Si ya tiene locale, hacer rewrite interno para que Next encuentre las páginas
  if (pathnameHasLocale) {
    const locale = pathname.split('/')[1];
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    const url = request.nextUrl.clone();
    url.pathname = pathWithoutLocale;

    // El locale viaja como header de la request para que las páginas de servidor
    // puedan leerlo con `headers()`.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);

    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.headers.set('x-locale', locale);
    return response;
  }

  // Si no tiene locale, redirigir agregando el locale
  // Leer preferencia de cookie o usar default
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = locales.includes(cookieLocale || '') ? cookieLocale : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  // Permanente cuando la URL final no depende de la preferencia del visitante.
  const status = locale === defaultLocale && !cookieLocale ? 308 : 307;

  return NextResponse.redirect(url, status);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest).*)',
  ],
};
