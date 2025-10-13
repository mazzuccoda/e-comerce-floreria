# 🚀 Guía de Deployment en Railway

Esta guía te ayudará a deployar tu e-commerce de floristería en Railway paso a paso.

## 📋 Pre-requisitos

- ✅ Cuenta en Railway (https://railway.app)
- ✅ Repositorio en GitHub actualizado
- ✅ PostgreSQL creado en Railway
- ✅ Credenciales de MercadoPago (producción)
- ✅ Credenciales de Email (Gmail SMTP)

---

## 🗄️ Paso 1: Configurar PostgreSQL en Railway

Ya tienes PostgreSQL creado. Anota estas credenciales (las necesitarás):

```
Username: postgres
Password: MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa
Host: postgres.railway.internal
Port: 5432
Database: railway
```

**URL Completa:**
```
postgresql://postgres:MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa@postgres.railway.internal:5432/railway
```

---

## 🔧 Paso 2: Crear el Servicio Backend en Railway

### 2.1 Crear Nuevo Servicio desde GitHub

1. En tu proyecto Railway, haz clic en **"+ New Service"**
2. Selecciona **"GitHub Repo"**
3. Conecta tu repositorio: `e-comerce-floreria`
4. Railway detectará automáticamente que es un proyecto Python/Django

### 2.2 Configurar Variables de Entorno

Ve a **Settings → Variables** y agrega las siguientes variables:

#### **Variables de Django (OBLIGATORIAS)**

```bash
# Django Core
SECRET_KEY=genera-una-clave-segura-aqui-usa-https://djecrety.ir/
DEBUG=False
ALLOWED_HOSTS=*.railway.app,tu-dominio-custom.com

# Railway Detection (Automática)
RAILWAY_ENVIRONMENT=production
```

#### **Variables de Base de Datos (Railway las proporciona automáticamente)**

Railway automáticamente proporciona `DATABASE_URL`. **NO necesitas agregarla manualmente**.

Si prefieres usar variables individuales:

```bash
POSTGRES_DB=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa
POSTGRES_HOST=postgres.railway.internal
POSTGRES_PORT=5432
```

#### **Variables de Email**

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=mazzucoda@gmail.com
EMAIL_HOST_PASSWORD=hrmm pliq wubv qhxy
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

#### **Variables de MercadoPago (PRODUCCIÓN)**

```bash
MP_PUBLIC_KEY=APP_USR-b26d49ff-1026-418d-9dc1-04a6088c3151
MP_ACCESS_TOKEN=APP_USR-3512363478106661-101217-8c574b4c06a425a68262d8733d001c5f-2535754045
```

#### **Variables de Seguridad (Opcional pero Recomendado)**

```bash
SECURE_SSL_REDIRECT=True
CSRF_TRUSTED_ORIGINS=https://tu-app.railway.app
```

### 2.3 Configurar el Build

Railway debería detectar automáticamente el build, pero verifica:

**Settings → Deploy → Build Command:**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

**Settings → Deploy → Start Command:**
```bash
python manage.py migrate && gunicorn floreria_cristina.wsgi:application --bind 0.0.0.0:$PORT
```

**Settings → Deploy → Watch Paths (opcional):**
```
/**
```

---

## 🔗 Paso 3: Conectar PostgreSQL al Backend

1. Ve a tu servicio de **PostgreSQL** en Railway
2. Haz clic en **"Connect"** o **"Variables"**
3. Copia la variable `DATABASE_URL`
4. Ve al servicio de tu **Backend**
5. En **Variables**, agrega (si Railway no lo hizo automáticamente):
   ```bash
   DATABASE_URL=postgresql://postgres:MSYSVuTPprzTIHoMfbmTVYdxrUQqidAa@postgres.railway.internal:5432/railway
   ```

---

## 🚀 Paso 4: Deploy Inicial

1. Railway detectará los cambios y **comenzará el deploy automáticamente**
2. Monitorea los logs en **Deployments → View Logs**
3. Busca errores en el proceso de build o inicio

### Errores Comunes

| Error | Solución |
|-------|----------|
| `ModuleNotFoundError` | Verifica que `requirements.txt` esté completo |
| `SECRET_KEY not set` | Agrega `SECRET_KEY` en Variables |
| `Database connection error` | Verifica que `DATABASE_URL` esté correcta |
| `collectstatic failed` | Verifica que `STATIC_ROOT` esté configurado |

---

## 🗄️ Paso 5: Ejecutar Migraciones y Crear Superusuario

Una vez que el deploy esté corriendo, necesitas ejecutar comandos en el servidor:

### 5.1 Ejecutar Migraciones

En Railway CLI o desde el panel:

```bash
python manage.py migrate
```

### 5.2 Crear Superusuario

```bash
python manage.py createsuperuser
```

### 5.3 Cargar Datos Iniciales (Opcional)

```bash
python manage.py shell
```

Luego ejecuta el contenido de `crear_productos.py` o similar.

---

## 🌐 Paso 6: Configurar Dominio (Opcional)

### 6.1 Usar Dominio de Railway

Railway te proporciona un dominio automático:
```
https://e-comerce-floreria-production.up.railway.app
```

### 6.2 Configurar Dominio Personalizado

1. Ve a **Settings → Domains**
2. Haz clic en **"+ Add Domain"**
3. Ingresa tu dominio: `tutienda.com`
4. Railway te dará instrucciones DNS
5. Actualiza tu DNS con los registros proporcionados

**Actualiza las variables:**
```bash
ALLOWED_HOSTS=*.railway.app,tutienda.com,www.tutienda.com
CSRF_TRUSTED_ORIGINS=https://tutienda.com,https://www.tutienda.com
```

---

## 📱 Paso 7: Deploy del Frontend (Next.js)

Si también quieres deployar el frontend en Railway:

### 7.1 Crear Nuevo Servicio para Frontend

1. **"+ New Service"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio
3. En **Settings → Source → Root Directory**: `/frontend`

### 7.2 Variables de Entorno del Frontend

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NODE_ENV=production
```

### 7.3 Configurar CORS en Backend

Actualiza en las variables del backend:

```bash
CORS_ALLOWED_ORIGINS=https://tu-frontend.railway.app
```

---

## 🔍 Paso 8: Verificar el Deployment

### 8.1 Health Checks

Accede a:
- `https://tu-app.railway.app/admin/` → Admin de Django
- `https://tu-app.railway.app/api/catalogo/productos/` → API de productos

### 8.2 Logs

Monitorea los logs en Railway:
- **Deployments → View Logs**
- Busca errores o warnings

### 8.3 Prueba de Pago

1. Accede al sitio
2. Agrega productos al carrito
3. Completa el checkout
4. Verifica que MercadoPago funcione correctamente

---

## 📊 Paso 9: Monitoreo y Mantenimiento

### 9.1 Monitoreo de Railway

Railway proporciona métricas básicas:
- CPU
- RAM
- Network
- Logs en tiempo real

### 9.2 Backup de Base de Datos

Railway hace backups automáticos, pero también puedes:

```bash
# Exportar datos
python manage.py dumpdata > backup.json

# Importar datos
python manage.py loaddata backup.json
```

### 9.3 Variables de Entorno

Mantén un registro seguro de tus variables de entorno (usar un gestor de contraseñas).

---

## 🔄 Paso 10: CI/CD Automático

Railway hace deploy automático cuando pusheas a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Railway detectará el push y hará el deploy automáticamente.

---

## 🐛 Troubleshooting

### Problema: Build Falla

**Solución:**
1. Verifica `requirements.txt`
2. Revisa logs de build
3. Asegúrate que todas las dependencias sean compatibles

### Problema: App no responde

**Solución:**
1. Verifica que `$PORT` esté en el comando de inicio
2. Revisa logs de runtime
3. Verifica que `ALLOWED_HOSTS` incluya el dominio de Railway

### Problema: Database Connection Error

**Solución:**
1. Verifica que `DATABASE_URL` esté correcta
2. Asegúrate que PostgreSQL esté corriendo
3. Verifica que el backend tenga acceso a PostgreSQL (mismo proyecto)

### Problema: Static Files no se sirven

**Solución:**
1. Verifica que `whitenoise` esté instalado
2. Ejecuta `collectstatic`
3. Verifica `STATIC_ROOT` y `STATIC_URL`

---

## 📞 Soporte

- **Railway Docs:** https://docs.railway.app/
- **Railway Discord:** https://discord.gg/railway
- **Django Docs:** https://docs.djangoproject.com/

---

## ✅ Checklist Final

Antes de considerar el deployment completo:

- [ ] Backend desplegado y accesible
- [ ] PostgreSQL conectado y migraciones ejecutadas
- [ ] Superusuario creado
- [ ] Admin de Django accesible
- [ ] API respondiendo correctamente
- [ ] Archivos estáticos sirviendo (admin CSS/JS funciona)
- [ ] MercadoPago integrado y funcionando
- [ ] Emails configurados y enviando
- [ ] Dominio personalizado configurado (opcional)
- [ ] Frontend desplegado (si aplica)
- [ ] CORS configurado entre frontend y backend
- [ ] Monitoreo activo

---

¡Listo! Tu e-commerce está en producción 🎉
