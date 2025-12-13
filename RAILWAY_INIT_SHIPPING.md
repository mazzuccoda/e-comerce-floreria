# Inicializar Shipping Zones en Railway

## Problema
El frontend no muestra los círculos de cobertura ni calcula distancias porque **no hay datos de ShippingConfig en la base de datos de Railway**.

## Solución

### Opción 1: Ejecutar comando desde Railway CLI

1. **Conectar a Railway:**
   ```bash
   railway login
   railway link
   ```

2. **Ejecutar comando de inicialización:**
   ```bash
   railway run python manage.py init_shipping_config
   ```

### Opción 2: Ejecutar desde el admin de Django

1. **Ve al admin de Django:**
   ```
   https://e-comerce-floreria-production.up.railway.app/admin/
   ```

2. **Crea manualmente:**
   - **Configuración de Envíos** (debe haber solo 1):
     - Store name: `Florería Cristina`
     - Store address: `Av. Solano Vera 480, Yerba Buena, Tucumán`
     - Store lat: `-26.8167`
     - Store lng: `-65.3167`
     - Max distance express km: `5.00`
     - Max distance programado km: `11.00`
     - Use distance matrix: ✅

   - **Zonas de Envío Express**:
     1. Yerba Buena Centro (0-3 km): Base $5,000 + $0/km
     2. Yerba Buena Extendido (3-5 km): Base $7,000 + $500/km

   - **Zonas de Envío Programado**:
     1. Yerba Buena (0-5 km): Base $5,000 + $0/km
     2. San Miguel Centro (5-8 km): Base $7,000 + $500/km
     3. San Miguel Extendido (8-11 km): Base $10,000 + $800/km

### Opción 3: Agregar comando al railway_start.sh

Edita `railway_start.sh` y agrega antes de `gunicorn`:

```bash
echo "Inicializando shipping zones..."
python manage.py init_shipping_config
```

## Verificar

Una vez ejecutado, verifica que funciona:

1. **API de config:**
   ```
   https://e-comerce-floreria-production.up.railway.app/api/pedidos/shipping/config/
   ```
   Debe retornar JSON con `store_lat`, `store_lng`, etc.

2. **API de zonas:**
   ```
   https://e-comerce-floreria-production.up.railway.app/api/pedidos/shipping/zones/express/
   https://e-comerce-floreria-production.up.railway.app/api/pedidos/shipping/zones/programado/
   ```
   Deben retornar arrays con las zonas.

3. **Frontend:**
   - Recarga la página de checkout
   - Abre consola (F12)
   - Busca: `📦 Shipping Config cargada`
   - Deberías ver los círculos en el mapa

## Datos Creados

### ShippingConfig
- Tienda: Florería Cristina
- Ubicación: -26.8167, -65.3167 (Yerba Buena)
- Express: hasta 5 km
- Programado: hasta 11 km

### Zonas Express (2)
1. **Yerba Buena Centro** (0-3 km)
   - Base: $5,000
   - Por km: $0
   
2. **Yerba Buena Extendido** (3-5 km)
   - Base: $7,000
   - Por km: $500

### Zonas Programado (3)
1. **Yerba Buena** (0-5 km)
   - Base: $5,000
   - Por km: $0
   
2. **San Miguel Centro** (5-8 km)
   - Base: $7,000
   - Por km: $500
   
3. **San Miguel Extendido** (8-11 km)
   - Base: $10,000
   - Por km: $800

## Ejemplo de Cálculo

**Dirección a 7.5 km (Programado):**
- Zona: San Miguel Centro (5-8 km)
- Cálculo: $7,000 (base) + (7.5 km × $500/km) = $7,000 + $3,750 = **$10,750**

**Dirección a 2 km (Express):**
- Zona: Yerba Buena Centro (0-3 km)
- Cálculo: $5,000 (base) + (2 km × $0/km) = **$5,000**
