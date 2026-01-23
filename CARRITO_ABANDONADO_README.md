# 🛒 Sistema de Recuperación de Carritos Abandonados - WhatsApp

Sistema completo para detectar, trackear y recuperar carritos abandonados mediante mensajes automáticos de WhatsApp.

---

## 📋 Componentes del Sistema

### 1. **Backend Django** ✅
- Modelo `CarritoAbandonado` para tracking
- 4 endpoints REST API
- Admin panel para visualización

### 2. **Workflow n8n** ✅
- Cron cada 1 hora
- Envío automático de WhatsApp
- Tracking de recordatorios enviados

### 3. **Frontend Next.js** (pendiente)
- Detección de abandono en checkout
- Registro automático vía API

---

## 🚀 Endpoints Disponibles

### 1. Registrar Carrito Abandonado
```http
POST /api/pedidos/carrito-abandonado/
Content-Type: application/json

{
  "telefono": "3813671352",
  "email": "cliente@example.com",
  "nombre": "Juan Pérez",
  "items": [
    {
      "nombre": "Ramo de Rosas",
      "cantidad": 1,
      "precio": "15000"
    }
  ],
  "total": "15000"
}
```

**Response:**
```json
{
  "success": true,
  "carrito_id": 123,
  "mensaje": "Carrito registrado para seguimiento"
}
```

---

### 2. Listar Carritos Pendientes (n8n)
```http
GET /api/pedidos/carritos-pendientes?horas=1
X-API-Key: floreria_cristina_2025
```

**Response:**
```json
[
  {
    "id": 123,
    "telefono": "3813671352",
    "nombre": "Juan Pérez",
    "email": "cliente@example.com",
    "total": "15000.00",
    "items": [...],
    "creado": "2026-01-22T20:00:00Z"
  }
]
```

---

### 3. Marcar Recordatorio Enviado (n8n)
```http
POST /api/pedidos/carrito-abandonado/123/recordatorio-enviado/
X-API-Key: floreria_cristina_2025
```

---

### 4. Marcar Carrito Recuperado
```http
POST /api/pedidos/carrito-abandonado/123/recuperado/
Content-Type: application/json

{
  "pedido_id": 456
}
```

---

## 🧪 Cómo Probar el Sistema

### Opción 1: Script de Prueba Python

1. **Editar el script** `test_carrito_abandonado.py`:
   ```python
   # Cambiar el teléfono por tu número de prueba
   "telefono": "3813671352"  # ⚠️ TU NÚMERO AQUÍ
   ```

2. **Ejecutar:**
   ```bash
   cd e-comerce-fresh
   python test_carrito_abandonado.py
   ```

3. **Ir a n8n** y ejecutar manualmente el workflow "Carrito Abandonado - Recovery"

4. **Verificar** que llegue el WhatsApp

---

### Opción 2: cURL Manual

```bash
curl -X POST https://e-comerce-floreria-production.up.railway.app/api/pedidos/carrito-abandonado/ \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "3813671352",
    "email": "test@example.com",
    "nombre": "Test Usuario",
    "items": [
      {"nombre": "Ramo de Rosas", "cantidad": 1, "precio": "15000"}
    ],
    "total": "15000"
  }'
```

---

### Opción 3: Admin de Django

1. Ir a: `https://e-comerce-floreria-production.up.railway.app/admin/`
2. Login con tu usuario admin
3. Ir a **Pedidos → Carritos Abandonados**
4. Verificar que aparezca el carrito creado
5. Esperar 1 hora o ejecutar workflow n8n manualmente

---

## 🔄 Flujo Completo del Sistema

```
1. Usuario llega al checkout
   ↓
2. Completa datos (teléfono, email, items)
   ↓
3. Abandona sin completar compra
   ↓
4. Frontend detecta abandono (beforeunload o timeout)
   ↓
5. Frontend llama POST /api/pedidos/carrito-abandonado/
   ↓
6. Django crea registro en BD
   ↓
7. n8n ejecuta cada 1 hora (cron)
   ↓
8. n8n consulta GET /api/pedidos/carritos-pendientes?horas=1
   ↓
9. Por cada carrito:
   - Genera mensaje personalizado
   - Envía WhatsApp vía Evolution API
   - Marca como enviado POST /recordatorio-enviado/
   ↓
10. Usuario recibe WhatsApp con link al checkout
    ↓
11. Si completa compra → marcar como recuperado
```

---

## 📊 Visualización en Admin Django

El admin muestra:
- ✅ **Recuperado** - El usuario completó la compra
- 📨 **Recordatorio enviado** - WhatsApp enviado, esperando respuesta
- ⏳ **Pendiente** - Esperando que n8n procese

