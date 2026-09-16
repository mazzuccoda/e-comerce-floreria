'use client';

import { Star } from 'lucide-react';

// Datos del perfil de Google de la tienda (Florería y Vivero Cristina).
// Actualizar a mano cuando haya reseñas nuevas que se quieran destacar.
export const GOOGLE_PROFILE_URL =
  'https://www.google.com/maps/place/Florer%C3%ADa+y+Vivero+Cristina/@-26.8192895,-65.3036622,17z/data=!4m8!3m7!1s0x94224320cbcca66d:0xda8fc85d2067dd5!9m1!1b1';

export const RATING = '4,8';
export const REVIEW_COUNT = 44;

export const REVIEWS = [
  {
    author: 'nico campos',
    text: 'Muy buena comunicación y precio. Envío rápido y muy lindas flores. Lo recomiendo.',
  },
  {
    author: 'Juan Pablo Estofan',
    text: 'Hice un pedido de un ramo para enviarle a mi novia. La atención fue muy amable, lo enviaron rápido, el ramo era una belleza.',
  },
  {
    author: 'Emanuel Ezequiel Gonzalez Llano',
    text: 'Excelente servicio. Envían a donde pidas y casi en el acto. Los precios son acordes al servicio y la presentación un espectáculo.',
  },
  {
    author: 'Giancarlo Salgado',
    text: 'Excelente servicio, Eleonora fue muy amable y diligente, me ayudó a encontrar la mejor opción para la ocasión. Lindo el arreglo, fino y de buen gusto.',
  },
  {
    author: 'Damian Said',
    text: 'Compré desde Buenos Aires y fue muy fácil, y el trato muy gentil. Con pocas palabras mías supieron entender perfectamente lo que quería.',
  },
  {
    author: 'Gerónimo Ganem',
    text: 'Hermoso el ramo que me hicieron para la recibida de mi hermana, y la atención espectacular.',
  },
];

export function Stars({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={`${className} fill-amber-400 text-amber-400`} />
      ))}
    </span>
  );
}

/**
 * Puntaje real de Google en una línea, para usar junto al precio o al botón de pago.
 */
export function GoogleRatingBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href={GOOGLE_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-700 ${className}`}
    >
      <Stars />
      <span className="font-semibold">{RATING}</span>
      <span className="text-gray-600 underline-offset-2 hover:underline">
        {REVIEW_COUNT} reseñas en Google
      </span>
    </a>
  );
}

/**
 * Franja de prueba social para ubicar apenas debajo del hero.
 */
export function GoogleReviewsStrip() {
  const highlights = REVIEWS.slice(0, 2);

  return (
    <section className="border-b border-gray-100 bg-emerald-50/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <Stars />
          <span className="font-semibold">{RATING}</span>
          <a
            href={GOOGLE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-800 hover:underline"
          >
            {REVIEW_COUNT} reseñas en Google
          </a>
        </div>
        <ul className="flex flex-col gap-2 text-sm text-gray-700 sm:flex-row sm:gap-6">
          {highlights.map((review) => (
            <li key={review.author} className="line-clamp-2 max-w-md">
              “{review.text}” <span className="font-medium text-gray-900">{review.author}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
