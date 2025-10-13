# 🚀 Railway Deployment - Pasos Rápidos

## ✅ Código Ya Está Listo en GitHub

El código ha sido pusheado con toda la configuración necesaria:
- ✅ `railway.json` - Configuración de build y deploy
- ✅ `Procfile` - Comando de inicio
- ✅ `settings.py` actualizado para Railway
- ✅ `requirements.txt` con todas las dependencias

---

## 📋 PASOS A SEGUIR EN RAILWAY

### **Paso 1: Crear Servicio Backend**

1. Ve a tu proyecto en Railway: https://railway.app/project/27e73aea-8ff1-433f-bdee-05bfa0eb13d2
2. Haz clic en **"+ New"** → **"GitHub Repo"**
3. Selecciona el repositorio: **`mazzuccoda/e-comerce-floreria`**
4. Railway comenzará a detectar el proyecto automáticamente

---

### **Paso 2: Configurar Variables de Entorno**

Una vez creado el servicio, ve a **Settings → Variables** y agrega:

#### **Variables OBLIGATORIAS:**

```bash
# Django
SECRET_KEY=django-insecure-GENERA-UNA-NUEVA-CLAVE-AQUI-https://djecrety.ir/
DEBUG=False
ALLOWED_HOSTS=*.railway.app

# Railway Detection (Railway la agrega automáticamente)
RAILWAY_ENVIRONMENT=production

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=hrmm pliq wubv qhxy
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>

# MercadoPago (PRODUCCIÓN)
MP_PUBLIC_KEY=APP_USR-b26d49ff-1026-418d-9dc1-04a6088c3151
MP_ACCESS_TOKEN=APP_USR-3512363478106661-101217-8c574b4c06a425a68262d8733d001c5f-2535754045
```

#### **Variables de PostgreSQL:**

Railway ya tiene tu PostgreSQL creado. **NO necesitas agregar DATABASE_URL manualmente** porque Railway la proporciona automáticamente cuando conectes los servicios.

---

### **Paso 3: Conectar PostgreSQL al Backend**

1. En el panel de Railway, busca la sección **"Service"** del backend
2. Ve a **Settings** → **Connect** (o busca un botón de "Link Service")
3. Selecciona tu servicio de **PostgreSQL**
4. Railway automáticamente agregará la variable `DATABASE_URL`

**O manualmente:**
- Copia el `DATABASE_URL` de tu PostgreSQL:
  ```
  postgresql://postgres:MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa@postgres.railway.internal:5432/railway
  ```
- Agrégalo en las variables del backend

---

### **Paso 4: Verificar Configuración de Build**

Ve a **Settings → Deploy** y verifica que esté configurado:

**Build Command:** (Railway debería detectarlo automáticamente del `railway.json`)
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

**Start Command:**
```bash
python manage.py migrate && gunicorn floreria_cristina.wsgi:application --bind 0.0.0.0:$PORT
```

---

### **Paso 5: Deploy Inicial**

1. Railway hará el **deploy automáticamente** después de conectar con GitHub
2. Monitorea el progreso en **Deployments**
3. Haz clic en **"View Logs"** para ver el proceso en tiempo real

**Busca estos mensajes en los logs:**
```
✅ Building...
✅ Installing dependencies from requirements.txt
✅ Collecting static files
✅ Starting with gunicorn
✅ Application is running
```

---

### **Paso 6: Obtener la URL de tu App**

1. Ve a **Settings → Domains**
2. Railway te asignará un dominio automático como:
   ```
   https://e-comerce-floreria-production.up.railway.app
   ```
3. **Copia esta URL** y agrégala a las variables:
   ```bash
   ALLOWED_HOSTS=*.railway.app,e-comerce-floreria-production.up.railway.app
   CSRF_TRUSTED_ORIGINS=https://e-comerce-floreria-production.up.railway.app
   ```

---

### **Paso 7: Ejecutar Migraciones y Crear Superusuario**

Una vez que el deploy esté corriendo:

#### **Opción A: Desde Railway CLI (Recomendado)**

Instala Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
```

Ejecuta comandos:
```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

#### **Opción B: Desde el Panel de Railway**

1. Ve a tu servicio backend
2. Haz clic en **"Settings"** → **"Deploy"**
3. Busca la opción **"Service Variables"** o **"Command"**
4. Ejecuta manualmente:
   - `python manage.py migrate`
   - `python manage.py createsuperuser`

---

### **Paso 8: Verificar que Todo Funcione**

Accede a tu app desplegada:

1. **Admin Panel:**
   ```
   https://tu-app.railway.app/admin/
   ```
   Deberías ver el login de Django con estilos CSS funcionando

2. **API de Productos:**
   ```
   https://tu-app.railway.app/api/catalogo/productos/
   ```
   Debería devolver JSON con los productos

3. **Health Check:**
   ```
   https://tu-app.railway.app/
   ```

---

## 🔧 Troubleshooting

### Error: "Application failed to start"
**Solución:**
- Verifica los logs en Railway
- Asegúrate que `DATABASE_URL` esté conectada
- Verifica que `SECRET_KEY` esté configurada

### Error: "ModuleNotFoundError"
**Solución:**
- Verifica que `requirements.txt` esté en la raíz del repo
- Haz un nuevo deploy: **Deployments → "Redeploy"**

### Error: "Static files not loading"
**Solución:**
- Ejecuta: `python manage.py collectstatic --noinput`
- Verifica que `whitenoise` esté instalado
- Verifica que `STATIC_ROOT` esté configurado

### Error: "Database connection error"
**Solución:**
- Verifica que PostgreSQL esté corriendo en Railway
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate que ambos servicios estén en el mismo proyecto

---

## 📊 Próximos Pasos (Opcional)

### 1. Dominio Personalizado
- Settings → Domains → "Add Custom Domain"
- Configura los DNS según las instrucciones de Railway

### 2. Variables de Entorno Adicionales
Si decides agregar Redis para Celery:
```bash
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

### 3. Deploy del Frontend (Next.js)
Si quieres deployar el frontend también en Railway:
- Crear nuevo servicio desde el mismo repo
- Root Directory: `/frontend`
- Variables:
  ```bash
  NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
  ```

---

## ✅ Checklist de Verificación

Antes de considerar el deploy completo:

- [ ] Servicio backend creado en Railway
- [ ] Variables de entorno configuradas
- [ ] PostgreSQL conectado
- [ ] Deploy exitoso (sin errores en logs)
- [ ] URL pública accesible
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] Admin panel funciona (con CSS)
- [ ] API responde correctamente
- [ ] MercadoPago configurado

---

## 🆘 Si Necesitas Ayuda

- **Logs en Railway:** Deployments → View Logs
- **Railway Docs:** https://docs.railway.app/
- **Railway Discord:** https://discord.gg/railway

---

**¡Tu app está lista para producción! 🎉**
