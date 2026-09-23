import Link from 'next/link';
import { headers } from 'next/headers';

import { localeHref } from '@/utils/localeHref';

export const metadata = {
  title: 'Página no encontrada | Florería Cristina',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const locale = headers().get('x-locale') === 'en' ? 'en' : 'es';

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">No encontramos esta página</h1>
      <p className="mt-3 text-gray-600">
        El producto pudo haber salido del catálogo o el enlace cambió. Mirá los ramos y arreglos
        disponibles hoy.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={localeHref('/productos', locale)}
          className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
        >
          Ver el catálogo
        </Link>
        <Link
          href={localeHref('/contacto', locale)}
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:text-emerald-800"
        >
          Contactarnos
        </Link>
      </div>
    </main>
  );
}
