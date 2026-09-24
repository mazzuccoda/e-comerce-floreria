import type { Product } from '@/types/Product';

/**
 * Landings SEO por intención de búsqueda ("flores amarillas Tucumán", "rosas
 * Tucumán"...). No duplican catálogo: cada una declara de dónde salen sus
 * productos, y esa fuente es uno de cuatro mecanismos distintos del backend.
 *
 * - `categoria`: `Categoria.slug`.
 * - `tipo_flor`: `TipoFlor.nombre` exacto (el modelo no tiene slug; el nombre es único).
 * - `ocasion`: `Ocasion.nombre` exacto (ídem).
 * - `intencion`: la intención de `INTENCIONES` en `catalogo/public_api.py`,
 *   resuelta por `GET /api/publico/productos?intencion=...` para no duplicar
 *   la lista de términos en TypeScript.
 *
 * Nunca derivar la fuente del slug de la URL: se configura a mano por landing.
 */
export type LandingSource =
  | { kind: 'categoria'; slug: string }
  | { kind: 'tipo_flor'; nombre: string }
  | { kind: 'ocasion'; nombre: string }
  | { kind: 'intencion'; intencion: 'romantico' | 'cumpleanos' | 'condolencias' | 'nacimiento' };

export interface SeoLanding {
  /** Segmento de URL: /es/{slug} */
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Nombre corto para breadcrumbs y enlaces. */
  name: string;
  source: LandingSource;
  /** Slugs de otras landings para enlazar al pie. */
  related: string[];
}

export const SEO_LANDINGS: SeoLanding[] = [
  {
    slug: 'flores-amarillas',
    title: 'Flores amarillas en Tucumán con envío | Florería Cristina',
    description:
      'Ramos y arreglos de flores amarillas con envío en Yerba Buena y San Miguel de Tucumán. Comprá online y elegí fecha de entrega o retiro en Florería Cristina.',
    h1: 'Flores amarillas en Tucumán',
    intro:
      'Ramos y arreglos en tonos amarillos, armados en nuestra florería de Yerba Buena. Te los llevamos a domicilio en Yerba Buena y San Miguel de Tucumán, o los retirás en Solano Vera 480.',
    name: 'Flores amarillas',
    source: { kind: 'categoria', slug: 'flores-amarillas' },
    related: ['ramos-de-flores', 'rosas', 'flores-para-cumpleanos'],
  },
  {
    slug: 'ramos-de-flores',
    title: 'Ramos de flores en Tucumán con envío | Florería Cristina',
    description:
      'Ramos de flores frescas armados en Yerba Buena, con envío a domicilio en Yerba Buena y San Miguel de Tucumán. Elegí fecha de entrega o retiro en tienda.',
    h1: 'Ramos de flores en Tucumán',
    intro:
      'Ramos de flores frescas armados en nuestra florería de Yerba Buena. Comprá online, sumá una dedicatoria y elegí entrega a domicilio en Yerba Buena o San Miguel de Tucumán, o retiro en tienda.',
    name: 'Ramos de flores',
    source: { kind: 'categoria', slug: 'ramos-de-flores' },
    related: ['rosas', 'flores-amarillas', 'flores-para-novia'],
  },
  {
    slug: 'flores-para-novia',
    title: 'Flores para tu novia en Tucumán | Envío a domicilio',
    description:
      'Ramos románticos y rosas para regalarle a tu novia, con envío a domicilio en Yerba Buena y San Miguel de Tucumán. Sumá una dedicatoria escrita a mano.',
    h1: 'Flores para tu novia con envío en Tucumán',
    intro:
      'Ramos románticos, rosas y arreglos para sorprender a tu pareja. Escribí la dedicatoria al comprar: la pasamos a mano en una tarjeta y la entregamos junto con las flores en Yerba Buena o San Miguel de Tucumán.',
    name: 'Flores para tu novia',
    source: { kind: 'intencion', intencion: 'romantico' },
    related: ['rosas', 'flores-para-aniversario', 'ramos-de-flores'],
  },
  {
    slug: 'rosas',
    title: 'Rosas en Tucumán con envío a domicilio | Florería Cristina',
    description:
      'Ramos y arreglos de rosas con envío en Yerba Buena y San Miguel de Tucumán. Comprá online y elegí fecha de entrega o retiro en Florería Cristina.',
    h1: 'Rosas con envío en Tucumán',
    intro:
      'Ramos y arreglos de rosas preparados en nuestra florería de Yerba Buena, con entrega a domicilio en Yerba Buena y San Miguel de Tucumán o retiro en tienda.',
    name: 'Rosas',
    source: { kind: 'tipo_flor', nombre: 'Rosas' },
    related: ['flores-para-novia', 'ramos-de-flores', 'flores-para-aniversario'],
  },
  {
    slug: 'flores-para-cumpleanos',
    title: 'Flores para cumpleaños en Tucumán con envío | Florería Cristina',
    description:
      'Ramos y arreglos para regalar en un cumpleaños, con envío en Yerba Buena y San Miguel de Tucumán. Elegí la fecha de entrega y sumá una dedicatoria.',
    h1: 'Flores para cumpleaños en Tucumán',
    intro:
      'Ramos y arreglos para saludar en un cumpleaños. Elegí la fecha de entrega, sumá una dedicatoria y te lo llevamos a domicilio en Yerba Buena o San Miguel de Tucumán.',
    name: 'Flores para cumpleaños',
    source: { kind: 'ocasion', nombre: 'Cumpleaños' },
    related: ['flores-amarillas', 'ramos-de-flores', 'rosas'],
  },
  {
    slug: 'flores-para-aniversario',
    title: 'Flores para aniversario en Tucumán con envío | Florería Cristina',
    description:
      'Ramos y rosas para celebrar un aniversario, con envío en Yerba Buena y San Miguel de Tucumán. Programá la entrega para la fecha exacta.',
    h1: 'Flores para aniversario en Tucumán',
    intro:
      'Ramos y arreglos para celebrar un aniversario. Programá la entrega para el día exacto y sumá una dedicatoria: te lo llevamos a domicilio en Yerba Buena o San Miguel de Tucumán.',
    name: 'Flores para aniversario',
    source: { kind: 'ocasion', nombre: 'Aniversario' },
    related: ['flores-para-novia', 'rosas', 'ramos-de-flores'],
  },
];

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function getLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDINGS.find((landing) => landing.slug === slug);
}

