'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Store, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react';
import { TIENDA } from '@/components/paymentInfo';
import { getExpressAvailability } from '@/utils/deliveryPromise';

/**
 * Entrega, retiro, medios de pago y garantía para la ficha de producto.
 * La promesa de entrega sale de la misma lógica de Express que usa el checkout.
 */
export default function ProductDeliveryInfo() {
  const [deliveryPromise, setDeliveryPromise] = useState<string | null>(null);

  // Se calcula en el cliente: depende de la hora del visitante
  useEffect(() => {
    const { message, detail } = getExpressAvailability();
    setDeliveryPromise(`${message.replace('✅ ', '')}. ${detail}.`);
  }, []);

  return (
    <div className="mt-8 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      <div className="flex gap-3 p-4">
        <Truck className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Envío a domicilio</p>
          <p className="mt-0.5 text-gray-600">
            {deliveryPromise ?? 'Envío Express el mismo día o al día siguiente según la hora del pedido.'}
          </p>
          <Link href="/zonas" className="mt-1 inline-block font-medium text-emerald-700 hover:underline">
            Ver zonas y costo de envío
          </Link>
        </div>
      </div>

      <div className="flex gap-3 p-4">
        <Store className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Retiro en tienda sin cargo</p>
          <p className="mt-0.5 text-gray-600">
            {TIENDA.direccion} · {TIENDA.horario}
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-4">
        <CreditCard className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Formas de pago</p>
          <p className="mt-0.5 text-gray-600">
            Mercado Pago (tarjetas y cuotas), PayPal, transferencia bancaria y efectivo al retirar en tienda.
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-4">
        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Compra protegida</p>
          <p className="mt-0.5 text-gray-600">
            Flores frescas seleccionadas para cada arreglo. Cancelás o modificás hasta 24 horas antes de la entrega.
          </p>
          <Link href="/terminos" className="mt-1 inline-block font-medium text-emerald-700 hover:underline">
            Ver términos y condiciones
          </Link>
        </div>
      </div>

      <div className="flex gap-3 p-4">
        <MessageCircle className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-gray-900">¿Dudas antes de comprar?</p>
          <a
            href={`https://wa.me/${TIENDA.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block font-medium text-emerald-700 hover:underline"
          >
            Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
