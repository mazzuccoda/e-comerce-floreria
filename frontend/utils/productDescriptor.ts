import { Product } from '@/types/Product';

/**
 * Los nombres de los productos ("Sol de Verano", "Mix único") no dicen qué se
 * vende. El descriptor agrega en el título lo que la gente sí busca
 * ("ramo de girasoles") a partir del texto del producto y su categoría.
 */

const FLORES: Array<{ patron: RegExp; plural: string }> = [
  { patron: /girasol/i, plural: 'girasoles' },
  { patron: /\brosas?\b/i, plural: 'rosas' },
  { patron: /lil[iy]um|lirio/i, plural: 'lilium' },
  { patron: /margarita/i, plural: 'margaritas' },
  { patron: /gerbera/i, plural: 'gerberas' },
  { patron: /tulip[áa]n/i, plural: 'tulipanes' },
  { patron: /orqu[íi]dea/i, plural: 'orquídeas' },
  { patron: /a[l]?stroemeria|astromelia/i, plural: 'astromelias' },
  { patron: /crisantemo/i, plural: 'crisantemos' },
  { patron: /clavel/i, plural: 'claveles' },
];

// Categorías que describen el producto; las de ocasión ("San Valentín", "Oferta
// del día") no sirven como descriptor.
const CATEGORIAS_DESCRIPTIVAS = ['ramos-de-flores', 'flores-amarillas', 'ramos-blancos'];

const NO_FLORAL = /peluche|\boso\b|globo|chocolate|bomb[óo]n|tarjeta|vino|caja de/i;

const TIPO_POR_CATEGORIA: Record<string, string> = {
  plantas: 'planta',
  'centros-de-mesa': 'arreglo floral',
  'floreros-preparados': 'florero con flores',
  condolencias: 'arreglo fúnebre',
  iglesias: 'arreglo floral para iglesia',
  empresariales: 'arreglo floral empresarial',
};

function tipoDeProducto(product: Product): string {
  const slug = product.categoria?.slug ?? '';
  return TIPO_POR_CATEGORIA[slug] ?? 'ramo';
}

function floresDelTexto(texto: string): string[] {
  return FLORES.filter((flor) => flor.patron.test(texto)).map((flor) => flor.plural);
}

/**
 * Devuelve algo como "ramo de girasoles y margaritas" o, si no se reconoce
 * ninguna flor, "ramo de flores amarillas" (el nombre de la categoría).
 */
export function productDescriptor(product: Product): string | null {
  if (product.es_adicional) return null;

  if (NO_FLORAL.test(product.nombre)) return null;

  const tipo = tipoDeProducto(product);
  const texto = `${product.nombre} ${product.descripcion_corta ?? ''} ${product.descripcion ?? ''}`;
  const flores = floresDelTexto(texto).slice(0, 2);

  if (flores.length > 0) {
    return `${tipo} de ${flores.join(' y ')}`;
  }

  if (tipo !== 'ramo') return tipo;

  const slug = product.categoria?.slug ?? '';
  if (CATEGORIAS_DESCRIPTIVAS.includes(slug)) {
    return `ramo de ${product.categoria.nombre.toLowerCase()}`;
  }
  return 'ramo de flores';
}
