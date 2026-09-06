'use client';

import { Star } from 'lucide-react';

// Reseñas textuales del perfil de Google de la tienda (Florería y Vivero Cristina).
// Actualizar a mano cuando haya reseñas nuevas que se quieran destacar.
const GOOGLE_PROFILE_URL =
  'https://www.google.com/maps/place/Florer%C3%ADa+y+Vivero+Cristina/@-26.8192895,-65.3036622,17z/data=!4m8!3m7!1s0x94224320cbcca66d:0xda8fc85d2067dd5!9m1!1b1';

const RATING = '4,8';
const REVIEW_COUNT = 44;

const REVIEWS = [
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

function Stars() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

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