**Campos visibles:**
- ID del carrito
- Teléfono y nombre del cliente
- Total del carrito
- Items (lista detallada)
- Fechas de creación y recordatorio
- Pedido asociado (si se recuperó)

---

## ⚙️ Configuración del Workflow n8n

### Nodos configurados:

1. **Schedule Trigger** - Cada 1 hora (`0 * * * *`)
2. **HTTP Request** - GET carritos pendientes
3. **IF** - Verificar si hay carritos (`{{$json.length}} > 0`)
4. **Loop Over Items** - Procesar de a 5
5. **Code in JavaScript** - Generar mensaje personalizado
6. **HTTP Request1** - Enviar WhatsApp (Evolution API)
7. **HTTP Request2** - Marcar recordatorio enviado
8. **Wait** - 2 segundos entre mensajes
9. **Loop** - Volver a Loop Over Items

### Variables de entorno requeridas en n8n:

```bash
N8N_API_KEY=floreria_cristina_2025
EVOLUTION_API_URL=https://evolution-api-production-7ee4.up.railway.app
EVOLUTION_API_KEY=tu_api_key_evolution
```

---

## 🎯 Próximos Pasos

### 1. Integración con Frontend Next.js

Agregar en la página de checkout (`/checkout`):

```javascript
// hooks/useAbandonedCart.js
import { useEffect } from 'react';

export function useAbandonedCart(cartData) {
  useEffect(() => {
    // Detectar abandono al salir de la página
    const handleBeforeUnload = () => {
      if (cartData.items.length > 0 && cartData.telefono) {
        // Enviar carrito abandonado
        fetch('/api/pedidos/carrito-abandonado/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono: cartData.telefono,
            email: cartData.email,
            nombre: cartData.nombre,
            items: cartData.items,
            total: cartData.total
          }),
          keepalive: true // Importante para que se envíe al cerrar
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cartData]);
}
```

**Uso en checkout:**
```javascript
// pages/checkout.js
import { useAbandonedCart } from '@/hooks/useAbandonedCart';

export default function Checkout() {
  const [formData, setFormData] = useState({
    telefono: '',
    email: '',
    nombre: '',
    items: [],
    total: 0
  });

  // Activar tracking de abandono
  useAbandonedCart(formData);

  // ... resto del componente
}
```

---

### 2. Marcar como Recuperado

Cuando el usuario completa la compra, llamar:

```javascript
// Después de crear el pedido exitosamente
if (carritoAbandonadoId) {
  await fetch(`/api/pedidos/carrito-abandonado/${carritoAbandonadoId}/recuperado/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pedido_id: nuevoPedidoId })
  });
}
```

---

### 3. Métricas y Análisis

Agregar queries para medir efectividad:

```python
# En Django admin o dashboard
from pedidos.models import CarritoAbandonado
from django.db.models import Count, Sum

# Tasa de recuperación
total = CarritoAbandonado.objects.count()
recuperados = CarritoAbandonado.objects.filter(recuperado=True).count()
tasa_recuperacion = (recuperados / total * 100) if total > 0 else 0

# Ingresos recuperados
ingresos = CarritoAbandonado.objects.filter(
    recuperado=True
).aggregate(Sum('total'))['total__sum']

print(f"Tasa de recuperación: {tasa_recuperacion:.2f}%")
print(f"Ingresos recuperados: ${ingresos}")
```

---

## 🐛 Troubleshooting

### El workflow n8n no envía mensajes

1. Verificar que el workflow esté **Activo** (toggle verde)
2. Ejecutar manualmente para ver errores
3. Verificar variables de entorno en Railway
4. Revisar logs de n8n en Railway

### No llegan los WhatsApp

1. Verificar que Evolution API esté corriendo
2. Verificar formato del teléfono (debe ser `549...`)
3. Revisar logs del nodo HTTP Request1 en n8n
4. Probar envío manual desde Evolution API

### El carrito no se marca como enviado

1. Verificar que el nodo HTTP Request2 esté conectado
2. Verificar que la API key sea correcta
3. Revisar logs en Django (Railway)

---

## 📈 Mejoras Futuras

- [ ] Múltiples recordatorios (1h, 24h, 48h)
- [ ] Segmentación por monto del carrito
- [ ] A/B testing de mensajes
- [ ] Cupones de descuento en el recordatorio
- [ ] Integración con analytics (Google Analytics, Mixpanel)
- [ ] Dashboard de métricas en tiempo real
- [ ] Respuestas automáticas vía WhatsApp (chatbot)

---

## 📞 Soporte

Si tenés problemas:
1. Revisar logs en Railway (Django y n8n)
2. Ejecutar `test_carrito_abandonado.py` para debugging
3. Verificar que todos los servicios estén corriendo

---

**Última actualización:** 22 de enero de 2026
**Versión:** 1.0.0 MVP
