import { GOOGLE_PROFILE_URL, RATING, REVIEW_COUNT } from '../../utils/googleProfile';
import { SITE_URL } from '../../utils/catalog';

const LOGO =
  'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png';

const data = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  '@id': `${SITE_URL}/#negocio`,
  name: 'Florería Cristina',
  alternateName: 'Florería y Vivero Cristina',
  url: `${SITE_URL}/es`,
  image: LOGO,
  logo: LOGO,
  telephone: '+543814778577',
  email: 'eleososatuc@gmail.com',
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Mercado Pago, Transferencia bancaria, Efectivo (sólo al retirar en tienda)',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Solano Vera 480',
    addressLocality: 'Yerba Buena',
    addressRegion: 'Tucumán',
    addressCountry: 'AR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.8192895,
    longitude: -65.3062371,
  },
  areaServed: [
    { '@type': 'City', name: 'Yerba Buena' },
    { '@type': 'City', name: 'San Miguel de Tucumán' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '20:00',
    },
  ],
  // Pedidos express confirmados hasta las 17:00 se entregan el mismo día.
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Ramos y arreglos florales',
    url: `${SITE_URL}/es/productos`,
  },
  // El puntaje es del negocio en Google, no de cada producto.
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: RATING.replace(',', '.'),
    reviewCount: REVIEW_COUNT,
    bestRating: '5',
  },
  sameAs: [GOOGLE_PROFILE_URL, 'https://www.facebook.com/104926018034373'],
};

export default function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
