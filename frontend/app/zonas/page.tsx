import type { Metadata } from 'next';
import Link from 'next/link';

import { TIENDA } from '@/components/paymentInfo';
import { CUTOFF } from '@/utils/businessHours';
import { SITE_URL } from '@/utils/catalog';
import { breadcrumbJsonLd } from '@/utils/seoLandings';

import Breadcrumbs from '../components/Breadcrumbs';
import ZonasClient from './ZonasClient';

const CANONICAL = `${SITE_URL}/es/zonas`;
const TITLE = 'Envío de flores en Yerba Buena y San Miguel de Tucumán | Florería Cristina';
const DESCRIPTION =
  'Zonas, costos y horarios de envío de flores en Yerba Buena y San Miguel de Tucumán: express en el día, entrega programada o retiro en Solano Vera 480.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, type: 'website' },
};

const BREADCRUMBS = [{ name: 'Inicio', path: '/' }, { name: 'Zonas de envío' }];

const LINKS = [
  { href: '/es/productos', label: 'Ver el catálogo' },
  { href: '/es/ramos-de-flores', label: 'Ramos de flores' },
  { href: '/es/flores-para-novia', label: 'Flores para tu novia' },
  { href: '/es/flores-amarillas', label: 'Flores amarillas' },
];

export default function ZonasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(BREADCRUMBS, SITE_URL, CANONICAL)) }}
      />
      <Breadcrumbs items={BREADCRUMBS} />

      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Envío de flores en Yerba Buena y San Miguel de Tucumán
      </h1>
      <p className="mb-8 max-w-2xl text-gray-600">
        El costo se calcula por la distancia entre la tienda ({TIENDA.direccion}) y la dirección
        de entrega, y lo ves en el checkout antes de pagar.
      </p>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Entrega en Yerba Buena</h2>
          <p className="mt-1 text-gray-600">
            Salimos desde nuestra tienda en Yerba Buena, con envío express o programado. El costo
            depende de la distancia a la dirección de entrega.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Entrega en San Miguel de Tucumán</h2>
          <p className="mt-1 text-gray-600">
            También entregamos en San Miguel de Tucumán. Ingresá la dirección en el checkout para
            ver si llega el envío express o el programado, y a qué costo.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Express y entrega programada</h2>
          <p className="mt-1 text-gray-600">
            Con el envío express, los pedidos confirmados de lunes a sábado hasta las {CUTOFF} hs se
            entregan el mismo día. Con la entrega programada elegís el día y la franja horaria.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Retiro en tienda</h2>
          <p className="mt-1 text-gray-600">
            Sin cargo en {TIENDA.direccion}, {TIENDA.horario}.
          </p>
        </section>
      </div>

      <ZonasClient />

      <nav aria-label="Seguí comprando" className="mt-10 flex flex-wrap gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:text-emerald-800"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
