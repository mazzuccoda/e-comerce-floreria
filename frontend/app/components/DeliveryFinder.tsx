'use client';

import { CalendarClock, MapPin, Store, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { TIENDA } from '@/components/paymentInfo';
import { useI18n } from '@/context/I18nContext';
import { getExpressAvailability } from '@/utils/deliveryPromise';
import { localeHref } from '@/utils/localeHref';

import { useShippingConfig, type ShippingZone } from '../hooks/useShippingConfig';

type Area = 'yerba-buena' | 'san-miguel' | 'retiro';
type When = 'hoy' | 'fecha';

const AREAS: { value: Area; label: string; match?: string }[] = [
  { value: 'yerba-buena', label: 'Yerba Buena', match: 'yerba buena' },
  { value: 'san-miguel', label: 'San Miguel de Tucumán', match: 'san miguel' },
  { value: 'retiro', label: 'Retiro en tienda' },
];

const WHEN_OPTIONS: { value: When; label: string }[] = [
  { value: 'hoy', label: 'Lo antes posible' },
  { value: 'fecha', label: 'Elegir día y horario' },
];

function cheapestZonePrice(zones: ShippingZone[], match: string): number | null {
  const prices = zones
    .filter((zone) => zone.zone_name.toLowerCase().includes(match))
    .map((zone) => zone.base_price);

  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Selector de zona y momento de entrega: responde la primera duda del cliente
 * (¿llega a mi zona y cuándo?) antes de que elija un ramo.
 */
export default function DeliveryFinder() {
  const { locale } = useI18n();
  const { zones } = useShippingConfig();
  const [area, setArea] = useState<Area>('yerba-buena');
  const [when, setWhen] = useState<When>('hoy');
  const [expressMessage, setExpressMessage] = useState<string | null>(null);

  useEffect(() => {
    setExpressMessage(getExpressAvailability().message.replace('✅ ', ''));
  }, []);

  const isPickup = area === 'retiro';
  const method = when === 'hoy' ? 'express' : 'programado';

  const priceFrom = useMemo(() => {
    if (isPickup) return null;
    const match = AREAS.find((item) => item.value === area)?.match;
    if (!match) return null;
    return cheapestZonePrice(method === 'express' ? zones.express : zones.programado, match);
  }, [area, isPickup, method, zones]);

  const answer = useMemo(() => {
    if (isPickup) {
      return {
        title: 'Retirás en la tienda, sin cargo',
        detail: `${TIENDA.direccion} · ${TIENDA.horario}. Coordinás día y horario en el checkout.`,
      };
    }

    if (when === 'hoy') {
      return {
        title: expressMessage ?? 'Envío Express',
        detail: 'Sujeto a la distancia de tu dirección; el costo exacto se calcula en el checkout.',
      };
    }

    return {
      title: 'Elegís el día y la franja horaria',
      detail: 'Envío programado a la dirección del destinatario, con costo según la distancia.',
    };
  }, [expressMessage, isPickup, when]);

  const catalogHref = localeHref('/ramos-de-flores', locale);

  return (
    <section className="relative z-20 bg-white py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            ¿A dónde y cuándo lo enviamos?
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-1.5 font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Zona
              </span>
              <select
                value={area}
                onChange={(event) => setArea(event.target.value as Area)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {AREAS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-1.5 font-medium text-gray-700">
                {isPickup ? (
                  <Store className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                ) : (
                  <CalendarClock className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                )}
                ¿Cuándo?
              </span>
              <select
                value={when}
                onChange={(event) => setWhen(event.target.value as When)}
                disabled={isPickup}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {WHEN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Link
              href={catalogHref}
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:text-base"
            >
              Ver ramos disponibles
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-gray-100 pt-4 text-sm">
            <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{answer.title}</p>
              <p className="text-gray-600">
                {priceFrom !== null && (
                  <>
                    Envío desde $ {priceFrom.toLocaleString('es-AR')}.{' '}
                  </>
                )}
                {answer.detail}{' '}
                <Link href={localeHref('/zonas', locale)} className="text-emerald-700 hover:underline">
                  Ver zonas y costos
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
