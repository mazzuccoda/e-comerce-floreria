'use client';

import { GOOGLE_PROFILE_URL, RATING, REVIEW_COUNT, REVIEWS, Stars } from './GoogleRating';

export default function GoogleReviews() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-700">
            <Stars />
            <span className="font-semibold">{RATING}</span>
            <a
              href={GOOGLE_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              {REVIEW_COUNT} reseñas en Google
            </a>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <li
              key={review.author}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5"
            >
              <Stars />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">
                “{review.text}”
              </p>
              <p className="mt-4 text-sm font-semibold text-gray-900">{review.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
