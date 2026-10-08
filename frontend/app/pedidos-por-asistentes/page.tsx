import type { Metadata } from 'next';
import Link from 'next/link';

import { CUTOFF, OPENING_HOURS_TEXT, SAME_DAY_TEXT } from '@/utils/businessHours';
import { BUSINESS } from '@/utils/businessInfo';
import { SITE_URL } from '@/utils/catalog';
import { breadcrumbJsonLd } from '@/utils/seoLandings';

import Breadcrumbs from '../components/Breadcrumbs';

const CANONICAL = `${SITE_URL}/es/pedidos-por-asistentes`;
const TITLE =
  'Pedidos de flores por asistentes de IA en Yerba Buena y Tucumán | Florería Cristina';
const DESCRIPTION =
  'Florería Cristina acepta pedidos armados por asistentes de IA (ChatGPT, Gemini, Copilot y agentes propios): el asistente consulta stock y precios por API, arma el pedido y la persona lo confirma con un clic. Envío en Yerba Buena y San Miguel de Tucumán.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, type: 'website' },
};

const BREADCRUMBS = [{ name: 'Inicio', path: '/' }, { name: 'Pedidos por asistentes de IA' }];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Florist',
      '@id': `${SITE_URL}/#negocio`,
      name: BUSINESS.name,
      url: `${SITE_URL}/es`,
      areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'City', name })),
      potentialAction: {
        '@type': 'OrderAction',
        name: 'Armar un pedido de flores para que la persona confirme',
        description:
          'Un asistente de IA arma el pedido con la API pública y recibe un link de confirmación. El pedido lo confirma una persona desde el navegador; el asistente nunca paga.',
        target: [
          {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/api/publico/pedidos`,
            httpMethod: 'POST',
            contentType: 'application/json',
            actionPlatform: 'https://schema.org/DesktopWebPlatform',
          },
          {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/es/productos`,
            actionPlatform: 'https://schema.org/DesktopWebPlatform',
          },
        ],
        deliveryMethod: ['https://schema.org/OnSitePickup', 'https://schema.org/ParcelService'],
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'ARS',
        },
      },
    },
    {
      '@type': 'WebPage',
      '@id': CANONICAL,
      url: CANONICAL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'es-AR',
      about: { '@id': `${SITE_URL}/#negocio` },
      mainEntity: {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Un asistente de IA puede comprar flores en Florería Cristina?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí. El asistente consulta el catálogo, el stock y el costo de envío por la API pública y arma el pedido completo. El pedido se concreta cuando la persona abre el link de confirmación y confirma desde su navegador.',
            },
          },
          {
            '@type': 'Question',
            name: '¿El asistente puede pagar por mí?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Ningún asistente ejecuta pagos. El pago lo hace la persona después de confirmar, con Mercado Pago, PayPal, transferencia o efectivo al retirar en tienda.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Quién calcula el precio y el envío?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Siempre el servidor de Florería Cristina, por la dirección de entrega. Si el asistente manda un precio o un costo de envío, se ignora. Si algo cambió entre que el asistente armó el pedido y la persona confirmó, la confirmación se frena y muestra los valores nuevos.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Llega el mismo día?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Sí: ${SAME_DAY_TEXT} Horario de atención: ${OPENING_HOURS_TEXT}. Entregamos en ${BUSINESS.areaServed.join(' y ')}.`,
            },
          },
        ],
      },
    },
  ],
};

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
        {numero}
      </span>
      <div>
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <p className="mt-1 text-gray-600">{children}</p>
      </div>
    </li>
  );
}

export default function PedidosPorAsistentesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(BREADCRUMBS, SITE_URL, CANONICAL)) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Breadcrumbs items={BREADCRUMBS} />

      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Pedidos de flores armados por asistentes de IA
      </h1>
      <p className="mb-8 max-w-3xl text-gray-600">
        Florería Cristina acepta pedidos armados por asistentes de inteligencia artificial en{' '}
        {BUSINESS.areaServed.join(' y ')}. Un asistente puede consultar el catálogo con precios y
        stock reales, cotizar el envío a una dirección y dejar el pedido listo; la compra la
        confirma una persona con un clic. El asistente nunca paga ni reserva stock por su cuenta.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Cómo funciona</h2>
        <ol className="grid gap-5 md:grid-cols-2">
          <Paso numero={1} titulo="El asistente busca">
            Consulta el catálogo público por presupuesto, ocasión o tipo de flor y obtiene precio
            vigente, stock y la URL de cada producto.
          </Paso>
          <Paso numero={2} titulo="Cotiza la entrega">
            Con la dirección del destinatario, el servidor calcula el costo de envío por distancia y
            si la fecha pedida está disponible.
          </Paso>
          <Paso numero={3} titulo="Arma el pedido">
            Envía los datos y recibe un link de confirmación con el total ya calculado. En este paso
            todavía no hay pedido ni stock reservado.
          </Paso>
          <Paso numero={4} titulo="La persona confirma">
            Abre el link, revisa productos, destinatario, dirección, fecha y total, pasa una
            verificación anti-robot y confirma. Recién ahí nace el pedido y sigue al pago.
          </Paso>
        </ol>
      </section>

      <section className="mb-10 max-w-3xl">
        <h2 className="mb-3 text-xl font-bold text-gray-900">Las reglas, en claro</h2>
        <ul className="list-disc space-y-2 pl-5 text-gray-600">
          <li>Ningún asistente ejecuta pagos: el cobro lo inicia la persona después de confirmar.</li>
          <li>
            El precio y el costo de envío los calcula siempre el servidor; lo que mande el asistente
            se ignora.
          </li>
          <li>
            El link de confirmación vence a las dos horas y revalida stock, precio y disponibilidad
            antes de crear el pedido.
          </li>
          <li>
            Entrega express el mismo día para pedidos confirmados de lunes a sábado hasta las{' '}
            {CUTOFF} hs, entrega programada por día y franja, o retiro sin cargo en{' '}
            {BUSINESS.streetAddress}, {BUSINESS.locality}.
          </li>
          <li>Medios de pago: {BUSINESS.paymentMethods.join(', ')}.</li>
          <li>Cancelaciones y cambios: {BUSINESS.cancellationPolicy}.</li>
        </ul>
      </section>

      <section className="mb-10 max-w-3xl">
        <h2 className="mb-3 text-xl font-bold text-gray-900">Si sos un agente o un desarrollador</h2>
        <p className="text-gray-600">
          Las instrucciones completas, con los endpoints públicos y los ejemplos de cada llamada,
          están en{' '}
          <a href={`${SITE_URL}/llms.txt`} className="font-medium text-emerald-800 underline">
            {SITE_URL}/llms.txt
          </a>
          . No hace falta clave ni registro para consultar el catálogo, cotizar el envío y armar un
          pedido para que lo confirme la persona.
        </p>
      </section>

      <nav aria-label="Seguí navegando" className="flex flex-wrap gap-3">
        {[
          { href: '/es/productos', label: 'Ver el catálogo' },
          { href: '/es/zonas', label: 'Zonas y envíos' },
          { href: '/es/contacto', label: 'Contacto' },
        ].map((link) => (
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
