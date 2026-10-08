import { OPENING_HOURS_TEXT, SAME_DAY_TEXT } from '@/utils/businessHours';
import { BUSINESS } from '@/utils/businessInfo';
import { SITE_URL } from '@/utils/catalog';
import { RATING, REVIEW_COUNT } from '@/utils/googleProfile';
import { landingPath, SEO_LANDINGS } from '@/utils/seoLandings';

/**
 * `llms.txt` generado a partir de las mismas constantes que usan el JSON-LD, el
 * checkout y las landings, para que horario, corte de entrega, contacto y
 * reseñas no se desincronicen.
 */
export function buildLlmsTxt(): string {
  const landings = SEO_LANDINGS.map((l) => `- ${l.name}: ${SITE_URL}/es${landingPath(l)}`).join('\n');

  return `# ${BUSINESS.name}

> Florería y vivero en ${BUSINESS.locality}, ${BUSINESS.region} (Argentina). Ramos de flores frescas, plantas y arreglos,
> con envío a domicilio en ${BUSINESS.areaServed.join(' y ')}, o retiro en tienda.

## Datos del negocio
- Dirección: ${BUSINESS.streetAddress}, ${BUSINESS.locality}, ${BUSINESS.region}, Argentina
- Horario de atención: ${OPENING_HOURS_TEXT}
- Valoración en Google: ${RATING}/5 con ${REVIEW_COUNT} reseñas
- Teléfono: ${BUSINESS.telephoneDisplay} · WhatsApp: ${BUSINESS.whatsappDisplay}
- Moneda: ARS
- Medios de pago: ${BUSINESS.paymentMethods.join(', ')}
- Zonas de entrega: ${BUSINESS.areaServed.join(' y ')}
- Métodos de entrega: ${BUSINESS.deliveryMethods.join(', ')}
- Entrega el mismo día: ${SAME_DAY_TEXT}
- Cancelaciones y cambios: ${BUSINESS.cancellationPolicy}
- El costo de envío nunca está incluido en el precio del producto: hay que cotizarlo por dirección

## API pública (sin autenticación, respuestas JSON)
- Buscar productos: GET ${SITE_URL}/api/publico/productos?q=ramo%20romantico&precio_max=50000
  Parámetros: q, intencion (romantico, cumpleanos, condolencias, nacimiento), precio_min, precio_max,
  categoria (slug), tipo_flor (nombre), ocasion (nombre), incluir_adicionales, incluir_sin_stock, limit
  Cada producto trae: sku, nombre, descriptor, precio vigente, stock, disponible, categoría, tipo de flor,
  ocasiones, envio_gratis y la URL final de compra.
- Datos de la tienda, zonas y próxima fecha de entrega: GET ${SITE_URL}/api/publico/tienda
  El campo entrega_mismo_dia.proxima_fecha_de_entrega ya descuenta el corte horario y los domingos.
- Cotizar envío: POST ${SITE_URL}/api/publico/envio/cotizar
  Body: {"address": "Av. Aconquija 1500, Yerba Buena", "order_amount": 40000}
  Devuelve costo y disponibilidad de express, programado y retiro en tienda.
- Preparar una compra: POST ${SITE_URL}/api/publico/carrito
  Body: {"sku": "10006", "cantidad": 1}
  No crea el pedido ni cobra: valida stock y devuelve checkout_url, donde la persona confirma
  destinatario, dirección, fecha, dedicatoria, envío y pago.
- Ficha de un producto por SKU: GET ${SITE_URL}/api/publico/productos/10006
- Fechas y franjas disponibles: GET ${SITE_URL}/api/publico/entrega/disponibilidad?fecha=2026-10-05
- Validar un pedido completo sin crear nada: POST ${SITE_URL}/api/publico/pedidos/validar
- Armar un pedido para que la persona confirme: POST ${SITE_URL}/api/publico/pedidos
  Body: {"items": [{"sku": "10006", "cantidad": 1}], "entrega": {"metodo": "express",
  "fecha": "2026-10-05", "franja": "tarde", "direccion": "Av. Aconquija 1500", "ciudad": "Yerba Buena"},
  "destinatario": {"nombre": "...", "telefono": "..."}, "comprador": {"nombre": "...", "email": "...",
  "telefono": "..."}, "tarjeta": {"dedicatoria": "...", "firma": "..."}, "medio_pago": "mercadopago"}
  Precio, envío y total los calcula el servidor: lo que mande el agente se ignora.
  Devuelve confirmar_url (el link que hay que darle a la persona), expira_en y el resumen con el total.
  NO crea el pedido ni reserva stock: el pedido nace cuando la persona abre ese link y confirma.
  Máximo 10 productos por pedido y 5 unidades por producto. Enviar el header Idempotency-Key
  para que un reintento devuelva el mismo link en lugar de duplicarlo.
- Lo mismo sin POST ni JSON (para asistentes que sólo abren URLs):
  GET ${SITE_URL}/api/publico/pedidos/preparar?sku=10006&cantidad=1&metodo=express&fecha=2026-10-05
  &franja=tarde&direccion=Av.+Aconquija+1500&ciudad=Yerba+Buena&destinatario=Ana&destinatario_telefono=3815551234
  &comprador=Daniel&email=daniel@example.com&comprador_telefono=3815559876&dedicatoria=Te+quiero
  Devuelve el mismo confirmar_url. Varios productos: items=10006:2,10007:1
  También funciona en GET ${SITE_URL}/api/publico/pedidos/validar con los mismos parámetros.
- Estado de la solicitud: GET ${SITE_URL}/api/publico/pedidos/solicitud/<token>

La API pública admite cualquier origen (CORS abierto), así que se puede llamar desde el navegador.

## Catálogo
- Catálogo completo: ${SITE_URL}/es/productos
${landings}
- Día de la Madre: ${SITE_URL}/es/dia-de-la-madre
- Zonas y costos de envío: ${SITE_URL}/es/zonas
- Cómo pedir desde un asistente de IA (explicado en texto): ${SITE_URL}/es/pedidos-por-asistentes
- Feed de productos (XML): ${SITE_URL}/feeds/facebook-products.xml
- Feed de productos (CSV): ${SITE_URL}/feeds/facebook-products.csv
- Sitemap: ${SITE_URL}/sitemap.xml
- Cada ficha de producto trae JSON-LD \`Product\` + \`Offer\` con precio, SKU y disponibilidad.

## Compra
La compra se completa en el sitio: ${SITE_URL}/es
Un agente nunca puede pagar ni confirmar un pedido: arma la solicitud, le muestra a la persona el resumen
con el total y le pasa confirmar_url para que confirme y pague desde su navegador.
También se puede pedir por WhatsApp ${BUSINESS.whatsappDisplay}.
`;
}
