import { GOOGLE_PROFILE_URL, RATING, REVIEW_COUNT } from '../../utils/googleProfile';
import { SITE_URL } from '../../utils/catalog';
import { OPENING_HOURS_SPECIFICATION } from '../../utils/businessHours';
import { BUSINESS } from '../../utils/businessInfo';

const LOGO =
  'https://res.cloudinary.com/dmxc6odsi/image/upload/v1770509496/logo_circular_byx4zs.png';

const data = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  '@id': `${SITE_URL}/#negocio`,
  name: BUSINESS.name,
  alternateName: BUSINESS.alternateName,
  url: `${SITE_URL}/es`,
  image: LOGO,
  logo: LOGO,
  telephone: BUSINESS.telephone,
  email: BUSINESS.email,
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: BUSINESS.paymentMethods.join(', '),
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    addressCountry: BUSINESS.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.latitude,
    longitude: BUSINESS.geo.longitude,
  },
  areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'City', name })),
  openingHoursSpecification: OPENING_HOURS_SPECIFICATION,
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
