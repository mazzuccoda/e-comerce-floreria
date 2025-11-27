# 🅿️ Guía de Integración PayPal - Florería Cristina

## ✅ Integración Completada

La integración de PayPal ha sido implementada exitosamente con las siguientes características:

- ✅ Pago en USD con conversión automática ARS → USD
- ✅ Cotización oficial del dólar + 15% de margen
- ✅ Servicio de conversión con caché
- ✅ Flujo completo de pago y redirección
- ✅ Compatible con MercadoPago y Transferencia (sin modificar código existente)

---

## 📁 Archivos Creados/Modificados

### Backend
```
✅ pedidos/currency_service.py          [NUEVO] - Servicio de conversión ARS→USD
✅ pedidos/paypal_service.py            [NUEVO] - Servicio de integración PayPal
✅ pedidos/payment_views.py             [MODIFICADO] - Agregadas 3 vistas PayPal
✅ pedidos/api_urls.py                  [MODIFICADO] - Agregadas 3 URLs PayPal
✅ floreria_cristina/settings.py        [MODIFICADO] - Configuración PayPal
✅ requirements.txt                     [MODIFICADO] - Agregado paypalrestsdk
```

### Frontend
```
✅ frontend/app/checkout/multistep/page.tsx  [MODIFICADO] - Lógica de pago PayPal
```

### Documentación
```
✅ .env.example                         [MODIFICADO] - Variables PayPal
✅ PAYPAL_INTEGRATION_GUIDE.md          [NUEVO] - Esta guía
```

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# PayPal Configuration
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=ASoiqHv3dn1IyHAt_eZPe-XYxRv3uk9t90KPc89pUfjVyWkwdeZqaXLowOIBx_Pt0L-fhDTN-rSbY2s9
PAYPAL_CLIENT_SECRET=tu_secret_key_aqui
USD_EXCHANGE_MARGIN=1.15
```

**IMPORTANTE**: Reemplaza `tu_secret_key_aqui` con tu Secret Key real de PayPal (haz clic en el ícono del ojo en el dashboard de PayPal para revelarla).

### 2. Variables en Railway (Producción)

En tu proyecto de Railway, agrega las mismas variables:

1. Ve a tu proyecto en Railway
2. Click en "Variables"
3. Agrega:
   - `PAYPAL_MODE=live`
   - `PAYPAL_CLIENT_ID=ASoiqHv3dn1IyHAt_eZPe-XYxRv3uk9t90KPc89pUfjVyWkwdeZqaXLowOIBx_Pt0L-fhDTN-rSbY2s9`
   - `PAYPAL_CLIENT_SECRET=tu_secret_produccion`
   - `USD_EXCHANGE_MARGIN=1.15`

---

## 🚀 Instalación de Dependencias

### Backend

```bash
# Instalar nueva dependencia de PayPal
pip install paypalrestsdk==1.13.1

# O instalar todas las dependencias
pip install -r requirements.txt
```

---

## 💱 Sistema de Conversión de Moneda

### Funcionamiento

1. **Obtención de Cotización**:
   - API Principal: BCRA (Banco Central de Argentina)
   - API Fallback: DolarAPI.com
   - Caché: 1 hora

2. **Fórmula de Conversión**:
   ```
   Precio_USD = (Precio_ARS / Cotización_Oficial) * 1.15
   ```

3. **Ejemplo**:
   ```
   Producto: $10,000 ARS
   Cotización oficial: $1,000 ARS/USD
   Margen: 15%
   
   Cálculo:
   - Tasa efectiva: 1,000 * 1.15 = 1,150 ARS/USD
   - Precio USD: 10,000 / 1,150 = $8.70 USD
   ```

### APIs Utilizadas

- **BCRA**: `https://api.estadisticasbcra.com/usd_of`
- **DolarAPI**: `https://dolarapi.com/v1/dolares/oficial`

---

## 🔄 Flujo de Pago PayPal

```
1. Usuario selecciona "PayPal" en checkout
   ↓
2. Frontend crea pedido (en ARS)
   ↓
3. Backend:
   - Obtiene cotización USD del día
   - Convierte total a USD (+15%)
   - Crea orden PayPal en USD
   ↓
4. Usuario es redirigido a PayPal
   ↓
5. Usuario aprueba pago en USD
   ↓
6. PayPal redirige a backend
   ↓
7. Backend:
   - Ejecuta el pago
   - Actualiza estado del pedido
   - Redirige a frontend con éxito
```

---

## 🌐 Endpoints API

### PayPal

```
POST   /api/pedidos/{pedido_id}/payment/paypal/
GET    /api/pedidos/{pedido_id}/payment/paypal/success/
GET    /api/pedidos/{pedido_id}/payment/paypal/cancel/
```

### MercadoPago (sin cambios)

