// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isPurchase } from '../utils/purchaseRule.ts';

test('el pedido generado cuenta como compra con cualquier medio de pago', () => {
  assert.equal(isPurchase(null), true);
  assert.equal(isPurchase('pendiente'), true);
  assert.equal(isPurchase('pending'), true);
  assert.equal(isPurchase('success'), true);
  assert.equal(isPurchase('approved'), true);
});

test('un pago rechazado o cancelado nunca es compra', () => {
  for (const estado of ['failure', 'rejected', 'cancelled', 'error']) {
    assert.equal(isPurchase(estado), false, estado);
  }
});
