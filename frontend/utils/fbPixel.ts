/**
 * Facebook Pixel tracking utilities
 */

declare global {
  interface Window {
    fbq: any;
  }
}

// Pixels que carga el sitio. El primero es el principal: es propiedad del
// portafolio empresarial y es el que recibe la API de conversiones (servidor).
// El segundo es el pixel histórico de la cuenta publicitaria; se mantiene en
// paralelo unas semanas para no cortar las audiencias y se quita después.
// fbq('track', ...) envía cada evento a todos los pixels inicializados.
const DEFAULT_PIXEL_IDS = '1720539689055218,2362234944085088';

export const FB_PIXEL_IDS: string[] = (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_IDS || DEFAULT_PIXEL_IDS)
  .split(',')
  .map((id) => id.trim())
  .filter((id) => /^\d+$/.test(id));

export const FB_PIXEL_ID = FB_PIXEL_IDS[0] || '';

export const pageview = () => event('PageView');

// El script del Pixel se carga con strategy="afterInteractive": en una carga
// completa (p. ej. la redirección a /checkout/success) los useEffect de la
// página corren antes de que exista window.fbq. Sin esta espera el evento se
// descartaba en silencio, y así se perdía el Purchase del navegador.
const FBQ_RETRY_MS = 250;
const FBQ_MAX_RETRIES = 40; // ~10 s

export const event = (name: string, options = {}, eventOptions?: { eventID: string }) => {
  if (typeof window === 'undefined') return;

  const send = (attempt: number) => {
    if (window.fbq) {
      if (eventOptions) {
        window.fbq('track', name, options, eventOptions);
      } else {
        window.fbq('track', name, options);
      }
    } else if (attempt < FBQ_MAX_RETRIES) {
      window.setTimeout(() => send(attempt + 1), FBQ_RETRY_MS);
    }
  };

  send(0);
};

// `id` debe coincidir con el `id` del feed de catálogo (el SKU) para que el
// remarketing dinámico matchee.
export interface PixelContent {
  id: string | number;
  quantity: number;
  item_price?: number;
}

interface PixelCartItem {
  producto: { id: number | string; sku?: string };
  quantity: number;
  price?: number | string;
}

export const contentsFromItems = (items: PixelCartItem[]): PixelContent[] =>
  items.map((item) => ({
    id: item.producto.sku || item.producto.id,
    quantity: item.quantity,
    item_price: typeof item.price === 'undefined' ? undefined : parseFloat(String(item.price)),
  }));

const normalizeContents = (contents: PixelContent[]) =>
  contents.map((content) => ({
    id: content.id.toString(),
    quantity: content.quantity,
    ...(Number.isFinite(content.item_price) ? { item_price: content.item_price } : {}),
  }));

export const viewContent = (productId: string | number, productName: string, value: number, currency = 'ARS') => {
  event('ViewContent', {
    content_ids: [productId.toString()],
    contents: normalizeContents([{ id: productId, quantity: 1, item_price: value }]),
    content_name: productName,
    content_type: 'product',
    value: value,
    currency: currency,
  });
};

export const addToCart = (
  productId: string | number,
  productName: string,
  value: number,
  currency = 'ARS',
  quantity = 1
) => {
  event('AddToCart', {
    content_ids: [productId.toString()],
    contents: normalizeContents([{ id: productId, quantity, item_price: value }]),
    content_name: productName,
    content_type: 'product',
    value: value * quantity,
    currency: currency,
  });
};

export const initiateCheckout = (contents: PixelContent[], value: number, currency = 'ARS') => {
  const normalized = normalizeContents(contents);
  event('InitiateCheckout', {
    content_ids: normalized.map((content) => content.id),
    contents: normalized,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: normalized.reduce((total, content) => total + content.quantity, 0),
  });
};

/**
 * `numeroPedido` es el mismo `order_id` que manda el servidor por la Conversions
 * API, y `eventID` (`order_<numero>`) el mismo `event_id`: Meta deduplica el
 * evento del navegador contra el del servidor.
 */
export const purchase = (
  numeroPedido: string,
  value: number,
  contents: PixelContent[] = [],
  currency = 'ARS'
) => {
  const normalized = normalizeContents(contents);
  event(
    'Purchase',
    {
      content_ids: normalized.map((content) => content.id),
      contents: normalized,
      content_type: 'product',
      value: value,
      currency: currency,
      num_items: normalized.reduce((total, content) => total + content.quantity, 0),
      order_id: numeroPedido,
      transaction_id: numeroPedido,
    },
    { eventID: `order_${numeroPedido}` }
  );
};

export const search = (searchString: string) => {
  event('Search', {
    search_string: searchString,
  });
};
