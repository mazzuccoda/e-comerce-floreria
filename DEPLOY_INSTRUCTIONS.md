# 🚀 Instrucciones de Deploy - Sistema de Zonas de Envío

## 📦 Archivos Nuevos Creados

### **Backend:**
```
pedidos/models.py                    ← 3 modelos nuevos agregados
pedidos/shipping_views.py            ← 5 endpoints REST
pedidos/api_urls.py                  ← URLs actualizadas
pedidos/admin.py                     ← Admin configurado
setup_shipping_zones.py              ← Script de inicialización
```

### **Scripts de Deploy:**
```
deploy_shipping_zones.sh             ← Script Bash (Linux/Mac)
deploy_shipping_zones.ps1            ← Script PowerShell (Windows)
RAILWAY_SHIPPING_DEPLOY.md          ← Guía de deploy Railway
SISTEMA_ZONAS_ENVIO_README.md       ← Documentación técnica
DEPLOY_INSTRUCTIONS.md               ← Este archivo
```

---

## 🎯 PASOS PARA DEPLOY

### **1️⃣ Local - Ejecutar Migraciones (Docker)**

```powershell
# Opción A: Usar script PowerShell (RECOMENDADO)
.\deploy_shipping_zones.ps1

# Opción B: Comandos manuales
docker compose exec web python manage.py makemigrations pedidos
docker compose exec web python manage.py migrate
docker compose exec web python setup_shipping_zones.py
docker compose restart web
```

### **2️⃣ Verificar Local**

```bash
# Probar endpoint
curl http://localhost:8000/api/pedidos/shipping/config/

# Debería retornar:
{
  "store_name": "Florería y Vivero Cristina",
  "store_address": "Av. Solano Vera 480, Yerba Buena, Tucumán",
  "store_lat": -26.816700,
  "store_lng": -65.316700,
  ...
}
```

### **3️⃣ Git - Commit y Push**

```bash
# Ver cambios
git status

# Agregar todos los archivos
git add .

# Commit
git commit -m "feat: Sistema de zonas de envío con Distance Matrix API

- Modelos: ShippingConfig, ShippingZone, ShippingPricingRule
- API REST: 5 endpoints para gestión de zonas
- Admin Django configurado con fieldsets personalizados
- Script de inicialización con datos de Tucumán
- Zonas Express (3) y Programado (4) configuradas
- Reglas de envío gratis implementadas
- Documentación completa incluida"

# Push a master
git push origin master
```

### **4️⃣ Railway - Deploy Automático**

Railway detectará el push y:
- ✅ Ejecutará `railway_start.sh`
- ✅ Aplicará migraciones automáticamente
- ✅ Reiniciará el servicio

### **5️⃣ Railway - Inicializar Datos (Primera vez)**

```bash
# Solo la PRIMERA VEZ después del deploy
railway run python setup_shipping_zones.py
```

### **6️⃣ Verificar en Railway**

```bash
# Ver logs
railway logs --tail 50

# Probar endpoint en producción
curl https://tu-app.railway.app/api/pedidos/shipping/config/
```

---

## 📊 Datos que se Crearán

### **Configuración General:**
- Ubicación: Av. Solano Vera 480, Yerba Buena, Tucumán
- Coordenadas: -26.816700, -65.316700
- Max Express: 10 km
- Max Programado: 25 km

### **Zonas Express (3):**
| Zona | Rango | Precio |
|------|-------|--------|
| Yerba Buena | 0-5 km | $10,000 |
| San Miguel Centro | 5-10 km | $15,000 |
| San Miguel Extendido | 10-15 km | $20,000 |

### **Zonas Programado (4):**
| Zona | Rango | Precio |
|------|-------|--------|
| Yerba Buena | 0-5 km | $5,000 |
| San Miguel Centro | 5-10 km | $7,000 |
| San Miguel Extendido | 10-15 km | $10,000 |
| Gran Tucumán | 15-25 km | $15,000 |

### **Envío Gratis:**
- Programado: Compras > $50,000
- Express: Compras > $80,000

---

## 🔧 Endpoints Disponibles

```
GET  /api/pedidos/shipping/config/
     → Obtener configuración general

GET  /api/pedidos/shipping/zones/express/
GET  /api/pedidos/shipping/zones/programado/
     → Obtener zonas por método

POST /api/pedidos/shipping/calculate/
     Body: {"distance_km": 7.5, "shipping_method": "express", "order_amount": 25000}
     → Calcular costo de envío

PUT  /api/pedidos/shipping/config/update/
     → Actualizar configuración (admin)

POST /api/pedidos/shipping/zones/save/
     → Crear/actualizar zona (admin)
```

---

## 🎨 Admin Django

Acceder a: `https://tu-app.railway.app/admin/`

### **Nuevas secciones:**
1. **Configuración de Envíos** - Editar ubicación y distancias máximas
2. **Zonas de Envío** - Gestionar zonas y precios
3. **Reglas de Precios** - Configurar envío gratis

---

## ✅ Checklist de Deploy

### **Pre-Deploy:**
- [x] Modelos creados
- [x] API REST implementada
- [x] Admin configurado
- [x] Script de inicialización creado
- [x] Documentación completa
- [ ] Migraciones ejecutadas localmente
- [ ] Datos verificados localmente

### **Deploy:**
- [ ] Commit realizado
- [ ] Push a master
- [ ] Railway build exitoso
- [ ] Migraciones aplicadas en Railway
- [ ] Datos inicializados en Railway
- [ ] Endpoints funcionando en producción

### **Post-Deploy:**
- [ ] Verificar admin en producción
- [ ] Probar endpoints con Postman/curl
- [ ] Verificar logs sin errores
- [ ] Documentar URL de producción

---

## 🐛 Troubleshooting

### **Error: "No such table: pedidos_shippingconfig"**
```bash
# Railway
railway run python manage.py migrate

# Local
docker compose exec web python manage.py migrate
```

### **Error: "No shipping config found"**
```bash
# Ejecutar script de inicialización
railway run python setup_shipping_zones.py
```

### **Endpoints devuelven 404**
```bash
# Verificar que las URLs están registradas
railway run python manage.py show_urls | grep shipping
```

---

## 📝 Próximos Pasos (Fase 2 - Frontend)

Después del deploy exitoso:

1. **Crear servicio Distance Matrix** (`distanceService.ts`)
2. **Crear hook de shipping** (`useShippingConfig.ts`)
3. **Mejorar AddressMapPicker** (círculos de cobertura)
4. **Integrar en checkout** (cálculo dinámico)
5. **Agregar feedback visual** (dentro/fuera de zona)

---

## 🎯 Comandos Rápidos

```bash
# Local - Deploy completo
.\deploy_shipping_zones.ps1

# Git - Commit y push
git add . && git commit -m "feat: Sistema de zonas de envío" && git push origin master

# Railway - Ver logs
railway logs

# Railway - Ejecutar comando
railway run python manage.py <comando>

# Railway - Inicializar datos
railway run python setup_shipping_zones.py
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisar logs: `railway logs` o `docker compose logs web`
2. Verificar migraciones: `python manage.py showmigrations`
3. Verificar datos: `python manage.py shell` → `from pedidos.models import ShippingConfig`

---

¡Todo listo para deploy! 🚀
