/**
 * Facebook Pixel tracking utilities
 */

declare global {
  interface Window {
    fbq: any;
  }
}

export const FB_PIXEL_ID = '2362234944085088';

export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

export const event = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, options);
  }
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

export const purchase = (
  orderId: string | number,
  value: number,
  contents: PixelContent[] = [],
  currency = 'ARS'
) => {
  const normalized = normalizeContents(contents);
  event('Purchase', {
    content_ids: normalized.map((content) => content.id),
    contents: normalized,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: normalized.reduce((total, content) => total + content.quantity, 0),
    transaction_id: orderId.toString(),
  });
};

export const search = (searchString: string) => {
  event('Search', {
    search_string: searchString,
  });
};
