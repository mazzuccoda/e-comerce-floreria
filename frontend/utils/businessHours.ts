/**
 * Horario comercial y promesa de entrega: única fuente de verdad del frontend.
 *
 * La usan el checkout, la home, la ficha de producto, el JSON-LD y `llms.txt`.
 * Replica las constantes de `core/horario.py` (backend / API pública); si cambia
 * algo, cambiarlo en los dos lados.
 */

export const TIMEZONE = 'America/Argentina/Buenos_Aires';
/** Offset de Argentina (sin horario de verano). */
export const UTC_OFFSET = '-03:00';

export const OPENING_HOUR = 9;
export const CLOSING_HOUR = 21;
/** Los pedidos express confirmados antes de esta hora local se entregan el mismo día. */
export const SAME_DAY_CUTOFF_HOUR = 17;

/** 0 = domingo ... 6 = sábado (convención de `Date.getDay()`). Domingos cerrado. */
export const OPEN_DAYS = [1, 2, 3, 4, 5, 6] as const;

export const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const SCHEMA_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (value: number) => String(value).padStart(2, '0');

export const OPENS = `${pad(OPENING_HOUR)}:00`;
export const CLOSES = `${pad(CLOSING_HOUR)}:00`;
export const CUTOFF = `${pad(SAME_DAY_CUTOFF_HOUR)}:00`;

export const OPENING_HOURS_TEXT = `lunes a sábado de ${OPENING_HOUR}:00 a ${CLOSING_HOUR}:00 hs (domingos cerrado)`;
export const SAME_DAY_TEXT =
  `los pedidos express confirmados hasta las ${CUTOFF} (hora de Argentina) de lunes a sábado se entregan el mismo día; ` +
  'después de esa hora, o si el pedido se hace un domingo, la entrega pasa al próximo día hábil (los domingos no hay entregas)';

export function isOpenDay(day: number): boolean {
  return (OPEN_DAYS as readonly number[]).includes(day);
}

export interface LocalTime {
  /** Fecha local en formato YYYY-MM-DD. */
  date: string;
  /** Día de la semana, 0 = domingo. */
  day: number;
  hour: number;
  minute: number;
}

/** Fecha, día y hora en Tucumán, sin importar el reloj del visitante o del servidor. */
export function localTime(now: Date = new Date()): LocalTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = Number(get('hour'));
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    hour: hour === 24 ? 0 : hour,
    minute: Number(get('minute')),
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function acceptsSameDay(now: Date = new Date()): boolean {
  const { day, hour } = localTime(now);
  return isOpenDay(day) && hour < SAME_DAY_CUTOFF_HOUR;
}

export interface NextDelivery {
  /** YYYY-MM-DD */
  date: string;
  /** Día de la semana, 0 = domingo. */
  day: number;
  isToday: boolean;
}

/** Fecha más próxima en la que un pedido express hecho `now` puede entregarse. Nunca un domingo. */
export function nextDelivery(now: Date = new Date()): NextDelivery {
  const local = localTime(now);
  if (acceptsSameDay(now)) {
    return { date: local.date, day: local.day, isToday: true };
  }
  let offset = 1;
  while (!isOpenDay((local.day + offset) % 7)) offset += 1;
  return { date: addDays(local.date, offset), day: (local.day + offset) % 7, isToday: false };
}

/** `OpeningHoursSpecification` de schema.org a partir del horario. */
export const OPENING_HOURS_SPECIFICATION = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: OPEN_DAYS.map((day) => SCHEMA_DAY_NAMES[day]),
    opens: OPENS,
    closes: CLOSES,
  },
];
