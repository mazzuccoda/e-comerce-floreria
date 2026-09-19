'use client';

import { Star } from 'lucide-react';
import { GOOGLE_PROFILE_URL, RATING, REVIEW_COUNT, REVIEWS } from '../../utils/googleProfile';

export { GOOGLE_PROFILE_URL, RATING, REVIEW_COUNT, REVIEWS } from '../../utils/googleProfile';

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
