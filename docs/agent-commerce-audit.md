# Auditoría Agent-Commerce — Fase 0

Fecha: 2026-08-17. Alcance: estado real del repositorio y de producción antes de implementar el backlog del brief *Agent-Commerce v2*. **No se modificó código de la aplicación**; este documento es el entregable de la Fase 0.

Todo lo marcado como "verificado" se comprobó contra el código del repo o contra las URLs productivas el día de la auditoría. Lo que no se pudo comprobar está listado como pendiente, no como conclusión.

---

## 1. Corrección al brief: arquitectura real

El brief describe "un monolito Django 5 con templates server-rendered (Bootstrap 5)" y "sin SPA". **Eso no coincide con el repositorio.**

| Capa | Real |
| --- | --- |
| Backend | Django + DRF, apps `catalogo`, `carrito`, `pedidos`, `usuarios`, `notificaciones`, `core`, `admin_simple` |
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind, en `frontend/`, consumiendo la API por HTTP |
| Dominio público | `floreriacristina.com.ar` → **Next.js** (todo bajo prefijo de idioma `/es`) |
| API pública | `e-comerce-floreria-production.up.railway.app/api` → **Django** |
| Infra | Railway, PostgreSQL, Cloudinary (media), Celery/Redis según documentación histórica |

Consecuencia práctica para el brief: los ítems de indexabilidad, SSR, JSON-LD, sitemap y performance se implementan en Next.js, y **el dominio público no sirve ninguna ruta de Django** (ver §5). Cualquier endpoint nuevo pensado para agentes tiene que exponerse en el dominio público (vía Next.js route handler o proxy), no sólo en el backend.

---

## 2. Catálogo (app `catalogo`)

### Modelo `Producto` — campos existentes
`nombre`, `slug`, `descripcion`, `descripcion_corta`, `categoria` (FK), `tipo` (`ramo|planta|arreglo|otro`), `precio`, `precio_descuento`, `porcentaje_descuento`, `sku` (único), `stock`, `is_active`, `is_featured`, `tipo_flor` (FK), `ocasiones` (M2M), `envio_gratis`, `es_adicional`, `publicar_en_redes`, `fecha_ultima_publicacion`, timestamps. Imágenes en `ProductoImagen` (`is_primary`, `orden`).

### Datos reales en producción (66 productos activos)
| Métrica | Valor |
| --- | --- |
| Productos activos | 66 |
| Con stock > 0 | 61 |
| Marcados destacados | 46 |
| Con `tipo_flor` cargado | 34 |
| Con al menos una ocasión | 27 |
| Adicionales | 6 |
| `tipo` = "otro" | 31 de 66 |

Lectura: la taxonomía existe pero está a medio cargar. Un agente que filtre por ocasión ve menos de la mitad del catálogo, y "tipo" no discrimina (la mitad es "otro"). **Esto es carga de datos, no código.**

### Faltantes de modelo para agent-commerce
No existen: composición/flores incluidas como dato estructurado, medidas, variantes o tamaños, cuidados, tiempo de preparación, ni `disponible_desde/hasta`. El brief los requiere para que un agente responda "qué incluye" y "qué tamaño". Requieren migración (pendiente de autorización del usuario, que pidió no tocar backend).

### API de catálogo — verificada
`GET /api/catalogo/productos/` es pública (`AllowAny`), **sin paginación** (devuelve los 66 objetos en un array plano) y soporta `categoria` (slug), `tipo_flor` (id), `ocasion` (id), `precio_min`, `precio_max`, `destacados`, `adicionales`, `ordering`, `search`, `lang`.

Problemas verificados:
- **`lookup_field = 'id'`**: el detalle es por ID interno, no por slug. El slug es la clave que usan el sitio, el feed y el SEO → hay dos identificadores conviviendo.
- Sin paginación ni `count`: cualquier cliente (incluido un agente) descarga el catálogo completo en cada consulta.
- `search` es `icontains` sobre nombre/descripción: buscar "rosas" devuelve 25 de 66 productos, muchos sin rosas (matchea texto de descripción). No hay Haystack/Whoosh activo en el código actual pese a lo que dice la documentación histórica.
- Nombres de parámetros inconsistentes con lo que se suele probar (`precio_max`, no `max_price`; `max_price` se ignora silenciosamente y devuelve todo).

---

## 3. Envío y disponibilidad

- Config verificada en `GET /api/pedidos/shipping/config/`: tienda en Solano Vera 480 (-26.8192895, -65.3062371), tope express 5 km, programado 11 km, Distance Matrix activo.
- Zonas verificadas en `GET /api/pedidos/shipping/zones/{express|programado}/` (Yerba Buena Centro/Extendido, San Miguel, etc., con `base_price` y `price_per_km`).
- **`POST /api/pedidos/shipping/calculate/` exige `distance_km` y `shipping_method`**: no acepta una dirección. La distancia se calcula **en el navegador** con Google Maps JS (`frontend/app/services/distanceService.ts`, `AddressMapPicker.tsx`).