```
POST   /api/pedidos/{pedido_id}/payment/
GET    /api/pedidos/{pedido_id}/payment/success/
GET    /api/pedidos/{pedido_id}/payment/failure/
GET    /api/pedidos/{pedido_id}/payment/pending/
POST   /api/pedidos/webhook/mercadopago/
```

---

## 🧪 Pruebas

### Desarrollo (Sandbox)

1. Cambia a modo sandbox en `.env`:
   ```bash
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=tu_sandbox_client_id
   PAYPAL_CLIENT_SECRET=tu_sandbox_secret
   ```

2. Usa cuentas de prueba de PayPal Sandbox

3. Realiza un pedido de prueba

### Producción

1. Verifica que las variables estén en modo `live`

2. Realiza un pedido de prueba con monto bajo

3. Verifica el flujo completo:
   - Creación de pedido
   - Conversión USD
   - Redirección a PayPal
   - Pago exitoso
   - Actualización de estado

---

## 📊 Métodos de Pago Disponibles

| Método | Moneda | Conversión | Estado |
|--------|--------|------------|--------|
| **MercadoPago** | ARS | No | ✅ Funcionando |
| **PayPal** | USD | Sí (+15%) | ✅ Integrado |
| **Transferencia** | ARS | No | ✅ Funcionando |
| **Efectivo** | ARS | No | ✅ Funcionando |

---

## 🔍 Debugging

### Logs Importantes

El sistema genera logs detallados:

```python
# Conversión de moneda
logger.info(f"💱 Conversión: ${amount_ars} ARS → ${amount_usd} USD")

# Creación de pago
logger.info(f"💳 Creando pago PayPal para pedido #{pedido_id}")

# Ejecución de pago
logger.info(f"✅ Pago ejecutado exitosamente: {payment_id}")
```

### Verificar Cotización

Puedes probar la API de cotización directamente:

```bash
# BCRA
curl https://api.estadisticasbcra.com/usd_of

# DolarAPI
curl https://dolarapi.com/v1/dolares/oficial
```

---

## ⚠️ Consideraciones Importantes

### Seguridad

- ✅ Nunca commitear credenciales en el código
- ✅ Usar variables de entorno
- ✅ Rotar Secret Keys regularmente

### Moneda

- ✅ PayPal procesa en USD
- ✅ Conversión automática con margen del 15%
- ✅ Cotización actualizada cada hora

### Comisiones

- **PayPal**: ~5.4% + tarifa fija
- **MercadoPago**: ~3-5%
- **Transferencia**: 0%

### Monto Mínimo

- PayPal requiere mínimo $0.01 USD
- El sistema valida automáticamente

---

## 📞 Soporte

### Errores Comunes

1. **"No se pudo obtener cotización"**
   - Verificar conectividad a internet
   - APIs de cotización pueden estar caídas
   - Se usa cotización de emergencia: $1,050 ARS/USD

2. **"Error al crear pago PayPal"**
   - Verificar credenciales en `.env`
   - Verificar modo (sandbox vs live)
   - Revisar logs del backend

3. **"Pago no se ejecuta"**
   - Verificar que las URLs de retorno sean correctas
   - Verificar que el backend sea accesible desde internet

### Contacto PayPal

- Dashboard: https://developer.paypal.com/
- Documentación: https://developer.paypal.com/docs/
- Soporte: https://www.paypal.com/ar/smarthelp/contact-us

---

## 🎯 Próximos Pasos

### Opcional - Mejoras Futuras

1. **Webhook de PayPal**
   - Recibir notificaciones de pago
   - Actualizar estado automáticamente

2. **Historial de Conversión**
   - Guardar tasa de cambio usada en cada pedido
   - Reportes de conversión

3. **Múltiples Monedas**
   - Agregar soporte para EUR, BRL, etc.

4. **Dashboard de Pagos**
   - Panel admin con estadísticas de pagos
   - Comparación MercadoPago vs PayPal

---

## ✅ Checklist de Deploy

Antes de hacer deploy a producción:

```
☐ Variables de entorno configuradas en Railway
☐ Credenciales de producción de PayPal
☐ PAYPAL_MODE=live
☐ Dependencias instaladas (pip install -r requirements.txt)
☐ Prueba de conversión USD funcionando
☐ Prueba de pago completo en sandbox
☐ Verificar URLs de retorno correctas
☐ Logs de backend funcionando
☐ Frontend muestra opción PayPal
☐ MercadoPago sigue funcionando
☐ Transferencia sigue funcionando
```

---

## 📝 Notas Finales

- La integración NO modifica el código existente de MercadoPago ni Transferencia
- Todos los cambios son aditivos (nuevos archivos y bloques condicionales)
- El sistema es retrocompatible
- La conversión USD es transparente para el usuario
- Se muestra el monto en USD antes de redirigir a PayPal

---

**Fecha de Integración**: Noviembre 2025  
**Versión**: 1.0  
**Estado**: ✅ Producción Ready
