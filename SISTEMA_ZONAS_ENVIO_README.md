# 🗺️ Sistema de Zonas de Envío con Distance Matrix API

Sistema parametrizable de cálculo de costos de envío basado en distancia real usando Google Maps Distance Matrix API.

---

## 📦 Fase 1: Backend - Base de Datos y API

### ✅ Archivos creados/modificados:

1. **`pedidos/models.py`** - Nuevos modelos:
   - `ShippingConfig` - Configuración general (ubicación tienda, distancias máximas)
   - `ShippingZone` - Zonas de envío con rangos y precios
   - `ShippingPricingRule` - Reglas de envío gratis

2. **`pedidos/shipping_views.py`** - API REST:
   - `GET /api/pedidos/shipping/config/` - Obtener configuración
   - `GET /api/pedidos/shipping/zones/<method>/` - Obtener zonas por método
   - `POST /api/pedidos/shipping/calculate/` - Calcular costo de envío
   - `PUT /api/pedidos/shipping/config/update/` - Actualizar configuración (admin)
   - `POST /api/pedidos/shipping/zones/save/` - Crear/actualizar zona (admin)

3. **`pedidos/api_urls.py`** - URLs configuradas

4. **`pedidos/admin.py`** - Admin de Django configurado

5. **`setup_shipping_zones.py`** - Script de inicialización

---

## 🚀 Instalación

### **Paso 1: Crear migraciones**

```bash
python manage.py makemigrations pedidos
```

### **Paso 2: Aplicar migraciones**

```bash
python manage.py migrate
```

### **Paso 3: Inicializar datos**

```bash
python setup_shipping_zones.py
```

Esto creará:
- ✅ Configuración general con ubicación de tu tienda
- ✅ 3 zonas Express (0-5 km, 5-10 km, 10-15 km)
- ✅ 4 zonas Programado (0-5 km, 5-10 km, 10-15 km, 15-25 km)
- ✅ Reglas de envío gratis (>$50k programado, >$80k express)

---

## 📊 Datos iniciales creados:

### **Configuración General:**
```
Nombre: Florería y Vivero Cristina
Dirección: Av. Solano Vera 480, Yerba Buena, Tucumán
Coordenadas: -26.816700, -65.316700
Max Express: 10 km
Max Programado: 25 km
```

### **Zonas Express:**
| Zona | Rango (km) | Precio |
|------|------------|--------|
| Yerba Buena | 0-5 | $10,000 |
| San Miguel Centro | 5-10 | $15,000 |
| San Miguel Extendido | 10-15 | $20,000 |

### **Zonas Programado:**
| Zona | Rango (km) | Precio |
|------|------------|--------|
| Yerba Buena | 0-5 | $5,000 |
| San Miguel Centro | 5-10 | $7,000 |
| San Miguel Extendido | 10-15 | $10,000 |
| Gran Tucumán | 15-25 | $15,000 |

### **Envío Gratis:**
- Programado: Compras > $50,000
- Express: Compras > $80,000

---

## 🧪 Probar los Endpoints

### **1. Obtener configuración:**
```bash
curl http://localhost:8000/api/pedidos/shipping/config/
```

**Respuesta:**
```json
{
  "store_name": "Florería y Vivero Cristina",
  "store_address": "Av. Solano Vera 480, Yerba Buena, Tucumán",
  "store_lat": -26.816700,
  "store_lng": -65.316700,
  "max_distance_express_km": 10.00,
  "max_distance_programado_km": 25.00,
  "use_distance_matrix": true
}
```

### **2. Obtener zonas Express:**
```bash
curl http://localhost:8000/api/pedidos/shipping/zones/express/
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "zone_name": "Yerba Buena",
    "min_distance_km": 0,
    "max_distance_km": 5,
    "base_price": 10000,
    "price_per_km": 0,
    "zone_order": 1
  },
  ...
]
```

### **3. Calcular costo de envío:**
```bash
curl -X POST http://localhost:8000/api/pedidos/shipping/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "distance_km": 7.5,
    "shipping_method": "express",
    "order_amount": 25000
  }'
```

