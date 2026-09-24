import {
  acceptsSameDay,
  CUTOFF,
  DAY_NAMES,
  localTime,
  nextDelivery,
  OPENING_HOUR,
  SAME_DAY_CUTOFF_HOUR,
} from '@/utils/businessHours';

export { SAME_DAY_CUTOFF_HOUR };

export interface ExpressAvailability {
  available: boolean;
  deliveryType: 'today' | 'tomorrow' | 'next-open-day';
  message: string;
  detail: string;
}

/**
 * Disponibilidad del envío Express según día y hora.
 * Es la fuente única de la promesa de entrega que se muestra en el checkout,
 * en la home y en la ficha de producto: pedidos de lunes a sábado hasta las
 * 17:00 se entregan el mismo día; los domingos no hay entregas.
 */
export function getExpressAvailability(now: Date = new Date()): ExpressAvailability {
  const { hour, day } = localTime(now);

  if (!acceptsSameDay(now)) {
    const next = nextDelivery(now);
    const isTomorrow = next.day === (day + 1) % 7;
    const when = isTomorrow ? `MAÑANA (${DAY_NAMES[next.day]})` : `el ${DAY_NAMES[next.day].toUpperCase()}`;
    return {
      available: true,
      deliveryType: isTomorrow ? 'tomorrow' : 'next-open-day',
      message: `✅ Entrega ${when} desde las 8:00 am`,
      detail: `Los pedidos entran de lunes a sábado hasta las ${CUTOFF} hs para entrega el mismo día`,
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
