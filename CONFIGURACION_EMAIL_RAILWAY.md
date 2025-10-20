# 📧 CONFIGURACIÓN DE EMAIL EN RAILWAY

## 🎯 OBJETIVO
Configurar el envío real de emails desde Railway usando Gmail/Google Workspace.

---

## 📋 INFORMACIÓN NECESARIA

Basándome en la cuenta de servicio de Google Cloud que mostraste:

```
Email: 1071894592049-compute@developer.gserviceaccount.com
ID: 117867353447120802796
```

---

## ⚙️ VARIABLES DE ENTORNO A CONFIGURAR EN RAILWAY

Ve a tu proyecto en Railway → **Variables** y agrega las siguientes:

### **1. Backend de Email (OBLIGATORIO)**
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

### **2. Configuración SMTP de Gmail**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### **3. Credenciales de Email**

**OPCIÓN A: Usar Gmail con App Password (RECOMENDADO)**

Si tienes una cuenta de Gmail personal o Google Workspace:

```bash
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
```

> ⚠️ **IMPORTANTE:** `EMAIL_HOST_PASSWORD` debe ser una **App Password**, NO tu contraseña normal.

**Cómo generar App Password:**
1. Ve a https://myaccount.google.com/apppasswords
2. Selecciona "Mail" y "Other (Custom name)"
3. Escribe "Railway Florería"
4. Copia la contraseña de 16 caracteres (sin espacios)

---

**OPCIÓN B: Usar cuenta de servicio (MÁS COMPLEJO)**

Si quieres usar la cuenta de servicio que mostraste, necesitas:

```bash
EMAIL_HOST_USER=1071894592049-compute@developer.gserviceaccount.com
EMAIL_HOST_PASSWORD=[necesitas configurar OAuth2]
```

> ⚠️ Esto requiere configuración OAuth2 adicional y es más complejo.

---

### **4. Email de Remitente**
```bash
DEFAULT_FROM_EMAIL=Florería Cristina <noreply@floreriacristina.com>
```

O si usas Gmail:
```bash
DEFAULT_FROM_EMAIL=Florería Cristina <tu-email@gmail.com>
```

---

## 🔧 CONFIGURACIÓN COMPLETA EN RAILWAY

**Variables mínimas necesarias:**

```bash
# Email Backend
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# SMTP Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Credenciales (REEMPLAZAR CON TUS DATOS)
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx

# Remitente
DEFAULT_FROM_EMAIL=Florería Cristina <tu-email@gmail.com>
```

---

## ✅ VERIFICACIÓN

Después de configurar las variables en Railway:

1. **Railway hará redeploy automáticamente**
2. **Espera 3-5 minutos**
3. **Prueba creando un pedido nuevo**
4. **Verifica que llegue el email de confirmación**

---

## 🐛 TROUBLESHOOTING

### **Error: "SMTPAuthenticationError"**
- Verifica que usas una **App Password**, no tu contraseña normal
- Verifica que la cuenta tiene autenticación de 2 factores habilitada

### **Error: "SMTPServerDisconnected"**
- Verifica que `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`

### **Los emails no llegan**
- Revisa la carpeta de SPAM
- Verifica que `DEFAULT_FROM_EMAIL` sea válido
- Revisa los logs de Railway: `railway logs`

---

## 📝 LOGS PARA VERIFICAR

En Railway, ejecuta:
```bash
railway logs --tail
```

Busca líneas como:
```
[INFO] Email enviado a cliente@example.com
```

O errores como:
```
[ERROR] Error enviando notificación: SMTPAuthenticationError
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Genera App Password** en tu cuenta de Gmail
2. ✅ **Configura las variables** en Railway
3. ✅ **Espera el redeploy** (3-5 minutos)
4. ✅ **Prueba creando un pedido**
5. ✅ **Verifica que llegue el email**

---

## 💡 RECOMENDACIÓN

Para producción, te recomiendo:

1. **Usar SendGrid** (más confiable que Gmail para producción)
   - 100 emails gratis por día
   - Mejor deliverability
   - Más fácil de configurar

2. **O usar Google Workspace** (si tienes dominio propio)
   - Más profesional
   - Mejor reputación de envío

---

## 📞 SOPORTE

Si tienes problemas, comparte:
1. Screenshot de las variables en Railway
2. Logs de Railway (`railway logs`)
3. El error específico que ves
