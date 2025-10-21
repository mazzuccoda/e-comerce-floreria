# 📧 CONFIGURAR EMAILS CON GMAIL EN RAILWAY

## 🎯 OBJETIVO:
Hacer que los emails se envíen realmente a las bandejas de entrada de los clientes, no solo a los logs.

---

## 📋 PASO 1: GENERAR APP PASSWORD DE GMAIL

### **1.1. Ir a tu cuenta de Gmail**
Ve a: https://myaccount.google.com/

### **1.2. Activar verificación en 2 pasos** (si no está activada)
1. Ve a **Seguridad** → **Verificación en 2 pasos**
2. Sigue los pasos para activarla
3. Usa tu teléfono para recibir códigos

### **1.3. Generar App Password**
1. Ve a: https://myaccount.google.com/apppasswords
2. O busca "App passwords" en la configuración de seguridad
3. Selecciona:
   - **App:** Correo
   - **Device:** Otro (nombre personalizado) → escribe "Floreria Cristina"
4. Click en **Generar**
5. **COPIA LA CONTRASEÑA DE 16 CARACTERES** (sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop` → Copiar como: `abcdefghijklmnop`

⚠️ **IMPORTANTE:** Esta contraseña solo se muestra UNA VEZ. Guárdala en un lugar seguro.

---

## 📋 PASO 2: CONFIGURAR VARIABLES EN RAILWAY

### **2.1. Ir a Railway**
1. Ve a: https://railway.app/
2. Selecciona tu proyecto: **e-comerce-floreria-production**
3. Click en el servicio **web** (Django backend)
4. Click en la pestaña **Variables**

### **2.2. Agregar/Modificar estas variables:**

```bash
# Backend de email (CAMBIAR de console a smtp)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# Configuración de Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Credenciales (REEMPLAZA CON TUS DATOS)
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop

# Email remitente (debe ser el mismo que EMAIL_HOST_USER)
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

⚠️ **REEMPLAZA:**
- `mazzucoda@gmail.com` → Tu email de Gmail
- `abcdefghijklmnop` → La App Password que generaste (16 caracteres, sin espacios)

### **2.3. Guardar cambios**
1. Click en **Add** o **Update** para cada variable
2. Railway reiniciará automáticamente el servicio

---

## 📋 PASO 3: VERIFICAR QUE FUNCIONA

### **3.1. Esperar el redeploy**
- Railway tardará ~2-3 minutos en reiniciar
- Verifica que el deploy termine exitosamente

### **3.2. Crear un pedido de prueba**
1. Ve a tu tienda: https://floreriayviverocristian.up.railway.app/
2. Agrega productos al carrito
3. Completa el checkout
4. Confirma el pedido

### **3.3. Verificar el email**
1. **Revisa tu bandeja de entrada** del email que usaste en el pedido
2. Si no aparece, **revisa SPAM/Correo no deseado**
3. Deberías recibir un email como este:

```
De: Floreria Cristina <mazzucoda@gmail.com>
Asunto: ✅ Pedido #76 Confirmado - Florería Cristina

¡Hola Daniel!

Tu pedido #76 ha sido confirmado exitosamente.

📋 Detalles del pedido:
• Número de pedido: #76
• Total: $80000.00
• Fecha: 20/10/2025
• Cantidad de productos: 2
• Tipo de envío: 📅 Envío Programado

📦 ¿Qué sigue?
Te notificaremos cuando tu pedido esté en camino.

💐 ¡Gracias por elegir Florería Cristina!

Saludos,
El equipo de Florería Cristina
🌸 Hacemos que cada momento sea especial 🌸
```

---

## 🔍 PASO 4: VERIFICAR EN LOS LOGS

### **4.1. Ver logs de Railway**
1. En Railway, ve a tu servicio **web**
2. Click en **Deployments** → **View Logs**
3. Busca líneas como:

```
✅ Email enviado exitosamente a dmazzucco@sanmiguelglobal.com
✅ Copia enviada a mazzucoda@gmail.com
```

### **4.2. Si ves errores:**

**Error: "Authentication failed"**
```
❌ Error: (535, b'5.7.8 Username and Password not accepted')
```
**Solución:** Verifica que la App Password sea correcta (16 caracteres, sin espacios)

**Error: "Connection refused"**
```
❌ Error: [Errno 111] Connection refused
```
**Solución:** Verifica que `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`

**Error: "SMTPSenderRefused"**
```
❌ Error: Sender address rejected
```
**Solución:** Verifica que `DEFAULT_FROM_EMAIL` tenga el mismo email que `EMAIL_HOST_USER`

---

## 📊 RESUMEN DE VARIABLES NECESARIAS:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | Usar SMTP real |
| `EMAIL_HOST` | `smtp.gmail.com` | Servidor de Gmail |
| `EMAIL_PORT` | `587` | Puerto TLS |
| `EMAIL_USE_TLS` | `True` | Usar encriptación |
| `EMAIL_HOST_USER` | `mazzucoda@gmail.com` | Tu email |
| `EMAIL_HOST_PASSWORD` | `abcdefghijklmnop` | App Password |
| `DEFAULT_FROM_EMAIL` | `Floreria Cristina <mazzucoda@gmail.com>` | Remitente |

---

## ✅ CHECKLIST:

- [ ] Verificación en 2 pasos activada en Gmail
- [ ] App Password generada (16 caracteres)
- [ ] Variables agregadas en Railway
- [ ] Deploy completado exitosamente
- [ ] Pedido de prueba creado
- [ ] Email recibido en bandeja de entrada
- [ ] Email también en SPAM verificado

---

## 💡 TIPS:

1. **Si Gmail bloquea el acceso:**
   - Revisa tu email de Gmail
   - Puede que recibas un aviso de "intento de inicio de sesión bloqueado"
   - Autoriza el acceso desde ese email

2. **Si los emails van a SPAM:**
   - Es normal al principio
   - Marca el email como "No es spam"
   - Con el tiempo Gmail aprenderá

3. **Para producción:**
   - Considera usar un servicio dedicado como:
     - SendGrid (gratis hasta 100 emails/día)
     - Mailgun
     - Amazon SES
   - Gmail tiene límite de ~500 emails/día

4. **Emails de copia:**
   - El sistema envía una copia a `mazzucoda@gmail.com` (administrador)
   - Así puedes verificar cada pedido

---

## 🚨 IMPORTANTE:

⚠️ **NUNCA compartas tu App Password**
⚠️ **NO la subas a GitHub**
⚠️ **Solo úsala en Railway (variables de entorno)**

---

## 📞 SOPORTE:

Si después de seguir estos pasos los emails no funcionan:

1. Comparte los logs de Railway (últimas 50 líneas después de crear un pedido)
2. Verifica que las variables estén exactamente como se indica
3. Prueba enviando un email de prueba desde Gmail para verificar que la cuenta funciona

---

**¡Listo!** Una vez configurado, todos los pedidos enviarán emails automáticamente. 🚀
