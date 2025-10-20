# 🚀 GUÍA RÁPIDA: ACTIVAR EMAILS EN 5 MINUTOS

## 📋 CHECKLIST

- [ ] **PASO 1:** Generar App Password de Gmail (2 min)
- [ ] **PASO 2:** Configurar variables en Railway (2 min)
- [ ] **PASO 3:** Esperar redeploy (3-5 min)
- [ ] **PASO 4:** Probar con un pedido (1 min)

---

## 🔐 PASO 1: GENERAR APP PASSWORD

### **1.1 Habilitar autenticación de 2 factores**
Si no la tienes habilitada:
1. Ve a: https://myaccount.google.com/security
2. Busca "Verificación en dos pasos"
3. Actívala

### **1.2 Generar App Password**
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona:
   - **App:** Mail
   - **Device:** Other (Custom name)
3. Escribe: `Railway Florería`
4. Click en **Generate**
5. **COPIA** la contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)

> ⚠️ **IMPORTANTE:** Esta contraseña solo se muestra una vez. Si la pierdes, genera una nueva.

---

## ⚙️ PASO 2: CONFIGURAR RAILWAY

### **2.1 Ir a Variables**
1. Abre tu proyecto en Railway
2. Click en tu servicio (el que tiene Django)
3. Click en la pestaña **"Variables"**
4. Click en **"+ New Variable"**

### **2.2 Agregar estas 7 variables**

Copia y pega cada línea (una por una):

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

```
EMAIL_HOST=smtp.gmail.com
```

```
EMAIL_PORT=587
```

```
EMAIL_USE_TLS=True
```

```
EMAIL_HOST_USER=tu-email@gmail.com
```
> ⚠️ Reemplaza `tu-email@gmail.com` con tu email real

```
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
```
> ⚠️ Reemplaza con la App Password que generaste (sin espacios: `abcdefghijklmnop`)

```
DEFAULT_FROM_EMAIL=Florería Cristina <tu-email@gmail.com>
```
> ⚠️ Reemplaza `tu-email@gmail.com` con tu email real

### **2.3 Guardar**
Railway guardará automáticamente y comenzará el redeploy.

---

## ⏳ PASO 3: ESPERAR REDEPLOY

1. Verás un mensaje: **"Deploying..."**
2. Espera 3-5 minutos
3. Cuando veas **"Active"** → ¡Listo!

---

## ✅ PASO 4: PROBAR

### **Opción A: Crear un pedido de prueba**
1. Ve a: https://floreriayviverocristian.up.railway.app/
2. Agrega un producto al carrito
3. Completa el checkout con tu email
4. **Verifica tu bandeja de entrada** (y SPAM)

### **Opción B: Ver logs**
En Railway, ve a **"Deployments"** → **"View Logs"**

Busca líneas como:
```
[INFO] Email enviado a cliente@example.com
```

---

## 🎯 RESULTADO ESPERADO

Deberías recibir un email como este:

```
De: Florería Cristina <tu-email@gmail.com>
Para: cliente@example.com
Asunto: 🌸 Confirmación de Pedido #XXXXX

¡Hola [Nombre]!

Tu pedido ha sido confirmado exitosamente.

Número de pedido: #XXXXX
Total: $XX,XXX
Fecha de entrega: XX/XX/XXXX

...
```

---

## ❌ PROBLEMAS COMUNES

### **"SMTPAuthenticationError"**
**Causa:** App Password incorrecta  
**Solución:**
1. Genera una nueva App Password
2. Actualiza `EMAIL_HOST_PASSWORD` en Railway
3. Espera el redeploy

### **"Username and Password not accepted"**
**Causa:** No tienes autenticación de 2 factores  
**Solución:**
1. Habilita 2FA en tu cuenta de Gmail
2. Genera la App Password
3. Actualiza las variables en Railway

### **Los emails llegan a SPAM**
**Causa:** Normal al principio  
**Solución:**
- Marca el email como "No es spam"
- Con el tiempo mejorará la reputación

### **No llega ningún email**
**Solución:**
1. Verifica que las variables estén bien escritas
2. Verifica que no haya espacios extra
3. Revisa los logs de Railway

---

## 📊 VERIFICACIÓN RÁPIDA

Antes de configurar, verifica que tienes:

| Requisito | ¿Tienes? |
|-----------|----------|
| Cuenta de Gmail | ☐ |
| Autenticación de 2 factores habilitada | ☐ |
| App Password generada | ☐ |
| Acceso a Railway | ☐ |
| Email de prueba para verificar | ☐ |

---

## 🆘 NECESITAS AYUDA?

Si algo no funciona:

1. **Comparte screenshot** de las variables en Railway
2. **Copia los logs** de Railway (últimas 50 líneas)
3. **Describe el error** que ves

---

## 💡 TIP PRO

Para ver si los emails se están enviando en tiempo real:

```bash
railway logs --tail
```

Verás cada email que se envía:
```
[INFO] Email enviado a cliente@example.com
[INFO] Notificación EMAIL creada para pedido #123
```

---

## 🎉 ¡LISTO!

Una vez configurado, los emails se enviarán automáticamente en estos casos:

✅ Nuevo usuario registrado → Email de bienvenida  
✅ Pedido confirmado → Email de confirmación  
✅ Pedido en camino → Email de notificación  
✅ Pedido entregado → Email de confirmación  
✅ Pedido cancelado → Email de notificación  

---

## 📞 SIGUIENTE PASO

**¿Ya generaste la App Password?**

Si sí → Configura las variables en Railway  
Si no → Empieza por el Paso 1  

**¿Necesitas ayuda?** → Comparte screenshot de donde estás trabado

---

**Tiempo total estimado: 5-10 minutos** ⏱️
