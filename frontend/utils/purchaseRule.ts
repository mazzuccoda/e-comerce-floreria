/**
 * Cuándo la página de éxito registra la compra en el navegador. Es la misma
 * regla que aplica el servidor (pedidos/services/conversion_tracking.py): la
 * compra cuenta al generar el pedido, cualquiera sea el medio de pago y sin
 * esperar la acreditación. Sólo un pago rechazado o cancelado queda afuera,
 * porque ahí el pedido vuelve atrás y el stock se restaura.
 *
 * El Pixel y la Conversions API mandan el mismo eventID, así Meta cuenta una sola compra.
 */
const PAGO_FALLIDO = ['failure', 'rejected', 'cancelled', 'error'];

export function isPurchase(paymentStatus: string | null): boolean {
  return !(paymentStatus && PAGO_FALLIDO.includes(paymentStatus));
}
