/**
 * Cuándo la página de éxito registra la compra en el navegador. Es la misma
 * regla que aplica el servidor (pedidos/services/conversion_tracking.py):
 *
 * - Transferencia y efectivo: la compra cuenta al registrar el pedido, aunque
 *   el pago esté pendiente.
 * - Mercado Pago y PayPal: sólo con el pago aprobado (`payment=success`).
 *
 * El Pixel y la Conversions API mandan el mismo eventID, así Meta cuenta una sola compra.
 */
const MEDIOS_OFFLINE = ['transferencia', 'efectivo'];
const PAGO_APROBADO = ['success', 'approved'];
const PAGO_FALLIDO = ['failure', 'rejected', 'cancelled', 'error'];

export function isPurchase(paymentStatus: string | null, medioPago?: string | null): boolean {
  if (paymentStatus && PAGO_APROBADO.includes(paymentStatus)) return true;
  if (paymentStatus && PAGO_FALLIDO.includes(paymentStatus)) return false;
  return MEDIOS_OFFLINE.includes(medioPago ?? '');
}
