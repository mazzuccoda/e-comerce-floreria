# 🗺️ Propuesta: Integración de Mapa y Búsqueda de Direcciones

## 📋 Resumen Ejecutivo

Integrar un mapa interactivo en el checkout para que los usuarios puedan:
1. **Buscar su dirección** mediante autocompletado
2. **Visualizar la ubicación** en un mapa
3. **Ajustar el marcador** si es necesario
4. **Confirmar la dirección exacta** para la entrega

---

## 🎯 Objetivos

### Principales:
- ✅ Reducir errores en direcciones de entrega
- ✅ Mejorar experiencia de usuario
- ✅ Validar cobertura de zona automáticamente
- ✅ Obtener coordenadas precisas para el delivery

### Secundarios:
- ✅ Calcular distancia y costo de envío
- ✅ Mostrar tiempo estimado de entrega
- ✅ Sugerir puntos de referencia cercanos

---

## 🔧 Opciones de Implementación

### Opción 1: Google Maps API ⭐ RECOMENDADA
**Ventajas:**
- ✅ Más preciso en Argentina
- ✅ Autocompletado excelente
- ✅ Geocodificación confiable
- ✅ Documentación completa
- ✅ Integración con React fácil

**Desventajas:**
- ❌ Requiere tarjeta de crédito (aunque tiene crédito gratis)
- ❌ Costo después de 28,000 cargas/mes

**Costo:**
- **GRATIS:** $200 USD de crédito mensual
- **Equivale a:** ~28,000 cargas de mapa
- **Para tu negocio:** Suficiente para empezar

**APIs necesarias:**
- Maps JavaScript API
- Places API (Autocomplete)
- Geocoding API

---

### Opción 2: Mapbox
**Ventajas:**
- ✅ Diseño más moderno
- ✅ Personalización visual
- ✅ Buen rendimiento

**Desventajas:**
- ❌ Menos preciso en Argentina
- ❌ Autocompletado limitado en español

**Costo:**
- **GRATIS:** 50,000 cargas/mes
- Más generoso que Google

---

### Opción 3: OpenStreetMap + Nominatim
**Ventajas:**
- ✅ Completamente gratis
- ✅ Open source
- ✅ Sin límites de uso

**Desventajas:**
- ❌ Menos preciso
- ❌ Sin autocompletado robusto
- ❌ Requiere más configuración

---

## 🏆 Recomendación: Google Maps API

### ¿Por qué Google Maps?
1. **Precisión en Argentina:** Mejor cobertura y datos actualizados
2. **Autocompletado inteligente:** Sugiere direcciones mientras escribes
3. **Validación de direcciones:** Verifica que la dirección existe
4. **Geocodificación:** Convierte dirección → coordenadas
5. **Reverse Geocoding:** Convierte coordenadas → dirección
6. **Zonas de cobertura:** Puedes validar si entregas en esa zona

---

## 💻 Implementación Técnica

### 1. Componente de Mapa con Búsqueda

```typescript
// frontend/app/components/AddressMapPicker.tsx
'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';

interface AddressMapPickerProps {
  onAddressSelect: (address: AddressData) => void;
  defaultCenter?: { lat: number; lng: number };
}

interface AddressData {
  formatted_address: string;
  street: string;
  number: string;
  city: string;
  state: string;
  postal_code: string;
  lat: number;
  lng: number;
}

export default function AddressMapPicker({ onAddressSelect, defaultCenter }: AddressMapPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState(defaultCenter || { lat: -34.6037, lng: -58.3816 }); // Buenos Aires
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setMarker({ lat, lng });
        map?.panTo({ lat, lng });
        
        // Extraer componentes de la dirección
        const addressData = extractAddressComponents(place);
        setSelectedAddress(place.formatted_address || '');
        onAddressSelect(addressData);
      }
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      
      // Reverse geocoding para obtener la dirección
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addressData = extractAddressComponents(results[0]);
        setSelectedAddress(results[0].formatted_address);
        onAddressSelect(addressData);
      }
    });
  };

  const extractAddressComponents = (place: google.maps.places.PlaceResult | google.maps.GeocoderResult): AddressData => {
    const components = place.address_components || [];
    
    const getComponent = (type: string) => {
      const component = components.find(c => c.types.includes(type));
      return component?.long_name || '';
    };

    return {
      formatted_address: place.formatted_address || '',
      street: getComponent('route'),
      number: getComponent('street_number'),
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      postal_code: getComponent('postal_code'),
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0,
    };
  };

  if (loadError) return <div>Error cargando el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="space-y-4">
      {/* Buscador de direcciones */}
      <div className="relative">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'ar' }, // Solo Argentina
            types: ['address'],
          }}
        >
          <input
            type="text"
            placeholder="Buscar dirección..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </Autocomplete>
        <div className="absolute right-3 top-3 text-gray-400">
          🔍
        </div>
      </div>

      {/* Dirección seleccionada */}
      {selectedAddress && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            📍 <strong>Dirección seleccionada:</strong> {selectedAddress}
          </p>
        </div>
      )}

      {/* Mapa */}
      <div className="rounded-lg overflow-hidden border border-gray-300 shadow-sm">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '400px' }}
          center={marker}
          zoom={15}
          onLoad={onLoad}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker
            position={marker}
            draggable={true}
            onDragEnd={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setMarker({ lat, lng });
                reverseGeocode(lat, lng);
              }
            }}
          />
        </GoogleMap>
      </div>

      {/* Instrucciones */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>💡 <strong>Tip:</strong> Puedes:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Buscar tu dirección en el campo de arriba</li>
          <li>Hacer clic en el mapa para marcar tu ubicación</li>
          <li>Arrastrar el marcador para ajustar la posición</li>
        </ul>
      </div>
    </div>
  );
}
```

