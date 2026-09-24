/**
 * Datos del negocio que se publican a buscadores y agentes (JSON-LD, llms.txt).
 * Replican los de `catalogo/public_api.py` (`/api/publico/tienda`); si cambia
 * algo, cambiarlo en los dos lados.
 */
export const BUSINESS = {
  name: 'Florería Cristina',
  alternateName: 'Florería y Vivero Cristina',
  telephone: '+543814778577',
  telephoneDisplay: '+54 381 477-8577',
  whatsapp: '+5493813671352',
  whatsappDisplay: '+54 9 381 367-1352',
  email: 'eleososatuc@gmail.com',
  streetAddress: 'Solano Vera 480',
  locality: 'Yerba Buena',
  region: 'Tucumán',
  country: 'AR',
  geo: { latitude: -26.8192895, longitude: -65.3062371 },
  areaServed: ['Yerba Buena', 'San Miguel de Tucumán'],
  paymentMethods: ['Mercado Pago', 'PayPal', 'Transferencia bancaria', 'Efectivo (sólo al retirar en tienda)'],
  deliveryMethods: ['express', 'programado', 'retiro en tienda'],
  cancellationPolicy: 'hasta 24 horas antes de la entrega',
} as const;
