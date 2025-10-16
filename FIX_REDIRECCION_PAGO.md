# 🔧 Fix: Redirección de Pago a Página de Confirmación

## 🐛 Problema Identificado

Después de completar el pago en MercadoPago, la aplicación intenta redirigir a:
```
https://e-comerce-floreria-production.up.railway.app/api/checkout/success
```

Pero esta URL da **404 Not Found** porque:
1. Está apuntando al **backend** en lugar del **frontend**
2. La variable `FRONTEND_URL` no está configurada en Railway
3. El código usa un valor por defecto incorrecto

---

## ✅ Solución

### **Paso 1: Agregar Variable de Entorno en Railway**

1. **Ve a Railway Dashboard**: https://railway.app/
2. **Selecciona tu proyecto**: e-comerce-floreria-production
3. **Haz clic en el servicio "Backend"**
4. **Ve a "Settings" → "Variables"**
5. **Agrega esta nueva variable:**

```bash
FRONTEND_URL=https://floreriayviverocristian.up.railway.app
```

6. **Guarda los cambios**
7. **Railway hará redeploy automáticamente** (espera 2-3 minutos)

---

### **Paso 2: Verificar que Funcione**

Una vez que termine el deploy:

1. **Haz un nuevo pedido de prueba**
2. **Completa el pago en MercadoPago**
3. **Deberías ser redirigido a:**
   ```
   https://floreriayviverocristian.up.railway.app/checkout/success?pedido=XX&payment=success
   ```

---

## 📋 Explicación Técnica

### **Código Afectado:**

**Archivo:** `pedidos/payment_views.py`

**Líneas 165, 174, 192, 200, 218, 226:**
```python
frontend_url = os.getenv('FRONTEND_URL', 'https://e-comerce-floreria-production.up.railway.app')
redirect_url = f"{frontend_url}/checkout/success?pedido={pedido_id}&payment=success"
return redirect(redirect_url)
```

**Problema:**
- Si `FRONTEND_URL` no está definida, usa el valor por defecto
- El valor por defecto apunta al **backend** (e-comerce-floreria-production)
- Debería apuntar al **frontend** (floreriayviverocristian)

**Solución:**
- Agregar `FRONTEND_URL` en Railway
- Apuntar a la URL correcta del frontend

---

## 🎯 URLs Correctas

### **Backend (Django API):**
```
https://e-comerce-floreria-production.up.railway.app
```
- Endpoints: `/api/catalogo/`, `/api/pedidos/`, `/api/carrito/`
- Admin: `/admin/`

### **Frontend (Next.js):**
```
https://floreriayviverocristian.up.railway.app
```
- Páginas: `/`, `/productos/`, `/checkout/`, `/checkout/success`
- Esta es la URL que debe usarse para redirecciones

---

## ✅ Checklist de Verificación

Después de aplicar el fix:

- [ ] Variable `FRONTEND_URL` agregada en Railway
- [ ] Deploy completado exitosamente
- [ ] Hacer pedido de prueba
- [ ] Completar pago en MercadoPago
- [ ] Verificar redirección a `/checkout/success`
- [ ] Verificar que se muestre la página de confirmación

---

## 🔍 Debugging

Si después del fix sigue sin funcionar:

### **1. Verificar Logs de Railway**

```bash
railway logs --service backend
```

Busca líneas como:
```
🔄 Redirigiendo a: https://floreriayviverocristian.up.railway.app/checkout/success?pedido=XX
```

### **2. Verificar Variable en Runtime**

Ejecuta en Railway Shell:
```bash
railway run python -c "import os; print(os.getenv('FRONTEND_URL'))"
```

Debería mostrar:
```
https://floreriayviverocristian.up.railway.app
```

### **3. Verificar Página de Success Existe**

Accede directamente a:
```
https://floreriayviverocristian.up.railway.app/checkout/success?pedido=1&payment=success
```

Debería mostrar la página de confirmación (aunque sea con datos de prueba).

---

## 📝 Notas Adicionales

### **MercadoPago URLs de Retorno**

El código también configura las URLs de retorno en MercadoPago:

**Archivo:** `pedidos/mercadopago_service.py` (línea 35)

```python
base_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
```

Esta ya tiene el valor correcto por defecto, pero es mejor tener la variable configurada explícitamente.

### **Tipos de Redirección**

El sistema maneja 3 tipos de retorno:

1. **Success:** `/api/pedidos/payment/success/<pedido_id>/`
   - Redirige a: `/checkout/success?payment=success`

2. **Failure:** `/api/pedidos/payment/failure/<pedido_id>/`
   - Redirige a: `/checkout/success?payment=failure`

3. **Pending:** `/api/pedidos/payment/pending/<pedido_id>/`
   - Redirige a: `/checkout/success?payment=pending`

Todas usan la misma variable `FRONTEND_URL`.

---

## 🆘 Si Sigue Sin Funcionar

Si después de agregar la variable sigue dando 404:

1. **Verifica que la página `/checkout/success` existe en el frontend**
2. **Revisa los logs del frontend en Railway**
3. **Verifica que el frontend esté desplegado correctamente**
4. **Prueba acceder directamente a la URL del frontend**

---

**¡Con este fix, las redirecciones de pago deberían funcionar correctamente!** ✅
