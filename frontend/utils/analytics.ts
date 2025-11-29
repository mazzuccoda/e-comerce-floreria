// Google Analytics 4 - Utilidades de tracking
// Documentación: https://developers.google.com/analytics/devguides/collection/ga4

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || '';

// Verificar si GA está disponible
export const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined' && !!GA_TRACKING_ID;
};

// Inicializar Google Analytics
export const initGA = () => {
  if (!isGAAvailable()) {
    console.warn('⚠️ Google Analytics no está configurado');
    return;
  }
  console.log('✅ Google Analytics inicializado:', GA_TRACKING_ID);
};

// Trackear vista de página
export const pageview = (url: string) => {
  if (!isGAAvailable()) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
  
  console.log('📊 GA4 - Pageview:', url);
};

// Evento genérico
export const event = (action: string, params?: Record<string, any>) => {
  if (!isGAAvailable()) return;
  
  window.gtag('event', action, params);
  console.log('📊 GA4 - Event:', action, params);
};

// ==========================================
// EVENTOS DE ECOMMERCE
// ==========================================

// Ver producto
export const trackProductView = (producto: {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
}) => {
  event('view_item', {
    currency: 'ARS',
    value: producto.precio,
    items: [
      {
        item_id: producto.id.toString(),
        item_name: producto.nombre,
        item_category: producto.categoria || 'Productos',
        price: producto.precio,
        quantity: 1,
      },
    ],
  });
};

// Agregar al carrito
export const trackAddToCart = (producto: {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
}) => {
  event('add_to_cart', {
    currency: 'ARS',
    value: producto.precio * producto.cantidad,
    items: [
      {
        item_id: producto.id.toString(),
        item_name: producto.nombre,
        item_category: producto.categoria || 'Productos',
        price: producto.precio,
        quantity: producto.cantidad,
      },
    ],
  });
};

// Remover del carrito
export const trackRemoveFromCart = (producto: {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}) => {
  event('remove_from_cart', {
    currency: 'ARS',
    value: producto.precio * producto.cantidad,
    items: [
      {
        item_id: producto.id.toString(),
        item_name: producto.nombre,
        price: producto.precio,
        quantity: producto.cantidad,
      },
    ],
  });
};

// Ver carrito
export const trackViewCart = (items: any[], total: number) => {
  event('view_cart', {
    currency: 'ARS',
    value: total,
    items: items.map((item) => ({
      item_id: item.producto.id.toString(),
      item_name: item.producto.nombre,
      price: parseFloat(item.price),
      quantity: item.quantity,
    })),
  });
};

// Iniciar checkout
export const trackBeginCheckout = (items: any[], total: number) => {
  event('begin_checkout', {
    currency: 'ARS',
    value: total,
    items: items.map((item) => ({
      item_id: item.producto.id.toString(),
      item_name: item.producto.nombre,
      price: parseFloat(item.price),
      quantity: item.quantity,
    })),
  });
};

// Paso del checkout
export const trackCheckoutProgress = (step: number, stepName: string, total: number) => {
  event('checkout_progress', {
    checkout_step: step,
    checkout_option: stepName,
    currency: 'ARS',
    value: total,
  });
};

// Agregar información de pago
export const trackAddPaymentInfo = (paymentMethod: string, total: number) => {
  event('add_payment_info', {
    currency: 'ARS',
    value: total,
    payment_type: paymentMethod,
  });
};

// Compra completada
export const trackPurchase = (pedido: {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  items: any[];
  medio_pago?: string;
  costo_envio?: number;
}) => {
  event('purchase', {
    transaction_id: pedido.numero_pedido,
    value: pedido.total,
    currency: 'ARS',
    shipping: pedido.costo_envio || 0,
    payment_type: pedido.medio_pago || 'mercadopago',
    items: pedido.items.map((item: any) => ({
      item_id: item.producto.id.toString(),
      item_name: item.producto.nombre,
      price: parseFloat(item.price),
      quantity: item.quantity,
    })),
  });
};

// ==========================================
// EVENTOS PERSONALIZADOS
// ==========================================

// Búsqueda
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  event('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

// Compartir
export const trackShare = (method: string, contentType: string, itemId: string) => {
  event('share', {
    method: method,
    content_type: contentType,
    item_id: itemId,
  });
};

// Login
export const trackLogin = (method: string) => {
  event('login', {
    method: method,
  });
};

// Registro
export const trackSignUp = (method: string) => {
  event('sign_up', {
    method: method,
  });
};

// Tiempo en página (llamar cuando el usuario sale)
export const trackTimeOnPage = (pagePath: string, timeInSeconds: number) => {
  event('page_time', {
    page_path: pagePath,
    time_seconds: timeInSeconds,
  });
};

// Error
export const trackError = (errorMessage: string, errorLocation: string) => {
  event('error', {
    error_message: errorMessage,
    error_location: errorLocation,
  });
};

// Contacto
export const trackContact = (method: string) => {
  event('contact', {
    method: method, // 'whatsapp', 'email', 'phone'
  });
};