Implicancia directa para el brief: **hoy es imposible que un cliente sin navegador (agente, integración, canal de venta) obtenga un costo de envío**. Es el gap más importante del backlog de agent-commerce y necesita un endpoint server-side `dirección → {zona, costo, disponibilidad}`.

- `GET /api/pedidos/metodos-envio/` devuelve un único registro basura: `"Método temporal 1"` con costo 0. El frontend no lo usa, pero es un endpoint público que ensucia cualquier integración.
- La promesa de entrega (hoy / mañana, franjas) vive sólo en el frontend (`frontend/utils/deliveryPromise.ts`), no en la API.

---

## 4. Checkout y pagos

- El checkout real que usa el frontend es `POST /api/pedidos/checkout-with-items/` (`pedidos/simple_views.py::simple_checkout_with_items`), `@csrf_exempt`, acepta token opcional y recibe los items en el body.
- `CheckoutSerializer` (`pedidos/serializers.py`) **no se usa** y su propio docstring lo aclara; además tiene todas las validaciones de fecha comentadas. Es la fuente de verdad aparente pero no es la real: cualquier integración que se guíe por él se equivoca.
- Existe modo vacaciones (`core.SiteSettings`) que bloquea express y retiro y exige fecha ≥ `reopen_date`.
- Pagos: Mercado Pago (`CreatePaymentView` + webhook), PayPal (create/success/cancel), transferencia (con QR opcional) y efectivo sólo para retiro en tienda (regla ya implementada en el checkout).
- Conviven endpoints legacy en la raíz de Django (`/direct-checkout/`, `/test-cart/`, `/api/pedidos/simple/...`) y `test-mercadopago/` marcado en el propio código como "ELIMINAR EN PRODUCCIÓN".
- No hay documentación de API publicada (no hay drf-spectacular ni drf-yasg instalados).

---

## 5. SEO e indexabilidad — verificado en producción

Comprobado sobre `https://floreriacristina.com.ar/es/productos/sol-de-verano-10006`:

| Ítem | Estado |
| --- | --- |
| `<title>` de producto | **Genérico**: "Florería Cristina - Ramos de flores a domicilio" (el mismo que la home) |
| `<meta description>` | Genérica, igual que la home |
| `rel=canonical` | **No existe** en ninguna página |
| JSON-LD | **0 bloques** en home y en ficha (existe `app/components/SEO/ProductSchema.tsx` pero **no está usado en ninguna página**) |
| `<h1>` en el HTML servido | **No existe** |
| Precio en el HTML servido | **No aparece** |
| Open Graph | Presente, pero genérico en toda ficha |
| `robots.txt` | OK (bloquea checkout/carrito/perfil, declara sitemap) |
| `sitemap.xml` | 200, pero **sólo 6 URLs estáticas**: no incluye ni un producto (`app/sitemap.ts` tiene el TODO y la función de productos comentada) |

Causa raíz: `app/page.tsx` y `app/productos/[slug]/page.tsx` son `'use client'` y traen los datos por fetch en el navegador, así que **nombre, precio, stock y descripción no están en el HTML** que ven Google, Meta o un agente. No hay ningún `generateMetadata` en toda la app.

Esto es el P0 real del brief: sin contenido server-rendered ni datos estructurados, un agente no puede leer qué vende la tienda ni a qué precio sin ejecutar JavaScript.

---

## 6. Meta / Commerce

### Lo que ya existe (corrige el diagnóstico anterior de "no hay feed")
- **Sí hay feed**: `catalogo/facebook_feed.py`, expuesto en `floreria_cristina/urls.py` como `/feeds/facebook-products.xml` y `/feeds/facebook-products.csv`.
- Verificado en vivo: `https://e-comerce-floreria-production.up.railway.app/feeds/facebook-products.xml` responde **200 con 61 items** bien formados (id, título, descripción, precio en ARS, disponibilidad, link, imagen Cloudinary https, marca, `quantity_to_sell_on_facebook`).
- Pixel `2362234944085088` inicializado en `frontend/app/components/FacebookPixel.tsx`; eventos ViewContent / AddToCart / InitiateCheckout / Purchase en `frontend/utils/fbPixel.ts`.
- Los `content_ids` de ViewContent y AddToCart usan `product.sku || product.id`, y el feed usa `g:id = sku` → **coinciden** en el caso normal (todos los productos del feed tienen SKU).
- `sync_to_social` en `catalogo/api.py` alimenta n8n para publicar posts en IG/FB. Es otra cosa, no es el catálogo.

