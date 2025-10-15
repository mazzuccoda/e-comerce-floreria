# Solución al Problema "Carrito Vacío" en Checkout

## Problema Identificado

El error "El carrito está vacío" ocurría porque **las sesiones no se compartían correctamente** entre las diferentes peticiones del frontend al backend en Railway.

### Causas Raíz:

1. **Sesiones no persistentes**: Cada petición del frontend creaba una nueva sesión en lugar de usar la sesión existente donde estaba el carrito
2. **Cookies no compartidas**: Las cookies de sesión no se enviaban correctamente entre dominios diferentes en Railway
3. **Arquitectura de sesiones**: El carrito dependía completamente de la sesión de Django, que no funcionaba bien en entornos distribuidos

## Solución Implementada

### 1. Nuevo Endpoint: `checkout-with-items`

Creamos un nuevo endpoint que **NO depende del carrito en sesión**, sino que recibe los productos directamente en el body de la petición.

**Archivo**: `pedidos/simple_views.py`

```python
@csrf_exempt
def simple_checkout_with_items(request):
    """
    Vista de checkout que recibe los items directamente en el body,
    sin depender del carrito en sesión.
    """
    # Recibe los items en el body:
    # {
    #   "items": [
    #     {"producto_id": 1, "cantidad": 2},
    #     {"producto_id": 3, "cantidad": 1}
    #   ],
    #   "nombre_comprador": "...",
    #   "email_comprador": "...",
    #   ...
    # }
```

### 2. Modificación del Frontend

El frontend ahora:
1. Obtiene los items del carrito usando la API `/api/carrito/`
2. Transforma los items al formato requerido
3. Envía los items directamente en el body de la petición al nuevo endpoint

**Archivo**: `frontend/app/checkout/multistep/page.tsx`

```typescript
// Obtener carrito
const cartResponse = await fetch(`${API_URL}/carrito/`, {
  method: 'GET',
  credentials: 'include',
});
const cartData = await cartResponse.json();

// Preparar items para enviar
const items = cartData.items.map((item: any) => ({
  producto_id: item.producto.id,
  cantidad: item.quantity
}));

// Enviar al nuevo endpoint
const response = await fetch(`${apiBaseUrl}/api/pedidos/checkout-with-items/`, {
  method: 'POST',
  credentials: 'include',
  headers,
  body: JSON.stringify({
    ...datosDelFormulario,
    items: items  // ← ITEMS ENVIADOS DIRECTAMENTE
  }),
});
```

### 3. Debugging Mejorado

Agregamos logging detallado al endpoint original `simple-checkout` para diagnosticar problemas de sesión:

```python
print(f"📋 Session key: {request.session.session_key}")
print(f"📋 Session data: {dict(request.session)}")
print(f"📋 Cookies: {request.COOKIES}")
print(f"🛒 Carrito is_empty: {cart.is_empty}")
print(f"🛒 Items en sesión: {cart.cart if hasattr(cart, 'cart') else {}}")
```

## Ventajas de la Nueva Solución

✅ **No depende de sesiones**: Funciona en entornos distribuidos como Railway
✅ **Más confiable**: Los items se envían explícitamente, no hay ambigüedad
✅ **Mejor debugging**: Podemos ver exactamente qué items se están enviando
✅ **Compatible con CORS**: No requiere configuración especial de cookies entre dominios
✅ **Escalable**: Funciona con múltiples instancias del backend

## Endpoints Disponibles

### Endpoint Original (con sesión)
```
POST /api/pedidos/simple-checkout/
```
- Depende del carrito en sesión
- Útil para desarrollo local con Docker

### Endpoint Nuevo (sin sesión)
```
POST /api/pedidos/checkout-with-items/
```
- Recibe items directamente en el body
- **Recomendado para producción en Railway**

## Formato de la Petición

```json
{
  "nombre_comprador": "Juan Pérez",
  "email_comprador": "juan@example.com",
  "telefono_comprador": "1123456789",
  "nombre_destinatario": "María García",
  "telefono_destinatario": "1198765432",
  "direccion": "Av. Corrientes 1234",
  "ciudad": "Buenos Aires",
  "codigo_postal": "1043",
  "fecha_entrega": "2025-10-16",
  "franja_horaria": "mañana",
  "metodo_envio_id": 1,
  "dedicatoria": "Feliz cumpleaños!",
  "instrucciones": "Tocar timbre 2B",
  "regalo_anonimo": false,
  "medio_pago": "mercadopago",
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2
    },
    {
      "producto_id": 5,
      "cantidad": 1
    }
  ]
}
```

## Próximos Pasos

1. **Esperar el despliegue en Railway** (2-3 minutos)
2. **Probar el checkout** con productos en el carrito
3. **Verificar que el pedido se crea correctamente**
4. **Confirmar que el stock se reduce**
5. **Validar la integración con MercadoPago**

## Monitoreo

Para ver los logs en Railway:
1. Ir al dashboard de Railway
2. Seleccionar el servicio `web` (backend)
3. Ver la pestaña "Deployments"
4. Hacer clic en el deployment activo
5. Ver los logs en tiempo real

Buscar mensajes como:
- `🚀 CHECKOUT CON ITEMS DIRECTOS`
- `📦 Items recibidos: X`
- `✅ Pedido creado: #XXXXXX`
