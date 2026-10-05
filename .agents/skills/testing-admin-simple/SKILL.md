---
name: testing-admin-simple
description: How to run and UI-test the Django operational panel `/admin-simple/` fully locally (Postgres + Redis containers, superuser, seeded orders, stock/cancel/confirm flows, narrow-viewport checks). Use for any admin_simple or pedidos stock-lifecycle verification. Do NOT test this panel against production.
---

# Testing the `admin_simple` operational panel (local only)

Production login for this panel is broken / has no usable credentials — always test locally.
The storefront (Next.js) is covered by the `testing-storefront` skill; this one is only Django.

## Bring up the environment

```bash
source /home/ubuntu/venv-flor/bin/activate
docker start flor-pg || docker run -d --name flor-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=floreria_cristina_dev -p 5432:5432 postgres:15
docker start flor-redis || docker run -d --name flor-redis -p 6379:6379 redis:7
# Celery/settings resolve the host `redis`; keep `127.0.0.1 redis` in /etc/hosts
export POSTGRES_HOST=localhost POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres SECRET_KEY=local-test-key
python manage.py migrate            # required: a fresh DB has no pedidos_pedido table
python manage.py createsuperuser    # e.g. devinadmin / DevinLocal123 (local-only creds)
setsid nohup python manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 < /dev/null &
```

Login at `http://localhost:8000/admin/login/?next=/admin-simple/`. The panel lives at
`/admin-simple/` (dashboard), `/admin-simple/pedidos/`, `/admin-simple/pedidos/<id>/`,
`/admin-simple/productos/`.

## Seeding controlled orders

Use `manage.py shell` (field examples in `admin_simple/tests.py`). A ready-made script pattern
lives at `/home/ubuntu/seed_admin_simple.py` (not committed). Seed at minimum:
today / tomorrow / overdue `fecha_entrega`; franjas `mañana`, `tarde`, `durante_el_dia`;
one `tipo_envio='retiro'` with `hora_retiro`; one with `regalo_anonimo=True` + `instrucciones`;
one delivered and one cancelled (must be excluded from the agenda filters); one unconfirmed and one
`confirmado=True` order for cancel/stock tests; one order requesting more units than `producto.stock`;
plus ~22 filler orders to get a second pagination page (page size is 20).

Note: confirming an order triggers SMTP/n8n notifications; SMTP fails locally with
`530 Authentication Required` — harmless, the stock transaction still commits.

## What to verify and known traps

- Dashboard "N pendientes / N entregas hoy / N atrasada" must exclude `entregado`/`cancelado`.
  Cancelling an order should decrement the pendientes badge — good cheap regression check.
- Agenda chips are `?entrega=hoy|manana|vencidos`. Verify counts equal row counts.
- Querystring preservation: clicking chips keeps other params, but **the search form may drop the
  active `pago`/`estado` filter** (it re-submits only its own fields). Always check the URL after
  submitting the search, not just the row count.
- The active payment chip may render `bg-orange-500 text-white` with a computed transparent
  background (white text on white) — read computed styles, do not trust the class list.
- Cancelling an **unconfirmed** order must not change stock; verify in `/admin-simple/productos/`
  before and after. The success alert may still say "Stock restaurado" — misleading copy, report it.
- Cancelling a **confirmed** order restores stock once; afterwards the Cancelar/Confirmar buttons
  disappear, so re-cancelling (double restore) is not reachable from the UI.
- Insufficient stock on Confirmar must show the product name and quantities and leave the order
  `recibido` / "No, falta confirmar" with stock unchanged (never negative).
- Detail page must show street+city or "Retira en el local", `get_medio_pago_display`, `hora_retiro`,
  instructions, the yellow anonymous notice, `tel:`/`wa.me` links, and the stock state.

## Narrow-viewport (390x844) testing

Chrome's minimum real window width is ~500 px, so resizing the window cannot reach 390.
Working recipe: press `F12`, click inside the DevTools pane and press `ctrl+shift+d` to dock it,
then `ctrl+shift+m` (focus must be in DevTools, otherwise Chrome opens the profile menu) and set
Dimensions 390 x 844 with zoom 100%. Verify `document.documentElement.scrollWidth === innerWidth`
for horizontal overflow instead of eyeballing it. The panel switches to card rows + a fixed bottom
nav bar; the mobile card may omit details the desktop table shows (e.g. `retiro HH:MM`).

## Devin secrets needed

None — everything is local (Postgres/Redis containers and a locally created superuser).
