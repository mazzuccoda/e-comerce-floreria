# 🧪 CÓMO PROBAR EL ENVÍO DE EMAILS

## ✅ CONFIGURACIÓN VERIFICADA

Según tu screenshot, ya tienes configuradas estas variables en Railway:

```bash
✅ EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
✅ EMAIL_HOST=smtp.gmail.com
✅ EMAIL_PORT=587
✅ EMAIL_USE_TLS=True
✅ EMAIL_HOST_USER=mazzucoda@gmail.com
✅ EMAIL_HOST_PASSWORD=giqe alnn tctq kqqj
✅ DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

---

## 🚀 OPCIÓN 1: PROBAR EN RAILWAY (RECOMENDADO)

### **Método A: Usando Railway CLI**

1. **Instala Railway CLI** (si no lo tienes):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login en Railway:**
   ```bash
   railway login
   ```

3. **Ejecuta el script de prueba:**
   ```bash
   railway run python test_email_railway.py
   ```

### **Método B: Desde el Dashboard de Railway**

1. Ve a tu proyecto en Railway
2. Click en tu servicio (Django)
3. Click en **"Settings"** → **"Deploy"**
4. En **"Custom Start Command"**, temporalmente cambia a:
   ```bash
   python test_email_railway.py
   ```
5. Guarda y espera el deploy
6. Ve a **"Deployments"** → **"View Logs"**
7. Verás el resultado del test
8. **IMPORTANTE:** Vuelve a cambiar el comando a:
   ```bash
   /bin/sh -c "python manage.py migrate --noinput && exec gunicorn floreria_cristina.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
   ```

---

## 🐳 OPCIÓN 2: PROBAR EN DOCKER LOCAL

### **Paso 1: Asegúrate que Docker esté corriendo**

```bash
docker-compose ps
```

### **Paso 2: Ejecuta el script de prueba**

```bash
docker-compose exec web python test_envio_email.py
```

### **Paso 3: Sigue las instrucciones**

El script te pedirá tu email y ejecutará 3 pruebas:
1. ✅ Email simple
2. ✅ Email HTML
3. ✅ Sistema de notificaciones

---

## 📝 OPCIÓN 3: PROBAR CREANDO UN PEDIDO REAL

Esta es la forma más realista de probar:

### **Paso 1: Ve a la tienda**
```
https://floreriayviverocristian.up.railway.app/
```

### **Paso 2: Agrega productos al carrito**
- Selecciona un producto
- Agrégalo al carrito
- Ve al checkout

### **Paso 3: Completa el pedido**
- Usa tu email real: `mazzucoda@gmail.com`
- Completa todos los datos
- Finaliza la compra

### **Paso 4: Verifica tu email**
Deberías recibir un email de confirmación como este:

```
De: Floreria Cristina <mazzucoda@gmail.com>
Para: mazzucoda@gmail.com
Asunto: 🌸 Confirmación de Pedido #XXXXX

¡Hola [Tu Nombre]!

Tu pedido ha sido confirmado exitosamente.

Número de pedido: #XXXXX
Total: $XX,XXX
Fecha de entrega: XX/XX/XXXX

...
```

---

## 🔍 VERIFICAR LOGS EN RAILWAY

Para ver si los emails se están enviando:

1. Ve a Railway → Tu proyecto
2. Click en **"Deployments"**
3. Click en el deployment activo
4. Click en **"View Logs"**
5. Busca líneas como:

```
✅ [INFO] Email enviado a mazzucoda@gmail.com
✅ [INFO] Notificación EMAIL creada para pedido #123
```

O errores como:

```
❌ [ERROR] Error enviando notificación: SMTPAuthenticationError
```

---

## ⚠️ PROBLEMAS COMUNES

### **1. "SMTPAuthenticationError: Username and Password not accepted"**

**Causa:** App Password incorrecta

**Solución:**
1. Ve a: https://myaccount.google.com/apppasswords
2. Genera una nueva App Password
3. Actualiza `EMAIL_HOST_PASSWORD` en Railway
4. Espera el redeploy

---

### **2. Los emails llegan a SPAM**

**Causa:** Normal al principio (Gmail no reconoce el remitente)

**Solución:**
- Marca el email como "No es spam"
- Con el tiempo mejorará la reputación
- Considera usar SendGrid para producción

---

### **3. No llega ningún email**

**Solución:**
1. Verifica que las variables estén bien escritas en Railway
2. Verifica que no haya espacios extra
3. Revisa los logs de Railway
4. Prueba con el script `test_email_railway.py`

---

### **4. "Connection refused" o "Timeout"**

**Causa:** Firewall bloqueando puerto 587

**Solución:**
- Railway normalmente no tiene este problema
- Si persiste, prueba con puerto 465 y `EMAIL_USE_SSL=True`

---

## 📊 CHECKLIST DE VERIFICACIÓN

Antes de probar, verifica:

- [ ] Variables configuradas en Railway
- [ ] Deploy completado sin errores
- [ ] App Password de Gmail generada
- [ ] Autenticación de 2 factores habilitada en Gmail
- [ ] Email de destino correcto

---

## 🎯 SCRIPT MÁS SIMPLE (PARA RAILWAY)

Si quieres probar rápido en Railway, edita `test_email_railway.py`:

```python
# Línea 28: Cambia el email de destino
EMAIL_DESTINO = "mazzucoda@gmail.com"  # ⚠️ YA ESTÁ CONFIGURADO
```

Luego ejecuta:
```bash
railway run python test_email_railway.py
```

---

## 💡 RECOMENDACIÓN

**La forma más fácil de probar:**

1. ✅ Espera que termine el deploy actual en Railway (3-5 min)
2. ✅ Crea un pedido de prueba en la tienda
3. ✅ Verifica tu email: `mazzucoda@gmail.com`
4. ✅ Si no llega, revisa SPAM
5. ✅ Si no está en SPAM, revisa los logs de Railway

---

## 🆘 NECESITAS AYUDA?

Si algo no funciona:

1. **Comparte los logs de Railway** (últimas 50 líneas)
2. **Describe el error** que ves
3. **Confirma que las variables** estén bien configuradas

---

## ✅ PRÓXIMOS PASOS

1. **Espera el deploy** (debería terminar en 2-3 minutos)
2. **Prueba creando un pedido** en la tienda
3. **Verifica tu email**
4. **Compárteme el resultado** (¿llegó el email?)

---

**¡Estamos muy cerca de tener emails funcionando!** 🚀
