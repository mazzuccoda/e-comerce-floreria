'use client';

import Head from 'next/head';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: string;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
}

export default function MetaTags({
  title = 'Florería Cristina - Ramos de flores a domicilio',
  description = 'Florería y vivero especializado en ramos de flores frescas, plantas y arreglos florales. Entrega a domicilio en toda la ciudad. Calidad garantizada.',
  keywords = 'florería, flores, ramos, plantas, vivero, entrega domicilio, arreglos florales, flores frescas, bouquet, decoración floral',
  image = '/images/floreria-cristina-og.jpg',
  url = 'https://floreria-cristina.com',
  type = 'website',
  price,
  currency = 'ARS',
  availability = 'in_stock'
}: MetaTagsProps) {
  const fullTitle = title.includes('Florería Cristina') ? title : `${title} | Florería Cristina`;
  const fullUrl = url.startsWith('http') ? url : `https://floreria-cristina.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://floreria-cristina.com${image}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Florería Cristina" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="es-AR" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Florería Cristina" />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@floreria_cristina" />

      {/* Product-specific meta tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
          <meta property="product:condition" content="new" />
        </>
      )}

      {/* Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Florería Cristina",
            "description": description,
            "url": "https://floreria-cristina.com",
            "telephone": "+54-11-1234-5678",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Av. Principal 123",
              "addressLocality": "Buenos Aires",
              "addressRegion": "CABA",
              "postalCode": "1000",
              "addressCountry": "AR"
            },
            "openingHours": [
              "Mo-Fr 09:00-18:00",
              "Sa 09:00-15:00"
            ],
            "priceRange": "$$",
            "image": fullImage,
            "sameAs": [
              "https://www.facebook.com/floreria.cristina",
              "https://www.instagram.com/floreria_cristina"
            ]
          })
        }}
      />

      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#e91e63" />

      {/* Performance and Preload */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </Head>
  );
}
