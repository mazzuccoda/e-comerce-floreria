'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Store, CreditCard, ShieldCheck } from 'lucide-react';
import { TIENDA } from '@/components/paymentInfo';
import { getExpressAvailability } from '@/utils/deliveryPromise';

export default function HomePromiseBar() {
  const [promise, setPromise] = useState<string | null>(null);

  useEffect(() => {
    const { message } = getExpressAvailability();
    setPromise(message.replace('✅ ', ''));
  }, []);

  return (
    <section className="border-y border-gray-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:gap-6 lg:px-8">
        <div className="flex gap-3">
          <Truck className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{promise ?? 'Envío Express'}</p>
            <Link href="/zonas" className="text-gray-600 hover:text-emerald-700 hover:underline">
              Ver zonas y costo de envío
            </Link>
          </div>
        </div>

        <div className="flex gap-3">
          <Store className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Retiro en tienda sin cargo</p>
            <p className="text-gray-600">{TIENDA.direccion} · {TIENDA.horario}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <CreditCard className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Mercado Pago, PayPal o transferencia</p>
            <p className="text-gray-600">Efectivo al retirar en tienda</p>
          </div>
        </div>

        <div className="flex gap-3">
          <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Flores frescas para cada arreglo</p>
            <Link href="/terminos" className="text-gray-600 hover:text-emerald-700 hover:underline">
              Cancelás hasta 24 hs antes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
