import { GA_TRACKING_ID } from '@/utils/analytics';

/**
 * Contexto de atribución que el checkout manda al backend para registrar la
 * compra desde el servidor (GA4 Measurement Protocol y Meta Conversions API)
 * con la misma sesión y el mismo usuario que vio el anuncio.
 *
 * Nunca bloquea el checkout: cada dato tiene un tope de espera y, si algo
 * falla, el campo va vacío.
 */
export interface TrackingContext {
  ga_client_id?: string;
  ga_session_id?: string;
  fbp?: string;
  fbc?: string;
  event_source_url?: string;
}

const TIMEOUT_MS = 500;

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** `_ga` = "GA1.1.123456789.1690000000" -> "123456789.1690000000" */
function clientIdFromCookie(): string | undefined {
  const parts = getCookie('_ga')?.split('.');
  return parts && parts.length >= 4 ? parts.slice(-2).join('.') : undefined;
}

/** `_ga_<ID>` = "GS1.1.1690000000.3...." o "GS2.1.s1690000000$o3..." -> "1690000000" */
function sessionIdFromCookie(): string | undefined {
  if (!GA_TRACKING_ID) return undefined;
  const value = getCookie(`_ga_${GA_TRACKING_ID.replace(/^G-/, '')}`);
  const match = value?.match(/^GS\d\.\d\.s?(\d+)/);
  return match ? match[1] : undefined;
}

function gtagGet(field: 'client_id' | 'session_id'): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !GA_TRACKING_ID) {
      resolve(undefined);
      return;
    }
    const timer = setTimeout(() => resolve(undefined), TIMEOUT_MS);
    try {
      window.gtag('get', GA_TRACKING_ID, field, (value: unknown) => {
        clearTimeout(timer);
        resolve(value === undefined || value === null || value === '' ? undefined : String(value));
      });
    } catch {
      clearTimeout(timer);
      resolve(undefined);
    }
  });
}

/** `_fbc` a partir de `?fbclid=` cuando el Pixel todavía no dejó la cookie. */
function fbcFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

export async function getTrackingContext(): Promise<TrackingContext> {
  try {
    const [clientId, sessionId] = await Promise.all([gtagGet('client_id'), gtagGet('session_id')]);
    const context: TrackingContext = {
      ga_client_id: clientId ?? clientIdFromCookie(),
      ga_session_id: sessionId ?? sessionIdFromCookie(),
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc') ?? fbcFromUrl(),
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    return Object.fromEntries(Object.entries(context).filter(([, value]) => value)) as TrackingContext;
  } catch {
    return {};
  }
}
