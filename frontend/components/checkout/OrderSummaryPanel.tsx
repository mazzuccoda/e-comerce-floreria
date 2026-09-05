'use client';

import React, { useState } from 'react';
import { TIENDA, formatARS, whatsappLink } from '@/components/paymentInfo';

export interface OrderSummaryItem {
  producto: {
    nombre: string;
    imagen_principal?: string;
  };
  quantity: number;
  price: number | string;
}

interface OrderSummaryPanelProps {
  items: OrderSummaryItem[];
  totalItems: number;
  subtotal: number;
  shippingLabel: string;
  shippingCost: number | null;
  isPickup: boolean;
  isCalculating: boolean;
  total: number;
  deliveryPromise?: string | null;
}

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-0.5 flex-shrink-0 text-emerald-600"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function OrderSummaryPanel({
  items,
  totalItems,
  subtotal,
  shippingLabel,
  shippingCost,
  isPickup,
  isCalculating,
  total,
  deliveryPromise,
}: OrderSummaryPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const shippingValue = isPickup ? (
    <span className="text-emerald-700">Sin cargo</span>
  ) : isCalculating ? (
    <span className="text-gray-500">Calculando…</span>
  ) : shippingCost === null ? (
    <span className="text-gray-400">A calcular</span>
  ) : shippingCost === 0 ? (
    <span className="text-emerald-700">Sin cargo</span>
  ) : (
    <span>{formatARS(shippingCost)}</span>
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Resumen del pedido
          </p>
          <p className="text-sm text-gray-500">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="lg:hidden text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4"
        >
          {expanded ? 'Ocultar' : 'Ver detalle'}
        </button>
      </header>

      <div className={`${expanded ? 'block' : 'hidden'} lg:block`}>
        {items.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-3 px-5 py-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  {item.producto.imagen_principal ? (
                    <img
                      src={item.producto.imagen_principal}
                      alt={item.producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.producto.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × {formatARS(Number(item.price))}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatARS(Number(item.price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-gray-500">Todavía no hay productos en el carrito.</p>
        )}
      </div>

      <div className="space-y-2 border-t border-gray-100 px-5 py-4 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">{formatARS(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <span>{shippingLabel}</span>
          <span className="font-medium">{shippingValue}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">Total</span>
          <span className="text-2xl font-semibold text-gray-900">{formatARS(total)}</span>
        </div>
        {deliveryPromise ? (
          <p className="mt-2 text-sm text-emerald-700">{deliveryPromise}</p>
        ) : null}
      </div>

      <div className="border-t border-gray-100 px-5 py-4">
        <ul className="space-y-2 text-[13px] leading-snug text-gray-600">
          <li className="flex gap-2">
            <CheckIcon />
            <span>Flores frescas seleccionadas para cada arreglo.</span>
          </li>
          <li className="flex gap-2">
            <CheckIcon />
            <span>
              Cancelás o modificás hasta 24 horas antes de la entrega (
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
              >
                condiciones
              </a>
              ).
            </span>
          </li>
          <li className="flex gap-2">
            <CheckIcon />
            <span>Si algo llega mal, avisanos dentro de 24 horas y lo resolvemos.</span>
          </li>
          <li className="flex gap-2">
            <CheckIcon />
            <span>Pagos procesados por Mercado Pago y PayPal.</span>
          </li>
        </ul>
        <a
          href={whatsappLink('Hola, estoy haciendo un pedido en la web y tengo una consulta')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          ¿Dudas? Escribinos por WhatsApp
        </a>
        <p className="mt-3 text-xs text-gray-500">
          {TIENDA.direccion} · {TIENDA.horario}
        </p>
      </div>
    </section>
  );
}
