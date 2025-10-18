# 🗺️ Guía de Instalación - Mapa Interactivo con Google Maps

## ✅ Archivos Creados

### Frontend:
1. ✅ `frontend/package.json` - Dependencia agregada
2. ✅ `frontend/src/types/Address.ts` - Tipos TypeScript
3. ✅ `frontend/app/components/AddressMapPicker.tsx` - Componente principal
4. ✅ `frontend/.env.local.example` - Ejemplo de variables de entorno

### Backend:
5. ✅ `pedidos/views_zones.py` - API de validación de zonas
6. ✅ `pedidos/api_urls.py` - Rutas agregadas

---

## 📦 Paso 1: Instalar Dependencias

### En Docker (Recomendado):

```bash
# Detener el contenedor frontend
docker-compose stop frontend

# Entrar al contenedor
docker-compose run --rm frontend sh

# Instalar dependencias
npm install

# Salir del contenedor
exit

# Reiniciar el frontend
docker-compose up -d frontend
```

### Local (Alternativa):

```bash
cd frontend
npm install
```

---

## 🔑 Paso 2: Obtener API Key de Google Maps

### 2.1 Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "Floreria Cristina Maps"

### 2.2 Habilitar APIs Necesarias

En el menú lateral → **APIs & Services** → **Library**

Busca y habilita estas 3 APIs:
- ✅ **Maps JavaScript API**
- ✅ **Places API**
- ✅ **Geocoding API**

### 2.3 Crear Credenciales (API Key)

1. Ve a **APIs & Services** → **Credentials**
2. Click en **+ CREATE CREDENTIALS** → **API Key**
3. Copia la API Key generada

### 2.4 Restringir la API Key (IMPORTANTE)

Click en la API Key recién creada → **Edit**

**Para Desarrollo:**
```
Application restrictions: None
API restrictions: Restrict key
  ✅ Maps JavaScript API
  ✅ Places API
  ✅ Geocoding API
```

**Para Producción:**
```
Application restrictions: HTTP referrers
  Add: https://tu-dominio.com/*
  Add: https://www.tu-dominio.com/*
  
API restrictions: Restrict key
  ✅ Maps JavaScript API
  ✅ Places API
  ✅ Geocoding API
```

---

## 🔧 Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env.local

```bash
cd frontend
cp .env.local.example .env.local
```

### 3.2 Editar .env.local

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...tu_api_key_aqui
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.3 Para Docker

Agregar al `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - NEXT_PUBLIC_API_URL=http://web:8000
```

Y crear `.env` en la raíz:

```bash
# .env (raíz del proyecto)
GOOGLE_MAPS_API_KEY=AIzaSy...tu_api_key_aqui
```

---

## 🚀 Paso 4: Integrar en el Checkout

Ahora necesitas integrar el componente en tu página de checkout.

### Opción A: Integración Básica

```typescript
// app/checkout/page.tsx
import AddressMapPicker from '@/components/AddressMapPicker';
import { AddressData } from '@/types/Address';

export default function CheckoutPage() {
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  const handleAddressSelect = (data: AddressData) => {
    console.log('Dirección seleccionada:', data);
    setAddressData(data);
    
    // Autocompletar campos del formulario
    // ... tu lógica aquí
  };

  return (
    <div>
      <h2>📍 Dirección de Entrega</h2>
      
      <AddressMapPicker
        onAddressSelect={handleAddressSelect}
        defaultCenter={{ lat: -34.6037, lng: -58.3816 }}
      />
      
      {/* Resto del formulario */}
    </div>
  );
}
```

---

## 🧪 Paso 5: Probar la Integración

### 5.1 Verificar que el mapa carga

```bash
# Iniciar Docker
docker-compose up -d

# Ver logs del frontend
docker-compose logs -f frontend
```

Abrir: `http://localhost:3000/checkout`

### 5.2 Probar funcionalidades

1. ✅ **Búsqueda:** Escribe "Av. Corrientes 1234, Buenos Aires"
2. ✅ **Click en mapa:** Haz click en cualquier punto
3. ✅ **Arrastrar marcador:** Mueve el pin rojo
4. ✅ **Verificar consola:** Debe mostrar la dirección seleccionada

