---
name: testing-storefront
description: How to run and runtime-test the Florería Cristina Next.js storefront (checkout, SEO routes, catalog) without touching production data or real payments.
---

# Testing the Florería Cristina storefront

## Devin Secrets Needed
None for read-only catalog/checkout-validation testing (the public Railway API serves the catalog).
Only needed if you must test order creation/payments end to end (Railway/MercadoPago/PayPal credentials) — avoid unless the user explicitly authorizes real orders.

## Fastest setup (frontend only, prod API, read-only)
```bash
cd <repo>/frontend
rm -rf .next   # stale chunks cause "Cannot find module './948.js'" / vendor-chunks errors and HTTP 500s
NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app/api \
NEXT_PUBLIC_SITE_URL=https://floreriacristina.com.ar \
npx next build
NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app/api \
NEXT_PUBLIC_SITE_URL=https://floreriacristina.com.ar \
nohup npx next start -p 3000 > /tmp/next.log 2>&1 &
```
- A production build (`next build` + `next start`) is more reliable than `next dev`: with `next dev` the cart
  (localStorage key `cart_data`, `context/CartContextRobust.tsx`) sometimes fails to persist after add-to-cart.
- `next start` may log `TypeError: Cannot read properties of undefined (reading 'bind')` and a missing-`sharp`
  warning; routes still return 200. Verify with `curl -o /dev/null -w '%{http_code}' http://localhost:3000/es`.
- Port cleanup: `pkill -9 -f next-server; pkill -9 -f "next start"; ss -ltnp | grep :3000`.
- Middleware redirects `/` → `/es`; locale-prefixed URLs are rewritten to unprefixed app routes, so
  `app/zonas/page.tsx` serves `/es/zonas`.

## Safety boundary for checkout tests
Never create real orders or open MercadoPago/PayPal. The safe way to exercise the last step is to reach
step 4 (Pago) and click "Confirmar Pedido" with the terms checkbox UNCHECKED — validation returns before the
POST to `/api/pedidos/checkout-with-items/`. Payment result screens can be inspected without paying:
`/es/checkout/success?pedido=1&payment=success|pending|failure|cancelled|error`.

## Useful checks
- Multistep checkout (`app/checkout/multistep/page.tsx`) shows a "Continuar pedido anterior" modal when a draft
  exists; choose "Empezar de nuevo" to reset state between runs.
- Deleted debug routes should 404; sweep quickly:
  `for r in checkout-final checkout-premium checkout-simple checkout/simple checkout/test checkout/cart-debug productos-test test-cart; do curl -s -o /dev/null -w "$r %{http_code}\n" http://localhost:3000/es/$r; done`
- SEO: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` must use `floreriacristina.com.ar` and `start_url: /es`.
- `/es/zonas` depends on `GET /api/catalogo/zonas/`, which currently returns `[]` in production, so an empty
  zone grid is expected — check for absence of errors, not for content.
- Product images must resolve to Cloudinary/Railway; any `http://localhost/media/...` or `${undefined}` URL is a bug
  (`utils/apiBase.ts` provides `API_URL`/`API_ROOT`).
- Known issue to re-check: with "Envío anónimo" checked, sender name/email/phone become `disabled` while the
  validator still requires them and the helper text says they are optional → possible dead end for the user.
