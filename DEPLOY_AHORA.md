# ⚡ Deploy en Railway - ACCIÓN INMEDIATA

## ✅ TODO ESTÁ LISTO

El código está **pusheado a GitHub** con toda la configuración necesaria para Railway.

---

## 🎯 ACCIÓN: Sigue estos 5 pasos

### **1️⃣ Abre Railway**
Ve a tu proyecto: https://railway.app/project/27e73aea-8ff1-433f-bdee-05bfa0eb13d2

---

### **2️⃣ Crea el Servicio Backend**

1. Haz clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona: **`mazzuccoda/e-comerce-floreria`**
3. Railway detectará automáticamente que es un proyecto Django

---

### **3️⃣ Configura Variables de Entorno**

Ve a **Settings → Variables** del servicio recién creado.

**Copia y pega estas variables (IMPORTANTE: Genera un nuevo SECRET_KEY primero en https://djecrety.ir/):**

```
SECRET_KEY=[GENERA_UNA_NUEVA_CLAVE_AQUI]
DEBUG=False
ALLOWED_HOSTS=*.railway.app
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=hrmm pliq wubv qhxy
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
MP_PUBLIC_KEY=APP_USR-b26d49ff-1026-418d-9dc1-04a6088c3151
MP_ACCESS_TOKEN=APP_USR-3512363478106661-101217-8c574b4c06a425a68262d8733d001c5f-2535754045
```

**⚠️ IMPORTANTE:** 
- Ve a https://djecrety.ir/ 
- Genera un **SECRET_KEY** nuevo
- Reemplaza `[GENERA_UNA_NUEVA_CLAVE_AQUI]` con esa clave

---

### **4️⃣ Conecta PostgreSQL**

Tu PostgreSQL ya está creado en Railway. Ahora conéctalo:

**Opción A (Automática):**
1. En el servicio backend, busca **"Connect to Service"** o **"Link Service"**
2. Selecciona tu **PostgreSQL**
3. Railway agregará `DATABASE_URL` automáticamente

**Opción B (Manual):**
1. Ve al servicio de **PostgreSQL**
2. Copia la variable `DATABASE_URL`:
   ```
   postgresql://postgres:MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa@postgres.railway.internal:5432/railway
   ```
3. Agrégala en las variables del **backend**

---

### **5️⃣ Deploy y Monitoreo**

1. Railway hará el **deploy automáticamente**
2. Ve a **Deployments** para ver el progreso
3. Haz clic en **"View Logs"** para monitorear

**Busca estos mensajes en los logs:**
```
✅ Building...
✅ Installing dependencies
✅ Collecting static files
✅ Starting gunicorn
✅ Listening on 0.0.0.0:XXXX
```

---

## 📱 DESPUÉS DEL PRIMER DEPLOY

### **A. Obtén la URL de tu app**

1. Ve a **Settings → Domains**
2. Copia la URL (ej: `https://e-comerce-floreria-production.up.railway.app`)
3. Actualiza las variables:
   ```
   ALLOWED_HOSTS=*.railway.app,e-comerce-floreria-production.up.railway.app
   CSRF_TRUSTED_ORIGINS=https://e-comerce-floreria-production.up.railway.app
   ```

### **B. Ejecuta Migraciones**

**Opción 1 - Railway CLI (Recomendado):**
```bash
npm install -g @railway/cli
railway login
railway link
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

**Opción 2 - Desde el panel de Railway:**
Busca la opción de ejecutar comandos y ejecuta:
```bash
python manage.py migrate
python manage.py createsuperuser
```

### **C. Verifica que Funciona**

Accede a estas URLs (reemplaza con tu URL real):

- **Admin:** `https://tu-app.railway.app/admin/`
- **API:** `https://tu-app.railway.app/api/catalogo/productos/`

---

## 🆘 SI ALGO SALE MAL

### Error: "Application failed to start"
- Revisa los **logs** en Railway
- Verifica que `DATABASE_URL` esté conectada
- Verifica que `SECRET_KEY` esté configurada

### Error: CSS no carga en admin
- Ejecuta: `python manage.py collectstatic --noinput`
- Verifica que `whitenoise` esté en `requirements.txt`

### Error: Database connection
- Asegúrate que PostgreSQL y Backend estén en el **mismo proyecto**
- Verifica que `DATABASE_URL` sea correcta

---

## 📋 CHECKLIST DE VERIFICACIÓN

Marca cuando completes cada paso:

- [ ] Servicio backend creado en Railway desde GitHub
- [ ] Variables de entorno agregadas (11 variables)
- [ ] SECRET_KEY generada y agregada
- [ ] PostgreSQL conectado al backend
- [ ] Deploy exitoso (sin errores en logs)
- [ ] URL pública obtenida
- [ ] Migraciones ejecutadas (`migrate`)
- [ ] Superusuario creado (`createsuperuser`)
- [ ] Admin panel accesible y con estilos CSS
- [ ] API responde correctamente

---

## 📚 DOCUMENTACIÓN COMPLETA

Si necesitas más detalles, revisa estos archivos:

- **`RAILWAY_PASOS_RAPIDOS.md`** - Guía paso a paso detallada
- **`RAILWAY_DEPLOYMENT.md`** - Documentación completa
- **`RAILWAY_VARIABLES.txt`** - Lista de todas las variables

---

## ⏱️ TIEMPO ESTIMADO

- Crear servicio: **2 minutos**
- Configurar variables: **5 minutos**
- Primer deploy: **5-10 minutos**
- Migraciones y verificación: **5 minutos**

**TOTAL: ~20 minutos** para tener tu app en producción 🚀

---

**¡Ahora ve a Railway y comienza el deploy!** 💪