---

### 2. Integración en el Checkout

```typescript
// frontend/app/checkout/page.tsx
import AddressMapPicker from '@/components/AddressMapPicker';

export default function CheckoutPage() {
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  const handleAddressSelect = (data: AddressData) => {
    setAddressData(data);
    
    // Autocompletar campos del formulario
    setFormData({
      ...formData,
      direccion: data.formatted_address,
      ciudad: data.city,
      codigo_postal: data.postal_code,
      lat: data.lat,
      lng: data.lng,
    });

    // Validar zona de cobertura
    validateDeliveryZone(data.lat, data.lng);
  };

  const validateDeliveryZone = async (lat: number, lng: number) => {
    // Llamar al backend para verificar si entregas en esa zona
    const response = await fetch('/api/pedidos/validate-zone/', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    
    const data = await response.json();
    
    if (!data.delivers_here) {
      alert('Lo sentimos, no hacemos entregas en esta zona');
    } else {
      setDeliveryCost(data.delivery_cost);
      setEstimatedTime(data.estimated_time);
    }
  };

  return (
    <div>
      {/* ... otros campos ... */}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📍 Dirección de Entrega</h3>
        <AddressMapPicker
          onAddressSelect={handleAddressSelect}
          defaultCenter={{ lat: -34.6037, lng: -58.3816 }}
        />
      </div>

      {/* Campos autocompletados */}
      <input
        type="text"
        value={formData.direccion}
        readOnly
        className="w-full px-4 py-2 bg-gray-50 border rounded"
      />
    </div>
  );
}
```

---

### 3. Backend: Validación de Zonas

```python
# pedidos/views.py
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework.decorators import api_view
from rest_framework.response import Response
from catalogo.models import ZonaEntrega

@api_view(['POST'])
def validate_delivery_zone(request):
    """Valida si la dirección está en zona de cobertura"""
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    
    if not lat or not lng:
        return Response({'error': 'Coordenadas requeridas'}, status=400)
    
    # Crear punto geográfico
    location = Point(float(lng), float(lat), srid=4326)
    
    # Buscar zonas de entrega cercanas (dentro de 10km)
    nearby_zones = ZonaEntrega.objects.filter(
        is_active=True,
        area__distance_lte=(location, D(km=10))
    )
    
    if nearby_zones.exists():
        zone = nearby_zones.first()
        return Response({
            'delivers_here': True,
            'zone_name': zone.nombre,
            'delivery_cost': float(zone.costo_envio),
            'estimated_time': '60-90 minutos',
            'free_shipping_from': float(zone.envio_gratis_desde),
        })
    else:
        return Response({
            'delivers_here': False,
            'message': 'No realizamos entregas en esta zona',
        })
```

---

## 📦 Instalación y Configuración

### 1. Instalar dependencias

```bash
# Frontend
cd frontend
npm install @react-google-maps/api
```

### 2. Obtener API Key de Google Maps

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto
3. Habilitar APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Crear credenciales (API Key)
5. Restringir la API Key:
   - Por dominio (para producción)
   - Por IP (para desarrollo)

### 3. Configurar variables de entorno

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 4. Backend: Agregar soporte geográfico (opcional)

```bash
# Si quieres usar PostGIS para zonas geográficas
pip install django-gis
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'django.contrib.gis',
]

# Agregar campo geográfico a ZonaEntrega
from django.contrib.gis.db import models as gis_models

class ZonaEntrega(models.Model):
    # ... campos existentes ...
    area = gis_models.PolygonField(null=True, blank=True)  # Área de cobertura
    centro = gis_models.PointField(null=True, blank=True)  # Centro de la zona
```

---

## 💰 Costos Estimados

### Google Maps API (Plan Gratuito)
- **Crédito mensual:** $200 USD
- **Maps JavaScript API:** $7 por 1,000 cargas
- **Places API (Autocomplete):** $17 por 1,000 solicitudes
- **Geocoding API:** $5 por 1,000 solicitudes

