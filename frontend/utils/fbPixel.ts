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

export const viewContent = (productId: string | number, productName: string, value: number, currency = 'ARS') => {
  event('ViewContent', {
    content_ids: [productId.toString()],
    content_name: productName,
    content_type: 'product',
    value: value,
    currency: currency,
  });
};

export const addToCart = (productId: string | number, productName: string, value: number, currency = 'ARS') => {
  event('AddToCart', {
    content_ids: [productId.toString()],
    content_name: productName,
    content_type: 'product',
    value: value,
    currency: currency,
  });
};

export const initiateCheckout = (value: number, numItems: number, currency = 'ARS') => {
  event('InitiateCheckout', {
    value: value,
    currency: currency,
    num_items: numItems,
  });
};

export const purchase = (orderId: string | number, value: number, currency = 'ARS') => {
  event('Purchase', {
    value: value,
    currency: currency,
    transaction_id: orderId.toString(),
  });
};

export const search = (searchString: string) => {
  event('Search', {
    search_string: searchString,
  });
};
