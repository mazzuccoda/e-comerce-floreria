// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  breadcrumbJsonLd,
  landingForFilters,
  productBreadcrumbs,
  productMatchesLanding,
  SEO_LANDINGS,
  getLanding,
} from '../utils/seoLandings.ts';

const SITE = 'https://floreriacristina.com.ar';

test('las seis landings tienen slug, title, description y h1 únicos', () => {
  assert.equal(SEO_LANDINGS.length, 6);
  for (const campo of ['slug', 'title', 'description', 'h1']) {
    const valores = SEO_LANDINGS.map((l) => l[campo]);
    assert.equal(new Set(valores).size, valores.length, campo);
  }
  for (const landing of SEO_LANDINGS) {
    for (const relacionada of landing.related) assert.ok(getLanding(relacionada), relacionada);
  }
});

test('filtro con landing equivalente apunta a la landing', () => {
  assert.equal(landingForFilters({ categoria: 'flores-amarillas' })?.slug, 'flores-amarillas');
  assert.equal(landingForFilters({ categoria: 'ramos-de-flores' })?.slug, 'ramos-de-flores');
  assert.equal(
    landingForFilters({ tipo_flor: '3' }, { tiposFlor: [{ id: 3, nombre: 'Rosas' }] })?.slug,
    'rosas'
  );
  assert.equal(
    landingForFilters({ ocasion: '7' }, { ocasiones: [{ id: 7, nombre: 'Cumpleaños' }] })?.slug,
    'flores-para-cumpleanos'
  );
  assert.equal(landingForFilters({ ocasion: 'Aniversario' })?.slug, 'flores-para-aniversario');
});

test('filtros sin equivalencia exacta no tienen landing', () => {
  assert.equal(landingForFilters({}), undefined);
  assert.equal(landingForFilters({ categoria: 'plantas' }), undefined);
  assert.equal(landingForFilters({ categoria: 'flores-amarillas', search: 'sol' }), undefined);
  assert.equal(landingForFilters({ categoria: 'flores-amarillas', ocasion: '7' }), undefined);
  assert.equal(landingForFilters({ tipo_flor: '99' }, { tiposFlor: [{ id: 3, nombre: 'Rosas' }] }), undefined);
});

const producto = (extra) => ({
  id: 1,
  nombre: 'Sol de Verano',
  slug: 'sol-de-verano',
  categoria: { nombre: 'Plantas', slug: 'plantas' },
  ocasiones: [],
  ...extra,
});

test('breadcrumbs de producto usan la landing y si no, el catálogo', () => {
  const amarillo = producto({ categoria: { nombre: 'Flores amarillas', slug: 'flores-amarillas' } });
  assert.deepEqual(
    productBreadcrumbs(amarillo).map((b) => b.name),
    ['Inicio', 'Flores amarillas', 'Sol de Verano']
  );
  const rosa = producto({ tipo_flor: { id: 3, nombre: 'Rosas' } });
  assert.equal(productBreadcrumbs(rosa)[1].path, '/rosas');
  assert.deepEqual(productBreadcrumbs(producto()).map((b) => b.path), ['/', '/productos', undefined]);
});

test('BreadcrumbList usa URLs absolutas en /es', () => {
  const jsonLd = breadcrumbJsonLd(productBreadcrumbs(producto()), SITE, `${SITE}/es/productos/sol-de-verano`);
  assert.equal(jsonLd['@type'], 'BreadcrumbList');
  assert.deepEqual(
    jsonLd.itemListElement.map((i) => i.item),
    [`${SITE}/es`, `${SITE}/es/productos`, `${SITE}/es/productos/sol-de-verano`]
  );
});

test('productos por tipo de flor y ocasión se comparan sin acentos', () => {
  const cumple = getLanding('flores-para-cumpleanos');
  assert.ok(productMatchesLanding(cumple, producto({ ocasiones: [{ id: 1, nombre: 'cumpleanos' }] })));
  assert.ok(!productMatchesLanding(cumple, producto()));
  assert.ok(productMatchesLanding(getLanding('rosas'), producto({ tipo_flor: { id: 3, nombre: 'Rosas' } })));
});
