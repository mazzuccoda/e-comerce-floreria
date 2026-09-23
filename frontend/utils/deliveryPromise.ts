export interface ExpressAvailability {
  available: boolean;
  deliveryType: 'today' | 'tomorrow';
  message: string;
  detail: string;
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Hora de corte para entrega el mismo día (hora de Argentina). */
export const SAME_DAY_CUTOFF_HOUR = 17;
/** Los domingos se entrega sólo por la mañana. */
const SUNDAY_CUTOFF_HOUR = 13;
const OPENING_HOUR = 9;

/** Hora y día de la semana en Tucumán, sin importar el reloj del visitante. */
function localNow(now: Date): { hour: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? now.getHours());
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days.indexOf(weekday);

  return { hour: hour === 24 ? 0 : hour, day: day === -1 ? now.getDay() : day };
}

/**
 * Disponibilidad del envío Express según día y hora.
 * Es la fuente única de la promesa de entrega que se muestra en el checkout,
 * en la home y en la ficha de producto: pedidos hasta las 17:00 se entregan
 * el mismo día (domingos, hasta las 13:00).
 */
export function getExpressAvailability(now: Date = new Date()): ExpressAvailability {
  const { hour, day } = localNow(now);
  const cutoff = day === 0 ? SUNDAY_CUTOFF_HOUR : SAME_DAY_CUTOFF_HOUR;

  const tomorrowName = DAY_NAMES[(day + 1) % 7];

  if (hour >= cutoff) {
    return {
      available: true,
      deliveryType: 'tomorrow',
      message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
      detail: `Los pedidos entran hasta las ${cutoff}:00 hs para entrega el mismo día`,
    };
  }

  if (hour < OPENING_HOUR) {
    return {
      available: true,
      deliveryType: 'today',
      message: '✅ Entrega HOY desde las 8:00 am',
      detail: 'Tu pedido llegará hoy por la mañana',
    };
  }

  const endHour = Math.min(hour + 4, 22);
  return {
    available: true,
    deliveryType: 'today',
    message: '✅ Entrega HOY en 2-4 horas',
    detail: `Recibirás tu pedido hoy entre ${hour + 2}:00 y ${endHour}:00 hs`,
  };
}
