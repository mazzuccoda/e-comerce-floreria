// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isPurchase } from '../utils/purchaseRule.ts';

test('transferencia y efectivo cuentan como compra con el pago pendiente', () => {
  assert.equal(isPurchase('pendiente', 'transferencia'), true);
  assert.equal(isPurchase('pendiente', 'efectivo'), true);
  assert.equal(isPurchase(null, 'transferencia'), true);
});

test('Mercado Pago y PayPal sólo con el pago aprobado', () => {
  assert.equal(isPurchase('pending', 'mercadopago'), false);
  assert.equal(isPurchase('pendiente', 'paypal'), false);
  assert.equal(isPurchase('success', 'mercadopago'), true);
  assert.equal(isPurchase('success', 'paypal'), true);
});

test('un pago fallido nunca es compra', () => {
  for (const estado of ['failure', 'rejected', 'cancelled', 'error']) {
    assert.equal(isPurchase(estado, 'transferencia'), false, estado);
    assert.equal(isPurchase(estado, 'mercadopago'), false, estado);
  }
});