### Ejemplo de uso mensual:
```
Supongamos 500 pedidos/mes:
- 500 cargas de mapa: $3.50
- 500 búsquedas: $8.50
- 500 geocodificaciones: $2.50
TOTAL: $14.50/mes

Crédito gratis: $200/mes
COSTO REAL: $0 (dentro del crédito gratis)
```

**Conclusión:** Para un e-commerce pequeño/mediano, es GRATIS.

---

## 🎨 Diseño UI/UX

### Flujo de Usuario:

1. **Usuario llega al checkout**
   ```
   ┌─────────────────────────────┐
   │ 📍 Dirección de Entrega     │
   │                             │
   │ [Buscar dirección...]  🔍   │
   │                             │
   │ ┌─────────────────────────┐ │
   │ │                         │ │
   │ │      🗺️ MAPA            │ │
   │ │         📍              │ │
   │ │                         │ │
   │ └─────────────────────────┘ │
   │                             │
   │ 💡 Tip: Arrastra el         │
   │    marcador para ajustar    │
   └─────────────────────────────┘
   ```

2. **Usuario busca su dirección**
   - Escribe en el campo de búsqueda
   - Aparecen sugerencias automáticas
   - Selecciona una dirección

3. **Mapa se centra en la ubicación**
   - Marcador aparece en el punto exacto
   - Usuario puede ajustar arrastrando

4. **Sistema valida la zona**
   - ✅ "Hacemos entregas en tu zona"
   - ❌ "No entregamos en esta zona"

5. **Campos se autocompletan**
   - Dirección completa
   - Ciudad
   - Código postal
   - Coordenadas (ocultas)

---

## 🚀 Roadmap de Implementación

### Fase 1: MVP (1-2 semanas)
- [ ] Integrar Google Maps API
- [ ] Componente de búsqueda de direcciones
- [ ] Mapa con marcador arrastrable
- [ ] Autocompletar campos del formulario

### Fase 2: Validación (1 semana)
- [ ] Validar zonas de cobertura
- [ ] Calcular costo de envío por zona
- [ ] Mostrar tiempo estimado de entrega

### Fase 3: Mejoras (1 semana)
- [ ] Guardar direcciones frecuentes
- [ ] Sugerir puntos de referencia
- [ ] Optimización de rutas para delivery

---

## 📊 Métricas de Éxito

### KPIs a medir:
- ✅ Reducción de errores en direcciones (objetivo: -80%)
- ✅ Tiempo de completado del checkout (objetivo: -30%)
- ✅ Satisfacción del usuario (objetivo: +40%)
- ✅ Pedidos cancelados por dirección incorrecta (objetivo: -90%)

---

## 🔒 Seguridad

### Buenas prácticas:
1. **API Key restringida:** Solo tu dominio puede usarla
2. **Rate limiting:** Limitar solicitudes por usuario
3. **Validación backend:** Siempre validar coordenadas en el servidor
4. **No exponer datos sensibles:** Coordenadas exactas solo para delivery

---

## 🎯 Alternativa Simplificada (Sin Mapa)

Si prefieres empezar más simple:

### Autocompletado sin mapa visual:

```typescript
// Componente más simple solo con autocompletado
import { Autocomplete } from '@react-google-maps/api';

export default function AddressAutocomplete() {
  return (
    <Autocomplete
      onPlaceChanged={handlePlaceSelect}
      options={{ componentRestrictions: { country: 'ar' } }}
    >
      <input
        type="text"
        placeholder="Buscar dirección..."
        className="w-full px-4 py-3 border rounded-lg"
      />
    </Autocomplete>
  );
}
```

**Ventajas:**
- ✅ Más rápido de implementar
- ✅ Menos recursos del navegador
- ✅ Suficiente para validar direcciones

**Desventajas:**
- ❌ Menos visual
- ❌ Usuario no puede ajustar ubicación
- ❌ Menos "wow factor"

---

## 📝 Resumen y Recomendación Final

### ✅ Recomiendo implementar:

1. **Fase 1 (Inmediato):**
   - Google Maps con autocompletado
   - Mapa visual con marcador arrastrable
   - Autocompletar campos del formulario

2. **Fase 2 (Próximo mes):**
   - Validación de zonas de cobertura
   - Cálculo automático de costo de envío

3. **Fase 3 (Futuro):**
   - Direcciones guardadas
   - Optimización de rutas

### 💰 Inversión:
- **Tiempo:** 1-2 semanas
- **Costo:** $0 (dentro del crédito gratis de Google)
- **ROI:** Alto (reduce errores, mejora UX)

---

## 🤝 Próximos Pasos

¿Quieres que implemente:
1. ✅ El componente completo con mapa?
2. ✅ Solo el autocompletado simple?
3. ✅ La validación de zonas en el backend?

Dime qué prefieres y empezamos a codear 🚀
