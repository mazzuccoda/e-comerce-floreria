# Sistema de Detección de Carritos Abandonados - Frontend

## 📋 Descripción

El sistema de detección de carritos abandonados en el frontend captura automáticamente los carritos de usuarios que ingresan sus datos de contacto pero no completan la compra.

## 🔧 Implementación

### Hook: `useAbandonedCart`

**Ubicación:** `frontend/app/hooks/useAbandonedCart.ts`

**Funcionamiento:**

1. **Inicio del Timer:**
   - Se activa cuando el usuario ingresa su teléfono en el checkout
   - Inicia un timer de **5 minutos**
   - Solo si hay items en el carrito

2. **Registro Automático:**
   - Si pasan 5 minutos sin completar la compra
   - Se envía un POST a `/api/pedidos/carrito-abandonado/`
   - Incluye: teléfono, nombre, email, items del carrito, total

3. **Cancelación del Timer:**
   - Si el usuario completa la compra exitosamente
   - Si el carrito se vacía
   - Si el usuario cierra la página (el timer se pierde)

4. **Prevención de Duplicados:**
   - Guarda en `localStorage` cuando se registra un carrito
   - No registra el mismo teléfono si fue hace menos de 24 horas

### Integración en Checkout

**Archivo:** `frontend/app/checkout/multistep/page.tsx`

```typescript
// Hook para detectar carritos abandonados
useAbandonedCart(
  formData.telefono,      // Teléfono del usuario
  formData.nombre,        // Nombre del usuario
  formData.email,         // Email del usuario
  directCart.items,       // Items del carrito
  directCart.total_price, // Total del carrito
  isCheckoutCompleted     // Flag de checkout completado
);
```

**Estado de Checkout Completado:**

```typescript
const [isCheckoutCompleted, setIsCheckoutCompleted] = useState(false);

// Cuando se crea exitosamente el pedido:
if (response.ok) {
  setIsCheckoutCompleted(true); // Cancela el timer
  // ... resto del código
}
```

## 📊 Flujo de Usuario

```
1. Usuario agrega productos al carrito
2. Usuario va al checkout
3. Usuario ingresa su teléfono
   ⏰ Timer de 5 minutos inicia
4a. Usuario completa la compra
    ✅ Timer se cancela
    ✅ No se registra carrito abandonado
4b. Usuario abandona (pasan 5 minutos)
    📦 Se registra carrito abandonado
    📱 n8n workflow envía WhatsApp después de 1 hora
```

## 🔒 Prevención de Duplicados

**localStorage Key:** `abandoned_cart_registered`

```json
{
  "telefono": "3813671352",
  "timestamp": 1706000000000,
  "carrito_id": 7
}
```

- Si el mismo teléfono fue registrado hace menos de 24 horas, no se registra nuevamente
- Se limpia cuando el checkout se completa exitosamente

## ⚙️ Configuración

**Variables en el hook:**

```typescript
const TIMEOUT_MINUTES = 5;  // Tiempo antes de registrar (5 minutos)
const API_KEY = 'floreria_cristina_2025';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
```

## 🧪 Testing

### Probar el sistema:

1. **Agregar productos al carrito**
2. **Ir al checkout**
3. **Ingresar teléfono** (paso de Remitente)
4. **Esperar 5 minutos** sin completar la compra
5. **Verificar en Django Admin** que se creó el carrito abandonado
6. **Esperar 1 hora** (o ejecutar workflow manualmente en n8n)
7. **Verificar WhatsApp** que llegó el mensaje

### Verificar en consola del navegador:

```
⏰ Timer iniciado: 5 minutos para registrar carrito abandonado
📦 Registrando carrito abandonado: {...}
✅ Carrito abandonado registrado: {...}
```

### Verificar cancelación:

```
✅ Checkout completado, cancelando timer de carrito abandonado
```

## 📱 Integración con n8n

El workflow de n8n (`Carrito Abandonado - Recovery`) se ejecuta cada hora y:

1. Lista carritos pendientes (creados hace más de 1 hora)
2. Filtra los que no tienen recordatorio enviado
3. Envía mensaje de WhatsApp
4. Marca como "recordatorio enviado" en Django

## 🎯 Mejoras Futuras

- [ ] Agregar analytics para trackear tasa de abandono
- [ ] Implementar A/B testing de tiempos (3 min vs 5 min vs 10 min)
- [ ] Enviar email además de WhatsApp
- [ ] Personalizar mensaje según productos en el carrito
- [ ] Ofrecer descuento en el mensaje de recuperación
- [ ] Implementar segundo recordatorio después de 24 horas

## 🐛 Troubleshooting

**Problema:** El timer no se inicia
- Verificar que `formData.telefono` tenga valor
- Verificar que `directCart.items.length > 0`
- Revisar consola del navegador

**Problema:** Se registran duplicados
- Verificar localStorage: `abandoned_cart_registered`
- Limpiar localStorage si es necesario

**Problema:** No llegan los mensajes de WhatsApp
- Verificar que el workflow de n8n esté activo
- Verificar que el número tenga formato correcto (549...)
- Verificar que el número exista en WhatsApp

## 📝 Notas Importantes

- El timer se pierde si el usuario cierra la pestaña (es intencional)
- Solo se registra cuando hay teléfono ingresado (intención real de compra)
- El sistema no afecta la performance del checkout
- Los datos se envían de forma asíncrona, no bloquean la UI