### 5.3 Probar API de validación

```bash
# Desde el contenedor web
docker-compose exec web python manage.py shell
```

```python
# Probar la vista
from pedidos.views_zones import validate_delivery_zone
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.post('/api/pedidos/validate-zone/', {
    'lat': -34.6037,
    'lng': -58.3816,
    'formatted_address': 'Av. Corrientes 1234, Buenos Aires'
})

# Debería retornar zona válida
```

---

## 🐛 Solución de Problemas

### Error: "Google Maps API Key inválida"

**Causa:** API Key no configurada o incorrecta

**Solución:**
1. Verifica que la API Key esté en `.env.local`
2. Verifica que empiece con `NEXT_PUBLIC_`
3. Reinicia el servidor de Next.js

```bash
docker-compose restart frontend
```

### Error: "This API project is not authorized to use this API"

**Causa:** APIs no habilitadas en Google Cloud

**Solución:**
1. Ve a Google Cloud Console
2. Habilita: Maps JavaScript API, Places API, Geocoding API
3. Espera 1-2 minutos para que se propague

### Error: "Cannot find module '@react-google-maps/api'"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
docker-compose run --rm frontend npm install
docker-compose restart frontend
```

### El mapa no se ve (pantalla gris)

**Causa:** API Key restringida incorrectamente

**Solución temporal:**
1. En Google Cloud Console
2. Edita la API Key
3. Cambia "Application restrictions" a "None"
4. Guarda y espera 1-2 minutos

### Error: "RefererNotAllowedMapError"

**Causa:** Dominio no autorizado en la API Key

**Solución:**
1. Edita la API Key en Google Cloud
2. Agrega tu dominio a "HTTP referrers":
   - `http://localhost:3000/*`
   - `http://localhost/*`

---

## 💰 Monitoreo de Costos

### Ver uso de la API:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Dashboard**
3. Selecciona cada API para ver el uso

### Alertas de presupuesto:

1. **Billing** → **Budgets & alerts**
2. **CREATE BUDGET**
3. Configura alerta en $50 USD

---

## 📊 Métricas Esperadas

Para un e-commerce pequeño (500 pedidos/mes):

```
Maps JavaScript API:    500 cargas  × $7/1000  = $3.50
Places API:             500 búsquedas × $17/1000 = $8.50
Geocoding API:          500 requests × $5/1000  = $2.50
                                      TOTAL     = $14.50/mes

Crédito gratis mensual: $200
COSTO REAL: $0
```

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

### 1. Integración Completa en Checkout
- [ ] Autocompletar campos del formulario
- [ ] Validar zona de cobertura
- [ ] Calcular costo de envío
- [ ] Guardar coordenadas en el pedido

### 2. Mejoras Opcionales
- [ ] Guardar direcciones frecuentes del usuario
- [ ] Mostrar múltiples marcadores (tienda + destino)
- [ ] Calcular ruta y tiempo estimado
- [ ] Integración con Google Distance Matrix API

### 3. Producción
- [ ] Restringir API Key por dominio
- [ ] Configurar alertas de presupuesto
- [ ] Monitorear uso mensual
- [ ] Optimizar llamadas a la API

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs:**
   ```bash
   docker-compose logs -f frontend
   docker-compose logs -f web
   ```

2. **Verifica la consola del navegador:**
   - F12 → Console
   - Busca errores de Google Maps

3. **Verifica la configuración:**
   ```bash
   # Ver variables de entorno
   docker-compose exec frontend env | grep GOOGLE
   ```

---

## ✅ Checklist de Instalación

- [ ] Dependencias instaladas (`npm install`)
- [ ] API Key de Google Maps obtenida
- [ ] APIs habilitadas en Google Cloud (Maps, Places, Geocoding)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Componente AddressMapPicker creado
- [ ] Backend API de zonas funcionando
- [ ] Rutas agregadas en `api_urls.py`
- [ ] Mapa se visualiza correctamente
- [ ] Búsqueda de direcciones funciona
- [ ] Marcador se puede arrastrar
- [ ] Direcciones se autocompletan

---

**¡Listo para usar! 🎉**

El sistema de mapas está completamente implementado y listo para integrarse en tu checkout.
