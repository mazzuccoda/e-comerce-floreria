# 🚨 SOLUCIÓN: EMAILS NO LLEGAN EN RAILWAY

## 📊 DIAGNÓSTICO DEL PROBLEMA

Según los logs de Railway, el sistema está intentando enviar emails pero **se detiene después de mostrar la configuración de SendGrid**. Esto indica uno de estos problemas:

### 1. **TIMEOUT (Más Probable)**
Railway está bloqueando el puerto 587 (SMTP con TLS), causando que la conexión se quede esperando indefinidamente.

### 2. **ERROR DE AUTENTICACIÓN**
La API Key de SendGrid no está configurada correctamente o `EMAIL_HOST_USER` no es `apikey`.

### 3. **LOGS INCOMPLETOS**
El error está ocurriendo pero no se muestra en los logs de Railway.

---

## ✅ SOLUCIÓN 1: USAR PUERTO 465 (SSL) EN LUGAR DE 587 (TLS)

Railway a menudo bloquea el puerto 587. Intenta usar el puerto 465 con SSL:

### Pasos:

1. **Ve a tu proyecto en Railway**: https://railway.app
2. **Selecciona tu servicio Django**
3. **Ve a la pestaña "Variables"**
4. **Modifica estas variables**:

```bash
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
```

5. **Guarda los cambios** (Railway redesplegará automáticamente)
6. **Espera 2-3 minutos** a que termine el despliegue
7. **Crea un pedido de prueba** en tu tienda

---

## ✅ SOLUCIÓN 2: VERIFICAR API KEY DE SENDGRID

Si el puerto 465 tampoco funciona, verifica tu API Key:

### Pasos:

1. **Ve a SendGrid**: https://app.sendgrid.com
2. **Settings → API Keys**
3. **Crea una nueva API Key** (las anteriores pueden estar inválidas):
   - Nombre: `Railway Django Email v2`
   - Tipo: **Full Access**
   - Copia la API Key (empieza con `SG.`)

4. **Ve a Railway → Variables**
5. **Actualiza estas variables**:

```bash
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:**
- `EMAIL_HOST_USER` debe ser **literalmente** `apikey` (no tu email)
- `EMAIL_HOST_PASSWORD` debe ser tu **API Key completa** de SendGrid

---

## ✅ SOLUCIÓN 3: USAR GMAIL SMTP (ALTERNATIVA)

Si SendGrid no funciona, puedes usar Gmail:

### Pasos:

1. **Habilita verificación en 2 pasos** en tu cuenta de Gmail
2. **Genera una contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Copia la contraseña de 16 caracteres

3. **Ve a Railway → Variables**
4. **Configura estas variables**:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

---

## 🔍 VERIFICAR SI FUNCIONÓ

### 1. Revisar logs en Railway

Después de crear un pedido, busca en los logs:

**✅ SI FUNCIONA (Puerto 465):**
```
📤 Iniciando envío de email...
✅ Email enviado exitosamente a dmazzucco@sanmiguelglobal.com
✅ Notificación 68 marcada como ENVIADA
🔄 Timeout restaurado
```

**❌ SI FALLA (Timeout):**
```
⏱️ Timeout conectando al servidor SMTP después de 15 segundos
⏱️ Railway puede estar bloqueando el puerto 587
```

**❌ SI FALLA (Autenticación):**
```
🔐 Error de autenticación SMTP: (535, 'Authentication failed')
🔐 Verifica que EMAIL_HOST_USER='apikey' y EMAIL_HOST_PASSWORD sea tu API Key de SendGrid
```

### 2. Revisar Email Activity en SendGrid

1. Ve a **Activity → Email Activity** en SendGrid
2. Busca emails enviados en los últimos minutos
3. Verifica el estado:
   - **Delivered**: ✅ Email entregado
   - **Bounced**: ❌ Email rebotado
   - **Dropped**: 🚫 Email descartado

### 3. Revisar bandeja de entrada

Revisa tu email (incluyendo spam/correo no deseado) en:
- `dmazzucco@sanmiguelglobal.com`

---

## 🚀 CONFIGURACIÓN RECOMENDADA PARA RAILWAY

Basándome en experiencias con Railway, esta es la configuración más confiable:

```bash
# OPCIÓN A: SendGrid con SSL (Puerto 465)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>

# OPCIÓN B: Gmail con TLS (Puerto 587)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

---

## 🛠️ SCRIPT DE DIAGNÓSTICO

He creado un script para diagnosticar el problema. Para ejecutarlo:

```bash
# En Railway, ve a la pestaña "Shell" y ejecuta:
python diagnostico_email_railway.py
```

Este script te mostrará:
- ✅ Variables de entorno configuradas
- ✅ Conectividad al servidor SMTP
- ✅ Intento de envío de email de prueba
- ✅ Notificaciones pendientes/fallidas en la base de datos

---

## 📝 CHECKLIST DE VERIFICACIÓN

- [ ] Variables de entorno configuradas en Railway
- [ ] `EMAIL_PORT=465` y `EMAIL_USE_SSL=True` (para SendGrid)
- [ ] `EMAIL_HOST_USER=apikey` (literal, no tu email)
- [ ] `EMAIL_HOST_PASSWORD` es tu API Key de SendGrid (empieza con `SG.`)
- [ ] Railway redesplegado (esperar 2-3 minutos)
- [ ] Pedido de prueba creado
- [ ] Logs verificados (buscar mensaje de éxito o error específico)
- [ ] Email recibido en bandeja de entrada

---

## 🆘 SI NADA FUNCIONA

Si después de probar todas las soluciones anteriores los emails siguen sin llegar:

### 1. Contacta a soporte de Railway
Railway puede estar bloqueando todos los puertos SMTP. Pregúntales:
- ¿Están bloqueando los puertos 587 y 465?
- ¿Hay alguna configuración especial para enviar emails?

### 2. Usa un servicio de email API
En lugar de SMTP, usa una API REST:
- **SendGrid API** (en lugar de SMTP)
- **Mailgun API**
- **Amazon SES**

### 3. Mueve el envío de emails a un worker externo
- Usa **Celery** con un worker en otro servidor
- Usa **Railway Cron Jobs** para procesar emails pendientes

---

## 📊 ESTADO ACTUAL

Según los logs que compartiste:

```
[INFO] 2025-10-20 20:49:58,329 notificaciones.services 📧 Backend EMAIL: django.core.mail.backends.smtp.EmailBackend
[INFO] 2025-10-20 20:49:58,329 notificaciones.services 🔧 EMAIL_HOST: smtp.sendgrid.net
```

El sistema está configurado correctamente para usar SendGrid, pero **los logs se cortan después de mostrar la configuración**, lo que indica:

1. **Timeout**: El puerto 587 está bloqueado
2. **El proceso se está ejecutando en background** y los logs no se muestran completos

**ACCIÓN INMEDIATA**: Cambia a puerto 465 con SSL como se indica en la Solución 1.

---

**Última actualización**: 20/10/2025 20:51 UTC-3
**Autor**: Cascade AI Assistant
