// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { acceptsSameDay, isOpenDay, nextDelivery } from '../utils/businessHours.ts';
import { getExpressAvailability } from '../utils/deliveryPromise.ts';

// Horas de Argentina (UTC-3). 2026-09-21 es lunes; 2026-09-26, sábado; 2026-09-27, domingo.
const ar = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);

test('lunes 10:00 entrega hoy', () => {
  assert.equal(acceptsSameDay(ar('2026-09-21', '10:00')), true);
  assert.deepEqual(nextDelivery(ar('2026-09-21', '10:00')), { date: '2026-09-21', day: 1, isToday: true });
});

test('lunes 18:00 entrega el martes', () => {
  assert.deepEqual(nextDelivery(ar('2026-09-21', '18:00')), { date: '2026-09-22', day: 2, isToday: false });
  assert.match(getExpressAvailability(ar('2026-09-21', '18:00')).message, /MAÑANA \(martes\)/);
});

test('sábado 16:00 entrega hoy', () => {
  assert.equal(nextDelivery(ar('2026-09-26', '16:00')).date, '2026-09-26');
});

test('sábado 18:00 pasa al lunes, nunca al domingo', () => {
  const next = nextDelivery(ar('2026-09-26', '18:00'));
  assert.deepEqual(next, { date: '2026-09-28', day: 1, isToday: false });
  assert.match(getExpressAvailability(ar('2026-09-26', '18:00')).message, /LUNES/);
});

test('domingo no acepta pedidos para hoy y entrega el lunes', () => {
  assert.equal(acceptsSameDay(ar('2026-09-27', '10:00')), false);
  assert.equal(nextDelivery(ar('2026-09-27', '10:00')).date, '2026-09-28');
  assert.match(getExpressAvailability(ar('2026-09-27', '10:00')).message, /MAÑANA \(lunes\)/);
});

test('la próxima entrega nunca cae en un día cerrado', () => {
  for (let dia = 21; dia <= 27; dia += 1) {
    for (let hora = 0; hora < 24; hora += 1) {
      const next = nextDelivery(ar(`2026-09-${dia}`, `${String(hora).padStart(2, '0')}:30`));
      assert.ok(isOpenDay(next.day), `${dia} ${hora}: ${next.date}`);
    }
  }
});

test('usa la hora de Argentina aunque el reloj esté en UTC', () => {
  // Sábado 21:30 UTC = sábado 18:30 en Argentina.
  assert.equal(nextDelivery(new Date('2026-09-26T21:30:00Z')).date, '2026-09-28');
});