export function landingPath(landing: Pick<SeoLanding, 'slug'>): string {
  return `/${landing.slug}`;
}

export function landingForCategoria(slug?: string | null): SeoLanding | undefined {
  if (!slug) return undefined;
  return SEO_LANDINGS.find((l) => l.source.kind === 'categoria' && l.source.slug === slug);
}

export function landingForTipoFlor(nombre?: string | null): SeoLanding | undefined {
  if (!nombre) return undefined;
  const buscado = normalizeText(nombre);
  return SEO_LANDINGS.find((l) => l.source.kind === 'tipo_flor' && normalizeText(l.source.nombre) === buscado);
}

export function landingForOcasion(nombre?: string | null): SeoLanding | undefined {
  if (!nombre) return undefined;
  const buscado = normalizeText(nombre);
  return SEO_LANDINGS.find((l) => l.source.kind === 'ocasion' && normalizeText(l.source.nombre) === buscado);
}

export interface CatalogFilters {
  categoria?: string;
  ocasion?: string;
  tipo_flor?: string;
  search?: string;
}

interface Named {
  id: number;
  nombre: string;
}

/**
 * Landing equivalente a un filtro del catálogo, sólo cuando el conjunto de
 * productos es el mismo: un único filtro, sin búsqueda de texto. Los filtros
 * `ocasion` y `tipo_flor` llegan por id (o nombre), así que hacen falta las
 * listas de la taxonomía para resolverlos.
 */
export function landingForFilters(
  filters: CatalogFilters,
  taxonomia: { tiposFlor?: Named[]; ocasiones?: Named[] } = {}
): SeoLanding | undefined {
  const activos = (['categoria', 'ocasion', 'tipo_flor', 'search'] as const).filter((key) => filters[key]);
  if (activos.length !== 1) return undefined;

  if (filters.categoria) return landingForCategoria(filters.categoria);

  const resolver = (valor: string, lista: Named[] = []) =>
    lista.find((item) => String(item.id) === valor)?.nombre ?? valor;

  if (filters.tipo_flor) return landingForTipoFlor(resolver(filters.tipo_flor, taxonomia.tiposFlor));
  if (filters.ocasion) return landingForOcasion(resolver(filters.ocasion, taxonomia.ocasiones));
  return undefined;
}

/** Si el producto entra en la landing (salvo las de intención, que resuelve la API). */
export function productMatchesLanding(landing: SeoLanding, product: Product): boolean {
  const { source } = landing;
  switch (source.kind) {
    case 'categoria':
      return product.categoria?.slug === source.slug;
    case 'tipo_flor':
      return Boolean(product.tipo_flor) && normalizeText(product.tipo_flor!.nombre) === normalizeText(source.nombre);
    case 'ocasion':
      return (product.ocasiones ?? []).some((o) => normalizeText(o.nombre) === normalizeText(source.nombre));
    case 'intencion':
      return false;
  }
}

/**
 * Landing que representa mejor al producto, para breadcrumbs: primero la de su
 * categoría, después la de su tipo de flor. No se infieren ocasiones ni intenciones.
 */
export function landingForProduct(product: Product): SeoLanding | undefined {
  return landingForCategoria(product.categoria?.slug) ?? landingForTipoFlor(product.tipo_flor?.nombre);
}

export interface BreadcrumbItem {
  name: string;
  /** Ruta sin locale (p. ej. `/rosas`). La última miga no lleva ruta. */
  path?: string;
}

/** Inicio → Landing → Producto, o Inicio → Catálogo → Producto si no hay landing. */
export function productBreadcrumbs(product: Product): BreadcrumbItem[] {
  const landing = landingForProduct(product);
  return [
    { name: 'Inicio', path: '/' },
    landing ? { name: landing.name, path: landingPath(landing) } : { name: 'Catálogo', path: '/productos' },
    { name: product.nombre },
  ];
}

export function landingBreadcrumbs(landing: SeoLanding): BreadcrumbItem[] {
  return [{ name: 'Inicio', path: '/' }, { name: landing.name }];
}

/** `BreadcrumbList` de schema.org con URLs absolutas en /es. */
export function breadcrumbJsonLd(items: BreadcrumbItem[], siteUrl: string, currentUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? `${siteUrl}/es${item.path === '/' ? '' : item.path}` : currentUrl,
    })),
  };
}
