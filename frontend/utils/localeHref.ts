export const LOCALES = ['es', 'en'] as const;
export const DEFAULT_LOCALE = 'es';

/**
 * Prefija una ruta interna con el locale para que el enlace apunte directo a la
 * URL final y no pase por la redirección del middleware.
 */
export function localeHref(path: string, locale: string = DEFAULT_LOCALE): string {
  if (!path.startsWith('/')) return path;
  const lang = (LOCALES as readonly string[]).includes(locale) ? locale : DEFAULT_LOCALE;
  if (new RegExp(`^/(${LOCALES.join('|')})(/|$)`).test(path)) return path;
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}
