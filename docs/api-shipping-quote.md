# Cotización de envío por dirección

`POST /api/pedidos/shipping/quote/` (público)

Resuelve una dirección a coordenadas en el servidor, mide la distancia hasta la tienda y
devuelve el costo de cada método con las zonas ya configuradas en el admin. Reemplaza al
cálculo que sólo existía en el navegador (Google Maps JS), de modo que un agente, n8n o
WhatsApp puedan cotizar sin abrir la web.

## Request

```json
{
  "address": "Av. Aconquija 1234, Yerba Buena",
  "shipping_method": "express",
  "order_amount": 45000,
  "cart_items": [{"producto_id": 12, "quantity": 1}]
}
```

- `address`: dirección libre; se le agrega "Tucumán, Argentina" si no lo trae.
- `lat` + `lng`: alternativa a `address` cuando ya se conocen las coordenadas.
- `shipping_method` (opcional): `express` o `programado`. Si se omite se cotizan los dos.
- `order_amount` y `cart_items` (opcionales): sólo se usan para decidir si aplica envío gratis.

## Response

```json
{
  "address": {"query": "...", "resolved": "...", "lat": -26.81, "lng": -65.30, "source": "google_geocoding"},
  "distance_km": 2.4,
  "distance_source": "google_distance_matrix",
  "delivers_here": true,
  "options": [
    {
      "shipping_method": "express",
      "available": true,
      "zone_name": "Yerba Buena Centro",
      "distance_km": 2.4,
      "base_price": 7000.0,
      "shipping_cost": 7000,
      "currency": "ARS",
      "is_free_shipping": false,
      "free_shipping_reason": null,
      "free_shipping_threshold": null
    },
    {"shipping_method": "retiro", "available": true, "shipping_cost": 0, "pickup_address": "Solano Vera 480", "pickup_hours": "9:00 a 20:00 hs"}
  ],
  "store": {"name": "Florería Cristina", "address": "Solano Vera 480", "lat": -26.81, "lng": -65.30}
}
```

Si la dirección queda fuera de las zonas activas, el método vuelve con
`"available": false` y `reason`, y el retiro en tienda siempre se ofrece.

Códigos: `400` falta dirección o método inválido, `404` dirección no encontrada,
`503` sin configuración de envíos o servicio de geocoding caído.

## Envío gratis

Sólo se declara gratis cuando **todos** los productos del carrito tienen `envio_gratis`,
o cuando el monto supera el `free_shipping_threshold` de una `ShippingPricingRule` activa.
No hay envío gratis universal.

## Configuración

`GOOGLE_MAPS_API_KEY` (variable de entorno, opcional). Con key se usa Geocoding API y —si
`ShippingConfig.use_distance_matrix` está activo— distancia por calle con Distance Matrix.
Sin key se usa Nominatim (OpenStreetMap) y distancia en línea recta multiplicada por 1,3;
en ese caso `distance_source` vuelve como `estimada_linea_recta`.
