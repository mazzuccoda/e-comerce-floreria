# API pública para agentes de compra

Contrato estable, sin autenticación y sólo de lectura, pensado para que un agente
(ChatGPT, Gemini, Perplexity, un bot de WhatsApp) pueda recomendar y cotizar sin navegador.

Base: `https://floreriacristina.com.ar/api/publico`

Las rutas se declaran **con y sin barra final**, así un `POST` no cae en el 308 de `APPEND_SLASH`.
`robots.txt` permite explícitamente `/api/publico/`; el resto de `/api/` sigue bloqueado.
El índice legible para modelos está en `https://floreriacristina.com.ar/llms.txt`.

## GET /productos

Búsqueda en lenguaje natural sobre el catálogo publicado.

| Param | Descripción |
|---|---|
| `q` | Consulta libre; se normaliza sin acentos y se detecta intención (`romantico`, `cumpleanos`, `condolencias`, `nacimiento`) |
| `precio_min`, `precio_max` | En ARS, sobre el precio vigente |
| `categoria` | Slug de categoría |
| `ocasion` | Nombre de ocasión |
| `incluir_adicionales` | Por defecto `false` (tazas, globos, chocolates quedan fuera) |
| `incluir_sin_stock` | Por defecto `false` |
| `limit` | Hasta 50, por defecto 20 |

Reglas de negocio aplicadas:

- Sólo productos activos con precio mayor a cero.
- Una consulta romántica, de cumpleaños o de nacimiento **nunca** devuelve arreglos fúnebres.
- Los nombres se devuelven sin emojis.
- El precio **no** incluye envío: se cotiza aparte.

```json
{
  "consulta": "ramo romantico",
  "intencion": "romantico",
  "total": 3,
  "productos": [
    {
      "sku": "RAM-012",
      "nombre": "Rosas del Alba",
      "precio": 40000,
      "moneda": "ARS",
      "disponible": true,
      "url": "https://floreriacristina.com.ar/es/productos/rosas-del-alba"
    }
  ]
}
```

## GET /tienda

Datos operativos que un agente necesita antes de recomendar: dirección, coordenadas, horario,
teléfono/WhatsApp, zonas de entrega, métodos de entrega, medios de pago, zonas de envío activas
y políticas (cancelación hasta 24 hs antes, tarjeta escrita a mano, envío gratis sólo por producto
marcado o por monto mínimo).

## POST /envio/cotizar

Mismo servicio que usa el checkout. Body mínimo:

```json
{ "address": "Av. Aconquija 1500, Yerba Buena", "order_amount": 40000 }
```

Devuelve distancia, si se entrega en esa dirección y las opciones `express`, `programado` y
`retiro` con su costo real. Sin `GOOGLE_MAPS_API_KEY` en el servidor la distancia es estimada
(línea recta × 1,3) y se informa en `distance_source`.

## Pendiente

No hay horario de corte publicado, así que la API **no afirma** entrega el mismo día: un agente
sólo puede ofrecer el método express, no garantizar "hoy". Falta el dato operativo del negocio.
