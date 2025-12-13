# 🚀 INSTRUCCIONES SIMPLES - Deploy Sistema de Zonas

## ✅ TODO ESTÁ LISTO - Solo necesitas 2 pasos:

---

## 📋 PASO 1: GIT (Local)

```bash
# 1. Ver archivos nuevos
git status

# 2. Agregar todo
git add .

# 3. Commit (un solo commit)
git commit -m "feat: Sistema de zonas de envío con Distance Matrix API

- Modelos: ShippingConfig, ShippingZone, ShippingPricingRule
- API REST: 5 endpoints para gestión de zonas
- Admin Django configurado
- Script de inicialización con datos de Tucumán
- Zonas Express (3) y Programado (4)
- Envío gratis configurado
- Documentación completa"

# 4. Push
git push origin master
```

---

## 📋 PASO 2: RAILWAY (Automático)

### **Railway hará TODO automáticamente:**

1. ✅ Detecta el push
2. ✅ Ejecuta `railway_start.sh`
3. ✅ Aplica migraciones (`python manage.py migrate`)
4. ✅ Reinicia el servicio

### **Lo ÚNICO que necesitas hacer manualmente (SOLO LA PRIMERA VEZ):**

Después de que Railway termine el deploy, ejecuta **UNA SOLA VEZ**:

```bash
railway run python setup_shipping_zones.py
```

Esto cargará los datos iniciales (zonas, precios, configuración).

---

## 🔍 VERIFICAR

### **1. Ver logs de Railway:**
```bash
railway logs
```

Buscar:
- ✅ "Migrations applied successfully"
- ✅ "Starting server"

### **2. Probar endpoint:**
```bash
curl https://tu-app.railway.app/api/pedidos/shipping/config/
```

Debería retornar JSON con la configuración.

### **3. Acceder al admin:**
```
https://tu-app.railway.app/admin/
```

Deberías ver 3 nuevas secciones:
- Configuración de Envíos
- Zonas de Envío
- Reglas de Precios

---

## ❌ NO NECESITAS:

- ❌ Ejecutar migraciones manualmente en Railway (se hace automático)
- ❌ Docker para Railway (Railway usa su propio contenedor)
- ❌ Comandos complicados

---

## ✅ RESUMEN:

```bash
# LOCAL - Git
git add .
git commit -m "feat: Sistema de zonas de envío con Distance Matrix API"
git push origin master

# RAILWAY - Solo la primera vez después del deploy
railway run python setup_shipping_zones.py

# VERIFICAR
railway logs
curl https://tu-app.railway.app/api/pedidos/shipping/config/
```

---

## 🎯 Eso es todo!

Railway se encarga de:
- ✅ Build
- ✅ Migraciones
- ✅ Deploy
- ✅ Reinicio

Tú solo:
1. Push a Git
2. Esperar deploy
3. Ejecutar `railway run python setup_shipping_zones.py` (solo primera vez)

---

## 📞 Si algo falla:

```bash
# Ver qué pasó
railway logs --tail 100

# Si las migraciones no se aplicaron
railway run python manage.py migrate

# Si los datos no se cargaron
railway run python setup_shipping_zones.py
```

---

¡Listo! 🚀