### Problemas verificados del feed
1. **No es accesible desde el dominio público**: `https://floreriacristina.com.ar/feeds/facebook-products.xml` devuelve **404** (lo sirve Next.js). Sólo funciona la URL de Railway.
2. **Todos los links del feed apuntan a una URL que redirige**: `https://www.floreriacristina.com.ar/productos/{slug}` → **307** hacia `/es/productos/{slug}`. Meta penaliza o rechaza redirecciones en el link del producto.
3. **`g:shipping` declara siempre `0 ARS`**, tenga o no `envio_gratis` el producto (la rama `if/else` pone el mismo valor). El CSV hace lo mismo con `AR::0 ARS`. Se está prometiendo envío gratis en todo el catálogo.
4. La landing del feed no tiene precio ni datos en el HTML (§5), así que el crawler de Meta no puede validar precio/disponibilidad contra la página.
5. Falta `g:sale_price` real cuando hay `precio_descuento`, y no se envía `item_group_id` (necesario si más adelante hay variantes/tamaños).
6. Purchase e InitiateCheckout **no mandan `content_ids` ni `contents`** → el remarketing dinámico no puede cerrar el embudo.
7. No hay **Conversions API**: no existe ninguna llamada server-side a `graph.facebook.com` en el repo. El backend sí tiene `FACEBOOK_PIXEL_ID` configurable por env, pero el frontend lo tiene hardcodeado.

### Pendiente por falta de accesos
El token disponible (app de publicación IG/FB del negocio "Eleonora Sosa", `194451262083331`, página "Florería y Vivero Cristina" `104926018034373`) **no tiene** `catalog_management` ni `ads_read`. Por lo tanto **no está verificado**: si existe un catálogo en Commerce Manager, si tiene una fuente de datos apuntando a este feed, cuántos productos aceptó, errores de diagnóstico, ni a qué activo está asociado el Pixel. No se debe afirmar que el catálogo está conectado hasta obtener un system user token con esos permisos.

---

## 7. Gap analysis contra el backlog del brief

| Pregunta que un agente debe poder responder | Hoy | Falta |
| --- | --- | --- |
| Qué vende la tienda | API pública OK; HTML sin contenido | SSR/JSON-LD, sitemap con productos |
| Precio actual | API OK | No está en el HTML ni en datos estructurados |
| Stock | API OK (`stock`) | Exponerlo como `availability` estructurado |
| Flores y composición | Sólo texto libre | Campos estructurados (migración) |
| Fotos | OK (Cloudinary) | — |
| Variantes / tamaños | **No existe** | Modelo + migración (usuario lo dejó pendiente) |
| Adicionales | OK (`es_adicional`) | Relacionarlos al producto base |
| Zonas y costo de envío | Sólo calculable desde el navegador | **Endpoint server-side por dirección (P0)** |
| Fechas y franjas | Lógica sólo en frontend | Endpoint de disponibilidad |
| Datos de comprador/destinatario, dedicatoria | OK en el checkout real | Contrato documentado |
| Total | Se arma en el cliente | Endpoint de cotización de carrito |
| Métodos de pago | OK | Documentar reglas (efectivo = sólo retiro) |
| Iniciar/terminar checkout programáticamente | Endpoint existe pero indocumentado y sin validaciones | Contrato + validaciones reales |

### Priorización propuesta
**P0 (sin migraciones, alto impacto)**
1. SSR real de la ficha de producto + `generateMetadata` por producto (title, description, canonical, OG) y JSON-LD `Product`/`Offer` usando el `ProductSchema` que ya existe sin usar.
2. Sitemap dinámico con los 66 productos y las categorías.
3. Arreglar el feed de Meta: link a `/es/productos/{slug}` sin `www`→redirect, `g:shipping` real, `sale_price`, y publicarlo en el dominio público (route handler en Next.js que proxee el feed de Django).
4. `content_ids`/`contents` en InitiateCheckout y Purchase; Pixel ID por variable de entorno.
5. Endpoint público de cotización de envío por dirección (server-side Distance Matrix) — habilita agentes y canales.

**P1**
6. Paginación y detalle por slug en la API de catálogo; deprecar `metodos-envio` basura y las rutas legacy/test.
7. Endpoint de disponibilidad (fechas y franjas) con la lógica hoy duplicada en `deliveryPromise.ts`.
8. Documentación de API (OpenAPI) del contrato de checkout real; dejar de mantener `CheckoutSerializer` muerto.
9. Conversions API con deduplicación por `event_id`.

**P2**
10. Campos estructurados de producto (composición, medidas, cuidados) y variantes/tamaños — requieren migración y autorización explícita.
11. Búsqueda real (ranking, sinónimos) en vez de `icontains`.
12. Completar taxonomía (ocasiones y tipo de flor en los 66 productos): trabajo de datos, no de código.

---

## 8. Riesgos y rollback

- **Migraciones**: nada en P0/P1 salvo el punto 10 requiere migración. Cualquier migración se entrega en un PR aislado y reversible.
- **SSR de la ficha**: el riesgo es romper interacciones que hoy dependen de `'use client'`; se mitiga dejando la parte interactiva como componente cliente dentro de una página servidor.
- **Feed**: cambiar los links puede provocar una resincronización completa en Commerce Manager; conviene hacerlo antes de conectar la fuente de datos, no después.
- **Rollback**: cada ítem va en su propio PR sobre `master`; revertir el merge alcanza porque no hay estado persistido nuevo.

## 9. Pendientes bloqueados por accesos

1. System user token de Meta con `catalog_management`, `business_management`, `ads_read` para auditar catálogo, fuente de datos, Pixel y eventos.
2. Confirmar si `www.floreriacristina.com.ar` debe seguir siendo el dominio canónico del feed o si se unifica en el dominio sin `www`.
