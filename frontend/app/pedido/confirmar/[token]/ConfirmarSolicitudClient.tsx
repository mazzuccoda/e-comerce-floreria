'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface ResumenItem {
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Resumen {
  items: ResumenItem[];
  subtotal_productos: number;
  envio: { metodo: string; costo: number; zona: string | null; gratis: boolean };
  entrega: {
    metodo: string;
    fecha: string;
    franja: string;
    direccion: string;
    ciudad: string;
    instrucciones: string;
    hora_retiro: string | null;
  };
  destinatario: { nombre: string; telefono: string };
  comprador: { nombre: string; email: string; telefono: string };
  tarjeta: { dedicatoria: string; firma: string; anonimo: boolean };
  medio_pago: string;
  total: number;
}

interface Estado {
  estado: string;
  expira_en: string;
  resumen: Resumen;
  token_acceso?: string;
}

const METODOS: Record<string, string> = {
  express: 'Envío express (2 a 4 horas)',
  programado: 'Envío programado',
  retiro: 'Retiro en el local',
};

const FRANJAS: Record<string, string> = {
  'mañana': 'Mañana (9 a 12 hs)',
  tarde: 'Tarde (16 a 20 hs)',
  durante_el_dia: 'Durante el día',
};

const MEDIOS: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  paypal: 'PayPal',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo al retirar',
};

const precio = (valor: number) =>
  valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const fechaLarga = (iso: string) => {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

declare global {
  interface Window {
    turnstile?: {
      render: (contenedor: HTMLElement, opciones: { sitekey: string; callback: (token: string) => void }) => string;
    };
  }
}

export default function ConfirmarSolicitudClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const contenedorTurnstile = useRef<HTMLDivElement>(null);
  const widgetRenderizado = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/publico/pedidos/solicitud/${token}`, { cache: 'no-store' });
      if (!respuesta.ok) {
        setError('No encontramos este pedido. Pedile a tu asistente que lo genere de nuevo.');
        return;
      }
      setEstado(await respuesta.json());
    } catch {
      setError('No pudimos conectarnos. Probá de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || widgetRenderizado.current || !contenedorTurnstile.current) return;
    if (!estado || estado.estado !== 'pendiente') return;

    const render = () => {
      if (!window.turnstile || !contenedorTurnstile.current || widgetRenderizado.current) return;
      widgetRenderizado.current = true;
      window.turnstile.render(contenedorTurnstile.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: setTurnstileToken,
      });
    };

    if (window.turnstile) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [estado]);

  const confirmar = async () => {
    setEnviando(true);
    setError('');
    try {
      const respuesta = await fetch(`${API_URL}/publico/pedidos/solicitud/${token}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstile_token: turnstileToken }),
      });
      const cuerpo = await respuesta.json();

      if (respuesta.ok) {
        router.push(`/pedido/${cuerpo.token_acceso}`);
        return;
      }
      if (respuesta.status === 409) {
        setError(cuerpo.error || 'Los datos del pedido cambiaron. Revisá el resumen actualizado.');
        await cargar();
        return;
      }
      setError(cuerpo.detalle || cuerpo.error || 'No pudimos confirmar el pedido.');
    } catch {
      setError('No pudimos conectarnos. Probá de nuevo en un momento.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Buscando tu pedido…
      </main>
    );
  }

  if (!estado) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-700">{error || 'No encontramos este pedido.'}</p>
        <Link href="/productos" className="text-pink-600 underline">
          Ver el catálogo
        </Link>
      </main>
    );
  }

  const { resumen } = estado;
  const esRetiro = resumen.entrega.metodo === 'retiro';
  const vencida = estado.estado === 'vencida';
  const confirmada = estado.estado === 'confirmada';
  const faltaTurnstile = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <p className="text-sm text-gray-500 mb-1">Florería Cristina</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Revisá y confirmá tu pedido</h1>
          <p className="text-sm text-gray-600">
            Un asistente armó este pedido con los datos que le pasaste. <strong>Todavía no está hecho</strong>:
            se confirma cuando lo revisás acá. Nadie cobró nada hasta ahora.
          </p>
        </div>

        {confirmada && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm text-green-800">
            Este pedido ya estaba confirmado.{' '}
            {estado.token_acceso && (
              <Link href={`/pedido/${estado.token_acceso}`} className="underline">
                Ver el seguimiento
              </Link>
            )}
          </div>
        )}

        {vencida && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
            Este link venció. Pedile a tu asistente que arme el pedido de nuevo, o escribinos por WhatsApp.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Productos</h2>
          <ul className="divide-y divide-gray-100">
            {resumen.items.map((item) => (
              <li key={item.sku} className="py-3 flex justify-between gap-4 text-sm">
                <span className="text-gray-800">
                  {item.cantidad} × {item.nombre}
                </span>
                <span className="text-gray-900 font-medium whitespace-nowrap">{precio(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Productos</dt>
              <dd>{precio(resumen.subtotal_productos)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Envío{resumen.envio.zona ? ` (${resumen.envio.zona})` : ''}</dt>
              <dd>{resumen.envio.costo === 0 ? 'Sin cargo' : precio(resumen.envio.costo)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
              <dt>Total</dt>
              <dd>{precio(resumen.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Entrega</h2>
          <dl className="space-y-2 text-gray-700">
            <div>
              <dt className="text-gray-500">Cuándo</dt>
              <dd>
                {fechaLarga(resumen.entrega.fecha)}
                {esRetiro
                  ? ` · retiro ${resumen.entrega.hora_retiro?.slice(0, 5)} hs`
                  : ` · ${FRANJAS[resumen.entrega.franja] || resumen.entrega.franja}`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Cómo</dt>
              <dd>{METODOS[resumen.entrega.metodo] || resumen.entrega.metodo}</dd>
            </div>
            {!esRetiro && (
              <>
                <div>
                  <dt className="text-gray-500">Quién recibe</dt>
                  <dd>
                    {resumen.destinatario.nombre} · {resumen.destinatario.telefono}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Dónde</dt>
                  <dd>
                    {resumen.entrega.direccion}
                    {resumen.entrega.ciudad ? `, ${resumen.entrega.ciudad}` : ''}
                  </dd>
                </div>
              </>
            )}
            {resumen.entrega.instrucciones && (
              <div>
                <dt className="text-gray-500">Indicaciones</dt>
                <dd>{resumen.entrega.instrucciones}</dd>
              </div>
            )}
            {resumen.tarjeta.dedicatoria && (
              <div>
                <dt className="text-gray-500">Tarjeta</dt>
                <dd className="italic">
                  “{resumen.tarjeta.dedicatoria}”
                  {resumen.tarjeta.firma ? ` — ${resumen.tarjeta.firma}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Pago</dt>
              <dd>{MEDIOS[resumen.medio_pago] || resumen.medio_pago}</dd>
            </div>
          </dl>
        </div>

        {!confirmada && !vencida && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {error && (
              <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            )}
            <div ref={contenedorTurnstile} className="mb-4" />
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando || faltaTurnstile}
              className="w-full bg-pink-600 text-white font-semibold rounded-xl py-4 disabled:opacity-50"
            >
              {enviando ? 'Confirmando…' : `Confirmar el pedido por ${precio(resumen.total)}`}
            </button>
            <p className="mt-3 text-xs text-gray-500 text-center">
              Al confirmar, el pedido entra al taller y pasás a pagar. El link vence el{' '}
              {new Date(estado.expira_en).toLocaleString('es-AR')}.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
