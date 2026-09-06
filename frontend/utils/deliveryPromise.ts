export interface ExpressAvailability {
  available: boolean;
  deliveryType: 'today' | 'tomorrow';
  message: string;
  detail: string;
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Disponibilidad del envío Express según día y hora.
 * Es la fuente única de la promesa de entrega que se muestra en el checkout
 * y en la ficha de producto.
 */
export function getExpressAvailability(now: Date = new Date()): ExpressAvailability {
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowName = DAY_NAMES[tomorrow.getDay()];

  if (currentDay === 0) {
    if (currentHour >= 9 && currentHour < 13) {
      return {
        available: true,
        deliveryType: 'today',
        message: '✅ Entrega HOY en 2-4 horas',
        detail: `Recibirás tu pedido hoy entre ${currentHour + 2}:00 y ${currentHour + 4}:00 hs`,
      };
    }
    if (currentHour >= 13) {
      return {
        available: true,
        deliveryType: 'tomorrow',
        message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
        detail: 'Tu pedido llegará mañana por la mañana',
      };
    }
    return {
      available: true,
      deliveryType: 'today',
      message: '✅ Entrega HOY desde las 8:00 am',
      detail: 'Tu pedido llegará hoy por la mañana',
    };
  }

  if (currentHour >= 9 && currentHour < 18) {
    const endHour = Math.min(currentHour + 4, 22);
    return {
      available: true,
      deliveryType: 'today',
      message: '✅ Entrega HOY en 2-4 horas',
      detail: `Recibirás tu pedido hoy entre ${currentHour + 2}:00 y ${endHour}:00 hs`,
    };
  }

  if (currentHour >= 19) {
    return {
      available: true,
      deliveryType: 'tomorrow',
      message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
      detail: 'Tu pedido llegará mañana por la mañana',
    };
  }

  if (currentHour < 9) {
    return {
      available: true,
      deliveryType: 'today',
      message: '✅ Entrega HOY desde las 8:00 am',
      detail: 'Tu pedido llegará hoy por la mañana',
    };
  }

  return {
    available: true,
    deliveryType: 'tomorrow',
    message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
    detail: 'Disponible desde las 19:00 hs para entrega mañana',
  };
}
