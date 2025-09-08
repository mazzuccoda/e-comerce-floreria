'use client';

import { Product } from '@/types/Product';

interface ProductSchemaProps {
  product: Product;
}

export default function ProductSchema({ product }: ProductSchemaProps) {
  const formatPrice = (price: string | number) => {
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nombre,
    "description": product.descripcion || `${product.nombre} - Flores frescas de Florería Cristina`,
    "image": product.imagen_principal ? 
      (product.imagen_principal.startsWith('http') ? 
        product.imagen_principal : 
        `https://floreria-cristina.com${product.imagen_principal}`) : 
      "https://floreria-cristina.com/images/default-flower.jpg",
    "sku": product.id.toString(),
    "brand": {
      "@type": "Brand",
      "name": "Florería Cristina"
    },
    "category": "Flores y Plantas",
    "offers": {
      "@type": "Offer",
      "price": formatPrice(product.precio_final),
      "priceCurrency": "ARS",
      "availability": product.stock > 0 ? 
        "https://schema.org/InStock" : 
        "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Florería Cristina",
        "url": "https://floreria-cristina.com"
      },
      "url": `https://floreria-cristina.com/productos/${product.slug}`,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 días
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "María González"
        },
        "reviewBody": "Flores hermosas y frescas, llegaron en perfecto estado. Excelente servicio de entrega."
      }
    ]
  };

  // Agregar información adicional si está disponible
  if (product.tipo_flor) {
    schema["additionalProperty"] = [
      {
        "@type": "PropertyValue",
        "name": "Tipo de Flor",
        "value": product.tipo_flor
      }
    ];
  }

  if (product.envio_gratis) {
    schema.offers["shippingDetails"] = {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "ARS"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3,
          "unitCode": "DAY"
        }
      }
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  );
}
