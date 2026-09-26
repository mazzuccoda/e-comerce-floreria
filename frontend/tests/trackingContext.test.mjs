// Ejecutar con: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NEXT_PUBLIC_GA_TRACKING_ID = 'G-ABC123';

const { getTrackingContext } = await import('../utils/trackingContext.ts');

function navegador({ cookie = '', search = '', gtag } = {}) {
  globalThis.document = { cookie };
  globalThis.window = { location: { href: `https://floreriacristina.com.ar/es/checkout/multistep${search}`, search } };
  if (gtag) globalThis.window.gtag = gtag;
}

test('sin gtag lee client_id y session_id de las cookies de GA', async () => {
  navegador({
    cookie: '_ga=GA1.1.123456789.1690000000; _ga_ABC123=GS1.1.1790000000.3.1.1790000100.0.0.0; _fbp=fb.1.1.222; _fbc=fb.1.1.abc',
  });
  assert.deepEqual(await getTrackingContext(), {
    ga_client_id: '123456789.1690000000',
    ga_session_id: '1790000000',
    fbp: 'fb.1.1.222',
    fbc: 'fb.1.1.abc',
    event_source_url: 'https://floreriacristina.com.ar/es/checkout/multistep',
  });
});

test('usa gtag cuando está y arma fbc desde fbclid si no hay cookie', async () => {
  navegador({
    search: '?fbclid=XYZ',
    gtag: (cmd, id, field, cb) => cb(field === 'client_id' ? '999.111' : 1790000555),
  });
  const contexto = await getTrackingContext();
  assert.equal(contexto.ga_client_id, '999.111');
  assert.equal(contexto.ga_session_id, '1790000555');
  assert.match(contexto.fbc, /^fb\.1\.\d+\.XYZ$/);
  assert.equal(contexto.fbp, undefined);
});

test('si gtag no responde no bloquea el checkout', async () => {
  navegador({ gtag: () => {} });
  const inicio = Date.now();
  const contexto = await getTrackingContext();
  assert.ok(Date.now() - inicio < 1500);
  assert.equal(contexto.ga_client_id, undefined);
});
