'use client';

import { Store, Truck, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { TIENDA } from '@/components/paymentInfo';
import { API_URL } from '@/utils/apiBase';

import { useShippingConfig, type ShippingZone } from '../hooks/useShippingConfig';

const formatPrice = (value: number) =>
  value === 0 ? 'Sin cargo' : `$ ${value.toLocaleString('es-AR')}`;

function ZoneRow({ zone, maxCoverageKm }: { zone: ShippingZone; maxCoverageKm: number }) {
  const from = zone.min_distance_km;
  const to = Math.min(zone.max_distance_km, maxCoverageKm);

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 py-3">
      <div>
        <p className="font-medium text-gray-900">{zone.zone_name}</p>
        <p className="text-sm text-gray-600">
          Hasta {to} km de la tienda
          {from > 0 ? ` (desde ${from} km)` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatPrice(zone.base_price)}</p>
        {zone.price_per_km > 0 && (
          <p className="text-sm text-gray-600">
            + $ {zone.price_per_km.toLocaleString('es-AR')} por km
          </p>
        )}
      </div>
    </li>
  );
}

export default function ZonasPage() {
  const { config, zones, loading } = useShippingConfig();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null);

  // El umbral de envío gratis por monto sólo lo devuelve el cálculo de costo: lo consultamos
  // con una distancia de referencia para no publicar un valor fijo que quede desactualizado.
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const response = await fetch(`${API_URL}/pedidos/shipping/calculate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distance_km: 1,
            shipping_method: 'programado',
            order_amount: 0,
          }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.free_shipping_threshold === 'number') {
          setFreeShippingThreshold(data.free_shipping_threshold);
        }
      } catch {
        // Sin umbral disponible no mostramos la promesa de envío gratis por monto
      }
    };

    fetchThreshold();
  }, []);

  const maxExpress = config?.max_distance_express_km ?? 0;
  const maxProgramado = config?.max_distance_programado_km ?? 0;

  const expressZones = zones.express.filter((z) => z.min_distance_km < maxExpress);
  const programadoZones = zones.programado.filter((z) => z.min_distance_km < maxProgramado);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Zonas de entrega y costos de envío</h1>
      <p className="mb-8 max-w-2xl text-gray-600">
        Entregamos en Yerba Buena y San Miguel de Tucumán. El costo se calcula por la distancia
        entre la tienda ({TIENDA.direccion}) y la dirección de entrega, y lo ves en el checkout
        antes de pagar.
      </p>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-lg bg-gray-200" />
          <div className="h-40 rounded-lg bg-gray-200" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Envío Express</h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Entrega en el día, dentro de {maxExpress} km de la tienda.
            </p>
            {expressZones.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {expressZones.map((zone) => (
                  <ZoneRow key={zone.id} zone={zone} maxCoverageKm={maxExpress} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                Consultanos por WhatsApp la disponibilidad para tu dirección.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Envío programado</h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Elegís día y franja horaria, dentro de {maxProgramado} km de la tienda.
            </p>
            {programadoZones.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {programadoZones.map((zone) => (
                  <ZoneRow key={zone.id} zone={zone} maxCoverageKm={maxProgramado} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                Consultanos por WhatsApp la disponibilidad para tu dirección.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Retiro en tienda</h2>
            </div>
            <p className="text-sm text-gray-600">Sin cargo, coordinando día y horario.</p>
            <p className="mt-3 text-sm text-gray-900">{TIENDA.direccion}</p>
            <p className="text-sm text-gray-600">{TIENDA.horario}</p>
          </section>
        </div>
      )}

      <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Información importante</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            El envío es sin cargo en los productos marcados con “Envío gratis”
            {freeShippingThreshold !== null
              ? ` y en pedidos de $ ${freeShippingThreshold.toLocaleString('es-AR')} o más.`
              : '.'}
          </li>
          <li>El costo exacto se calcula con la dirección de entrega en el checkout.</li>
          <li>Flores frescas seleccionadas para cada arreglo.</li>
          <li>
            Podés cancelar o modificar tu pedido hasta 24 horas antes de la entrega (
            <Link href="/terminos" className="text-emerald-700 hover:underline">
              ver términos
            </Link>
            ).
          </li>
          <li>
            Si tu dirección queda fuera de la cobertura, escribinos por{' '}
            <a
              href={`https://wa.me/${TIENDA.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              WhatsApp
            </a>{' '}
            y lo vemos.
          </li>
        </ul>
      </div>
    </div>
  );
}
