import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { SITE_URL } from '../utils/catalog';

export const metadata: Metadata = {
  title: 'Florería en Yerba Buena y San Miguel de Tucumán | Florería Cristina',
  description:
    'Ramos de flores frescas, plantas y arreglos con envío en Yerba Buena y San Miguel de Tucumán, o retiro en Solano Vera 480. Pagá con Mercado Pago, transferencia o efectivo al retirar.',
  alternates: {
    canonical: `${SITE_URL}/es`,
  },
  openGraph: {
    title: 'Florería en Yerba Buena y San Miguel de Tucumán | Florería Cristina',
    description:
      'Ramos de flores frescas, plantas y arreglos con envío en Yerba Buena y San Miguel de Tucumán, o retiro en Solano Vera 480.',
    url: `${SITE_URL}/es`,
    type: 'website',
  },
};

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
