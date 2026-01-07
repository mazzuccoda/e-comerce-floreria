import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['es', 'en'];
const defaultLocale = 'es';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
    
    const response = NextResponse.rewrite(url);
    response.headers.set('x-locale', locale);
    return response;
  }

  // Si no tiene locale, redirigir agregando el locale
  // Leer preferencia de cookie o usar default
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = locales.includes(cookieLocale || '') ? cookieLocale : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  
  return NextResponse.redirect(url);
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
