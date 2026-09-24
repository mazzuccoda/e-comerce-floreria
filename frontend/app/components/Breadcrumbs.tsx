import Link from 'next/link';

import { localeHref } from '@/utils/localeHref';
import type { BreadcrumbItem } from '@/utils/seoLandings';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale?: string;
  className?: string;
}

/**
 * Migas de pan visibles. El `BreadcrumbList` JSON-LD se arma con
 * `breadcrumbJsonLd()` en la página de servidor, a partir de los mismos items.
 */
export default function Breadcrumbs({ items, locale = 'es', className = 'mb-6 text-sm text-gray-500' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Ubicación" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
              {item.path && !last ? (
                <Link href={localeHref(item.path, locale)} className="hover:text-green-700">
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-900" aria-current="page">
                  {item.name}
                </span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
