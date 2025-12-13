# 🚂 Deploy Sistema de Zonas de Envío en Railway

## 📋 Checklist Pre-Deploy

- [ ] Código pusheado a Git
- [ ] Migraciones creadas localmente
- [ ] Variables de entorno configuradas en Railway
- [ ] Google Maps API Key configurada

---

## 🔧 Variables de Entorno Requeridas

Asegúrate de tener estas variables en Railway:

```bash
# Google Maps API Key (REQUERIDA)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# Database (ya configurada)
DATABASE_URL=postgresql://...

# Django Settings (ya configuradas)
DJANGO_SETTINGS_MODULE=floreria_cristina.settings
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=...
```

---

## 🚀 Pasos para Deploy en Railway

### **1. Push a Git**

```bash
# Agregar todos los archivos nuevos
git add .

# Commit con mensaje descriptivo
git commit -m "feat: Sistema de zonas de envío con Distance Matrix API

- Modelos: ShippingConfig, ShippingZone, ShippingPricingRule
- API REST: 5 endpoints para gestión de zonas
- Admin Django configurado
- Script de inicialización de datos
- Zonas Express y Programado configuradas"

# Push a master
git push origin master
```

### **2. Railway detectará el push automáticamente**

Railway ejecutará automáticamente:
- Build del proyecto
- Instalación de dependencias
- Migraciones (si está configurado en `railway_start.sh`)

### **3. Ejecutar migraciones manualmente (si es necesario)**

Si las migraciones no se ejecutan automáticamente:

```bash
# Opción A: Desde Railway CLI
railway run python manage.py migrate

# Opción B: Desde el dashboard de Railway
# Settings → Deploy → Run Command
python manage.py migrate
```

### **4. Inicializar datos de zonas**

```bash
# Desde Railway CLI
railway run python setup_shipping_zones.py

# O desde el dashboard
# Settings → Deploy → Run Command
python setup_shipping_zones.py
```

---

## 🔍 Verificar Deploy

### **1. Verificar que las migraciones se aplicaron:**

```bash
railway run python manage.py showmigrations pedidos
```

Deberías ver algo como:
```
pedidos
 [X] 0001_initial
 [X] 0002_auto_...
 [X] 0003_shippingconfig_shippingzone_shippingpricingrule  ← NUEVA
```

### **2. Verificar que los datos se cargaron:**

```bash
railway run python manage.py shell
```

```python
from pedidos.models import ShippingConfig, ShippingZone
print(f"Config: {ShippingConfig.objects.count()}")
print(f"Zonas: {ShippingZone.objects.count()}")
# Debería mostrar: Config: 1, Zonas: 7
```

### **3. Probar endpoints en producción:**

```bash
# Obtener configuración
curl https://tu-app.railway.app/api/pedidos/shipping/config/

# Obtener zonas Express
curl https://tu-app.railway.app/api/pedidos/shipping/zones/express/

# Calcular costo
curl -X POST https://tu-app.railway.app/api/pedidos/shipping/calculate/ \
  -H "Content-Type: application/json" \
  -d '{"distance_km": 7.5, "shipping_method": "express", "order_amount": 25000}'
```

---

## 🔄 Actualizar railway_start.sh (Opcional)

Si quieres que las migraciones se ejecuten automáticamente en cada deploy:

```bash
# Editar railway_start.sh
#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Ejecutar migraciones
echo "📦 Running migrations..."
python manage.py migrate --noinput

# Inicializar datos de shipping (solo si no existen)
echo "🗺️ Checking shipping data..."
python -c "
from pedidos.models import ShippingConfig
if not ShippingConfig.objects.exists():
    import os
    os.system('python setup_shipping_zones.py')
"

# Recolectar archivos estáticos
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Iniciar servidor
echo "✅ Starting server..."
gunicorn floreria_cristina.wsgi:application --bind 0.0.0.0:$PORT
```

---

## 🐛 Troubleshooting

### **Error: "No such table: pedidos_shippingconfig"**

```bash
# Ejecutar migraciones manualmente
railway run python manage.py migrate
```

### **Error: "Google Maps API Key not found"**

```bash
# Verificar variable de entorno
railway variables

# Agregar si falta
railway variables set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_key
```

### **Los datos no se cargan**

```bash
# Ejecutar script manualmente
railway run python setup_shipping_zones.py
```

### **Endpoints devuelven 404**

- Verificar que el servidor se reinició después del deploy
- Verificar logs: `railway logs`
- Verificar que las URLs están correctamente configuradas

---

## 📊 Monitoreo Post-Deploy

### **1. Verificar logs:**

```bash
railway logs --tail 100
```

Buscar:
- ✅ "Migrations applied successfully"
- ✅ "Sistema listo para usar!"
- ❌ Errores de importación
- ❌ Errores de base de datos

### **2. Verificar admin:**

```
https://tu-app.railway.app/admin/
```

Deberías ver:
- Configuración de Envíos (1 registro)
- Zonas de Envío (7 registros)
- Reglas de Precios (2 registros)

### **3. Verificar API:**

```bash
# Health check
curl https://tu-app.railway.app/api/pedidos/shipping/config/

# Debería retornar JSON con la configuración
```

---

## ✅ Checklist Post-Deploy

- [ ] Migraciones aplicadas
- [ ] Datos inicializados
- [ ] Endpoints funcionando
- [ ] Admin accesible
- [ ] Google Maps API Key configurada
- [ ] Logs sin errores
- [ ] Frontend puede consumir la API

---

## 🎯 Próximos Pasos (Fase 2)

Una vez que el backend esté funcionando en Railway:

1. **Frontend - Servicio Distance Matrix**
   - Crear `distanceService.ts`
   - Integrar Google Maps Distance Matrix API

2. **Frontend - Hook de Shipping**
   - Crear `useShippingConfig.ts`
   - Consumir endpoints del backend

3. **Frontend - Checkout**
   - Integrar cálculo de distancia
   - Mostrar costo de envío dinámico
   - Agregar círculos de cobertura en mapa

4. **Testing**
   - Probar flujo completo
   - Verificar cálculos de distancia
   - Validar envío gratis

---

## 📞 Comandos Útiles Railway

```bash
# Ver logs en tiempo real
railway logs

# Ejecutar comando
railway run <comando>

# Conectar a la base de datos
railway connect postgres

# Ver variables de entorno
railway variables

# Reiniciar servicio
railway restart
```

---

¡Listo para deploy! 🚀