**Respuesta (dentro de cobertura):**
```json
{
  "available": true,
  "zone_id": 2,
  "zone_name": "San Miguel Centro",
  "distance_km": 7.5,
  "base_price": 15000,
  "shipping_cost": 15000,
  "is_free_shipping": false,
  "free_shipping_threshold": 80000
}
```

**Respuesta (fuera de cobertura):**
```json
{
  "available": false,
  "error": "Fuera de zona de cobertura",
  "max_distance_km": 10.00,
  "distance_km": 12.5
}
```

**Respuesta (envío gratis):**
```json
{
  "available": true,
  "zone_id": 1,
  "zone_name": "Yerba Buena",
  "distance_km": 3.2,
  "base_price": 5000,
  "shipping_cost": 0,
  "is_free_shipping": true,
  "free_shipping_threshold": 50000
}
```

---

## 🎛️ Administración desde Django Admin

Accede a: `http://localhost:8000/admin/`

### **Secciones disponibles:**

1. **Configuración de Envíos** (`ShippingConfig`)
   - Editar ubicación del negocio
   - Cambiar distancias máximas
   - Actualizar coordenadas GPS

2. **Zonas de Envío** (`ShippingZone`)
   - Crear/editar zonas
   - Cambiar precios
   - Activar/desactivar zonas
   - Editar rangos de distancia

3. **Reglas de Precios** (`ShippingPricingRule`)
   - Configurar envío gratis
   - Definir cargos mínimos
   - Activar/desactivar reglas

---

## 🔧 Personalización

### **Cambiar ubicación del negocio:**

1. Ir a Django Admin → Configuración de Envíos
2. Editar coordenadas (lat, lng)
3. O usar el endpoint:

```bash
curl -X PUT http://localhost:8000/api/pedidos/shipping/config/update/ \
  -H "Content-Type: application/json" \
  -d '{
    "store_lat": -26.816700,
    "store_lng": -65.316700,
    "store_address": "Nueva dirección"
  }'
```

### **Agregar nueva zona:**

1. Ir a Django Admin → Zonas de Envío → Agregar
2. O usar el endpoint:

```bash
curl -X POST http://localhost:8000/api/pedidos/shipping/zones/save/ \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_method": "programado",
    "zone_name": "Zona Nueva",
    "min_distance_km": 25,
    "max_distance_km": 35,
    "base_price": 20000,
    "price_per_km": 0,
    "zone_order": 5
  }'
```

### **Cambiar precios:**

Desde Django Admin → Zonas de Envío → Editar en línea (list_editable)

---

## 📝 Próximos pasos (Fase 2):

- [ ] Crear servicio de Distance Matrix en frontend
- [ ] Crear hook `useShippingConfig`
- [ ] Mejorar componente `AddressMapPicker`
- [ ] Integrar en checkout
- [ ] Agregar círculos de cobertura en mapa
- [ ] Implementar feedback visual

---

## 💰 Costos

- **Distance Matrix API**: $0.005 USD por request
- **Cuota gratis**: 40,000 requests/mes
- **Tu caso**: GRATIS (hasta ~1,300 pedidos/día)

---

## ✅ Checklist de instalación:

- [x] Modelos creados
- [x] Migraciones creadas
- [x] Migraciones aplicadas
- [x] Datos iniciales cargados
- [x] Admin configurado
- [x] Endpoints funcionando
- [ ] Frontend integrado (Fase 2)

---

## 🐛 Troubleshooting

### **Error: "No module named 'pedidos.shipping_views'"**
```bash
# Asegúrate de que el archivo existe
ls pedidos/shipping_views.py

# Reinicia el servidor
python manage.py runserver
```

### **Error: "No such table: pedidos_shippingconfig"**
```bash
# Aplicar migraciones
python manage.py migrate
```

### **No aparecen datos en el admin**
```bash
# Ejecutar script de inicialización
python setup_shipping_zones.py
```

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs del servidor Django
2. Migraciones aplicadas: `python manage.py showmigrations`
3. Datos en BD: `python manage.py shell` → `from pedidos.models import ShippingConfig; ShippingConfig.objects.all()`

---

¡Sistema de backend listo! 🎉
