# 📋 Checklist de Endpoints - E-commerce Florería

## ✅ Estado de Configuración

### Backend URLs Configuradas:
- **Producción**: `https://e-comerce-floreria-production.up.railway.app`
- **Desarrollo**: `http://localhost:8000`

---

## 🔌 API Routes del Frontend

### 1. `/api/productos` - Lista de productos
- **Archivo**: `frontend/app/api/productos/route.ts`
- **Backend URL**: ✅ Corregida
- **Endpoint destino**: `${BACKEND_URL}/api/catalogo/productos/`
- **Método**: GET
- **Parámetros**: Acepta query params (tipo_flor, ocasion, etc.)

### 2. `/api/productos/[id]` - Detalle de producto
- **Archivo**: `frontend/app/api/productos/[id]/route.ts`
- **Backend URL**: ✅ Corregida
- **Endpoint destino**: `${BACKEND_URL}/api/catalogo/productos/${id}/`
- **Método**: GET
- **Params**: Next.js 15 Promise-based

### 3. `/api/tipos-flor` - Tipos de flor
- **Archivo**: `frontend/app/api/tipos-flor/route.ts`
- **Backend URL**: ✅ Corregida
- **Endpoint destino**: `${BACKEND_URL}/api/catalogo/tipos-flor/`
- **Método**: GET
- **Uso**: Navbar dropdowns

### 4. `/api/ocasiones` - Ocasiones
- **Archivo**: `frontend/app/api/ocasiones/route.ts`
- **Backend URL**: ✅ Corregida
- **Endpoint destino**: `${BACKEND_URL}/api/catalogo/ocasiones/`
- **Método**: GET
- **Uso**: Navbar dropdowns

---

## 🎯 Páginas y sus Endpoints

### Homepage (`/`)
- **Componente**: `ProductListClient` con `showRecommended={true}`
- **API llamada**: `/api/productos?destacados=true`
- **Estado**: ✅ Debería funcionar

### Productos (`/productos`)
- **Componente**: `ProductListClient` con `showFilters={true}`
- **API llamada**: `/api/productos` + query params de URL
- **Filtros URL**: `?tipo_flor=X&ocasion=Y`
- **Estado**: ✅ Debería funcionar

### Detalle Producto (`/productos/[slug]`)
- **Componente**: `ProductPage`
- **API llamada**: `/api/productos/${id}`
- **Params**: Promise-based (Next.js 15)
- **Estado**: ✅ Corregido

### Navbar
- **Dropdowns**: Tipos de flor y Ocasiones
- **APIs llamadas**: 
  - `/api/tipos-flor` (desde `NEXT_PUBLIC_API_URL`)
  - `/api/ocasiones` (desde `NEXT_PUBLIC_API_URL`)
- **Control**: JavaScript state (onMouseEnter/Leave)
- **Estado**: ✅ Corregido

---

## 🔍 Problemas Conocidos y Soluciones

### ❌ Error 404 en `/api/productos/[id]`
**Causa**: Railway puede no haber desplegado aún los cambios
**Solución**: Esperar 2-3 minutos al despliegue

### ❌ Dropdowns no aparecen
**Causa**: APIs de tipos-flor/ocasiones usan URL incorrecta
**Solución**: ✅ Ya corregido en último commit

### ❌ Filtros no funcionan
**Causa**: ProductListClient no captura params de URL
**Solución**: ✅ Ya usa useSearchParams correctamente

---

## 🧪 Cómo Probar

### 1. Verificar que Railway desplegó:
```bash
# Ir a Railway dashboard
# Ver "Deployments" del servicio Frontend
# Verificar que el último commit (c58db9e) esté desplegado
```

### 2. Probar endpoints manualmente:
```bash
# Tipos de flor
https://frontend-production-0b0b.up.railway.app/api/tipos-flor

# Ocasiones
https://frontend-production-0b0b.up.railway.app/api/ocasiones

# Productos
https://frontend-production-0b0b.up.railway.app/api/productos

# Producto individual
https://frontend-production-0b0b.up.railway.app/api/productos/1
```

### 3. Probar en navegador:
1. Ir a `/productos`
2. Abrir consola (F12)
3. Pasar mouse sobre "Tipo de flor"
4. Verificar logs de carga
5. Click en un tipo
6. Verificar que filtra

---

## 📝 Variables de Entorno Necesarias

### Frontend (Railway):
```bash
NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app/api
NODE_ENV=production
```

### Backend (Railway):
```bash
DATABASE_URL=postgresql://...
DJANGO_SETTINGS_MODULE=backend.settings
ALLOWED_HOSTS=e-comerce-floreria-production.up.railway.app
```

---

## 🚨 Siguiente Paso

**ESPERAR** a que Railway termine el despliegue del commit `c58db9e` (FixBackendURLs)

Luego probar en este orden:
1. ✅ Homepage carga productos
2. ✅ Navbar dropdowns funcionan
3. ✅ Página /productos carga
4. ✅ Filtros funcionan
5. ✅ Click en producto abre detalle
