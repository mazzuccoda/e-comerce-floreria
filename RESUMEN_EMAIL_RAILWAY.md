# 📧 RESUMEN: CONFIGURAR EMAILS EN RAILWAY

## 🎯 PROBLEMA ACTUAL

Los emails **NO se están enviando** porque:

1. ✅ **El sistema de notificaciones está implementado correctamente**
2. ❌ **EMAIL_BACKEND está configurado como `console`** (solo imprime en consola)
3. ❌ **Faltan credenciales de SMTP en Railway**

---

## 🚀 SOLUCIÓN RÁPIDA (5 MINUTOS)

### **PASO 1: Genera App Password de Gmail**

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona **"Mail"** y **"Other (Custom name)"**
3. Escribe: **"Railway Florería Cristina"**
4. Copia la contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)

> ⚠️ **IMPORTANTE:** Necesitas tener **autenticación de 2 factores** habilitada en tu cuenta de Gmail.

---

### **PASO 2: Configura Variables en Railway**

Ve a tu proyecto en Railway → **Variables** → **Add Variable**

Agrega estas **5 variables**:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
DEFAULT_FROM_EMAIL=Florería Cristina <tu-email@gmail.com>
```

**REEMPLAZA:**
- `tu-email@gmail.com` → Tu email de Gmail
- `abcd efgh ijkl mnop` → La App Password que generaste (sin espacios)

---

### **PASO 3: Espera el Redeploy**

Railway detectará los cambios y hará redeploy automáticamente (3-5 minutos).

---

### **PASO 4: Prueba**

1. Crea un pedido nuevo en: https://floreriayviverocristian.up.railway.app/
2. Verifica que llegue el email de confirmación
3. Si no llega, revisa **SPAM**

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de configurar en Railway, verifica:

- [ ] Tienes una cuenta de Gmail
- [ ] Tienes autenticación de 2 factores habilitada
- [ ] Generaste la App Password
- [ ] Copiaste la App Password (16 caracteres)
- [ ] Tienes acceso a Railway
- [ ] Sabes dónde está la sección "Variables" en Railway

---

## 🔍 CÓMO VERIFICAR QUE FUNCIONA

### **Opción 1: Crear un pedido**
1. Ve a la tienda: https://floreriayviverocristian.up.railway.app/
2. Agrega productos al carrito
3. Completa el checkout
4. Verifica que llegue el email de confirmación

### **Opción 2: Ver logs de Railway**
```bash
railway logs --tail
```

Busca líneas como:
```
[INFO] Email enviado a cliente@example.com
```

---

## ⚠️ PROBLEMAS COMUNES

### **"SMTPAuthenticationError: Username and Password not accepted"**
**Causa:** App Password incorrecta o no generada  
**Solución:** Genera una nueva App Password y actualiza `EMAIL_HOST_PASSWORD`

### **"SMTPServerDisconnected"**
**Causa:** Puerto o TLS incorrectos  
**Solución:** Verifica que `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`

### **Los emails llegan a SPAM**
**Causa:** Gmail no reconoce el remitente  
**Solución:** Normal al principio. Con el tiempo mejorará la reputación.

### **"No module named 'twilio'"**
**Causa:** Twilio no está instalado (solo afecta WhatsApp)  
**Solución:** Ignora este error si solo quieres emails

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ **LO QUE YA FUNCIONA:**
- Sistema de notificaciones implementado
- Plantillas de email creadas
- Señales automáticas configuradas
- Integración con pedidos

### ❌ **LO QUE FALTA:**
- Configurar credenciales SMTP en Railway
- Cambiar EMAIL_BACKEND de `console` a `smtp`

---

## 🎯 VARIABLES EXACTAS PARA RAILWAY

**Copia y pega esto en Railway (reemplazando los valores):**

| Variable | Valor |
|----------|-------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | `TU_EMAIL@gmail.com` |
| `EMAIL_HOST_PASSWORD` | `TU_APP_PASSWORD` |
| `DEFAULT_FROM_EMAIL` | `Florería Cristina <TU_EMAIL@gmail.com>` |

---

## 💡 ALTERNATIVA: USAR SENDGRID (RECOMENDADO PARA PRODUCCIÓN)

Si prefieres usar SendGrid en lugar de Gmail:

1. Crea cuenta en: https://sendgrid.com/ (100 emails gratis/día)
2. Genera API Key
3. Configura en Railway:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=TU_SENDGRID_API_KEY
DEFAULT_FROM_EMAIL=Florería Cristina <noreply@floreriacristina.com>
```

**Ventajas de SendGrid:**
- ✅ Mejor deliverability
- ✅ No llega a SPAM
- ✅ Estadísticas de envío
- ✅ 100 emails gratis por día

---

## 📞 SIGUIENTE PASO

**¿Qué prefieres?**

1. **Gmail** → Más rápido de configurar (5 minutos)
2. **SendGrid** → Mejor para producción (15 minutos)

Dime cuál prefieres y te guío paso a paso.

---

## 📝 ARCHIVOS CREADOS

- ✅ `CONFIGURACION_EMAIL_RAILWAY.md` → Guía detallada
- ✅ `verificar_email.py` → Script de diagnóstico
- ✅ `RESUMEN_EMAIL_RAILWAY.md` → Este archivo

---

## 🎬 PRÓXIMA ACCIÓN

**Genera la App Password de Gmail y compárteme:**
1. Screenshot de las variables configuradas en Railway
2. O dime si prefieres usar SendGrid

¡Estamos a 5 minutos de tener emails funcionando! 🚀
