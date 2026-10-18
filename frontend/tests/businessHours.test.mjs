// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  acceptsSameDay,
  applySchedule,
  isOpenDate,
  isOpenDay,
  nextDelivery,
  resetSchedule,
  scheduleFor,
} from '../utils/businessHours.ts';
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

// Lo que devolvería `GET /api/publico/entrega/horario` con un domingo habilitado.
const semanaHabitual = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
  dia,
  abierto: dia !== 6,
  apertura: '09:00',
  cierre: '21:00',
  hora_corte: '17:00',
  acepta_retiro: dia !== 6,
  acepta_envio: dia !== 6,
}));

test('un domingo cargado como día especial abre medio día', (t) => {
  t.after(resetSchedule);
  applySchedule({
    semana: semanaHabitual,
    dias_especiales: [{
      fecha: '2026-10-18',
      abierto: true,
      apertura: '09:00',
      cierre: '13:00',
      hora_corte: '12:00',
      acepta_retiro: true,
      acepta_envio: true,
      mensaje: 'Día de la Madre: abrimos de 9 a 13',
    }],
  });

  assert.equal(isOpenDate('2026-10-18'), true);
  assert.equal(scheduleFor('2026-10-18').closingHour, 13);
  assert.equal(scheduleFor('2026-10-18').message, 'Día de la Madre: abrimos de 9 a 13');
  assert.equal(acceptsSameDay(ar('2026-10-18', '11:00')), true);
  assert.equal(acceptsSameDay(ar('2026-10-18', '12:00')), false);
  assert.equal(nextDelivery(ar('2026-10-17', '18:00')).date, '2026-10-18');
  // el domingo siguiente, sin excepción, sigue cerrado
  assert.equal(isOpenDate('2026-10-25'), false);
});

test('el horario del servidor pisa al corte de las constantes', (t) => {
  t.after(resetSchedule);
  applySchedule({
    semana: semanaHabitual.map((dia) => ({ ...dia, hora_corte: '15:00' })),
    dias_especiales: [],
  });

  // lunes 16:00: con corte a las 15 ya no entra para hoy
  assert.equal(acceptsSameDay(ar('2026-09-21', '16:00')), false);
  assert.equal(scheduleFor('2026-09-21').cutoffHour, 15);
});

test('sin respuesta del servidor rige el horario habitual', () => {
  assert.equal(scheduleFor('2026-09-21').cutoffHour, 17);
  assert.equal(isOpenDate('2026-10-18'), false);
});

test('usa la hora de Argentina aunque el reloj esté en UTC', () => {
  // Sábado 21:30 UTC = sábado 18:30 en Argentina.
  assert.equal(nextDelivery(new Date('2026-09-26T21:30:00Z')).date, '2026-09-28');
});
