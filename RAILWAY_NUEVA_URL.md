# 🔄 Actualización de URL en Railway

## Nueva URL del Frontend
**Antes**: `https://frontend-production-0b0b.up.railway.app`
**Ahora**: `https://floreriayviverocristian.up.railway.app`

## Cambios Realizados en el Código

### 1. Backend - `floreria_cristina/settings.py`
✅ Actualizado `CORS_ALLOWED_ORIGINS`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:80',
    'https://floreriayviverocristian.up.railway.app',  # ✅ NUEVA URL
    'https://frontend-production-0b0b.up.railway.app',  # Mantener por compatibilidad
    'https://frontend-production-7249.up.railway.app',  # Mantener por compatibilidad
    *env.list('CORS_ALLOWED_ORIGINS', default=[]),
]
```

✅ `CSRF_TRUSTED_ORIGINS` ya incluye `*.railway.app` (no requiere cambios)

### 2. Backend - `pedidos/mercadopago_service.py`
✅ Actualizado URL por defecto para MercadoPago:
```python
base_url = os.getenv('FRONTEND_URL', 'https://floreriayviverocristian.up.railway.app')
```

## Variables de Entorno en Railway

### 🎯 Backend Service (Django)

Agregar o actualizar estas variables:

```bash
# Frontend URL (para MercadoPago redirects)
FRONTEND_URL=https://floreriayviverocristian.up.railway.app

# CORS (opcional, ya está en el código)
CORS_ALLOWED_ORIGINS=https://floreriayviverocristian.up.railway.app

# CSRF (opcional, ya está en el código)
CSRF_TRUSTED_ORIGINS=https://floreriayviverocristian.up.railway.app,https://e-comerce-floreria-production.up.railway.app
```

### 🎨 Frontend Service (Next.js)

Verificar que tenga:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app/api
```

## Pasos para Aplicar los Cambios

### 1. Hacer Deploy del Backend
```bash
git add .
git commit -m "Actualizar URL frontend a floreriayviverocristian.up.railway.app"
git push origin master
```

### 2. Verificar Variables en Railway

#### Backend:
1. Ve a tu proyecto en Railway
2. Selecciona el servicio **Backend (Django)**
3. Ve a **Variables**
4. Agrega o actualiza:
   - `FRONTEND_URL=https://floreriayviverocristian.up.railway.app`

#### Frontend:
1. Selecciona el servicio **Frontend (Next.js)**
2. Ve a **Variables**
3. Verifica que tenga:
   - `NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app/api`

### 3. Redeploy (si es necesario)
Railway hará redeploy automáticamente al hacer push, pero si necesitas forzarlo:
1. Ve al servicio en Railway
2. Click en **Deploy** → **Redeploy**

## Verificación

### ✅ Checklist de Funcionalidad

Después del deploy, verifica que funcione:

1. **CORS**: 
   - [ ] Abre `https://floreriayviverocristian.up.railway.app`
   - [ ] Abre DevTools → Console
   - [ ] No debe haber errores de CORS

2. **API Calls**:
   - [ ] Los productos se cargan correctamente
   - [ ] El carrito funciona
   - [ ] El checkout funciona

3. **MercadoPago**:
   - [ ] Crear un pedido de prueba
   - [ ] Verificar que redirija correctamente después del pago
   - [ ] URLs de success/failure/pending deben usar la nueva URL

4. **Imágenes**:
   - [ ] El carrusel muestra las imágenes
   - [ ] Las imágenes de productos cargan

## URLs Importantes

### Frontend
- **Producción**: https://floreriayviverocristian.up.railway.app
- **Antigua (compatibilidad)**: https://frontend-production-0b0b.up.railway.app

### Backend
- **API**: https://e-comerce-floreria-production.up.railway.app/api
- **Admin**: https://e-comerce-floreria-production.up.railway.app/admin

### Endpoints Clave
- Productos: `/api/catalogo/productos/`
- Carrito: `/api/carrito/`
- Checkout: `/api/pedidos/crear/`
- MercadoPago: `/api/pedidos/crear-preferencia-mp/`

## Compatibilidad

Las URLs antiguas se mantienen en `CORS_ALLOWED_ORIGINS` para:
- Evitar romper sesiones existentes
- Permitir transición gradual
- Debugging si algo falla

Puedes removerlas después de confirmar que todo funciona con la nueva URL.

## Troubleshooting

### Problema: Error de CORS
**Solución**: 
1. Verifica que `FRONTEND_URL` esté configurada en Railway
2. Haz redeploy del backend
3. Limpia caché del navegador

### Problema: MercadoPago no redirige correctamente
**Solución**:
1. Verifica `FRONTEND_URL` en variables de Railway
2. Revisa los logs del backend: `railway logs`
3. Verifica que las URLs en la preferencia de MP sean correctas

### Problema: Imágenes no cargan
**Solución**:
1. Verifica que `res.cloudinary.com` esté en `next.config.js`
2. Las URLs de Cloudinary deben ser directas (no usar Next Image optimization)

## Resumen

✅ **Backend actualizado** con nueva URL en CORS y MercadoPago
✅ **Compatibilidad mantenida** con URLs antiguas
✅ **Variables de entorno** documentadas
✅ **Checklist de verificación** incluido

**Próximo paso**: Hacer commit y push para deployar los cambios.
