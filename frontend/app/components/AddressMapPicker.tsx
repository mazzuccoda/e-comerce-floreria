'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete, Circle } from '@react-google-maps/api';
import { MapPin, Search, AlertCircle, CheckCircle, Navigation, Clock } from 'lucide-react';
import { AddressData, MapCenter } from '@/types/Address';
import { useShippingConfig } from '@/app/hooks/useShippingConfig';
import { calculateDistance, calculateStraightLineDistance } from '@/app/services/distanceService';

interface AddressMapPickerProps {
  onAddressSelect: (address: AddressData) => void;
  defaultCenter?: MapCenter;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  shippingMethod?: 'express' | 'programado';
  onDistanceCalculated?: (distance: number, duration: string) => void;
}

const libraries: ("places")[] = ["places"];

// Centro por defecto: Yerba Buena, Tucumán (se actualizará con config del backend)
const DEFAULT_CENTER: MapCenter = { lat: -26.8167, lng: -65.3167 };

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function AddressMapPicker({
  onAddressSelect,
  defaultCenter = DEFAULT_CENTER,
  initialAddress = '',
  initialLat,
  initialLng,
  shippingMethod = 'programado',
  onDistanceCalculated,
}: AddressMapPickerProps) {
  // Hook opcional - si falla, el componente sigue funcionando
  const { config, loading: configLoading, error: configError } = useShippingConfig();
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<MapCenter>(defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: number;
    duration: string;
    withinCoverage: boolean;
  } | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Actualizar centro del mapa cuando se carga la config
  useEffect(() => {
    if (config && map) {
      const storeCenter = { lat: config.store_lat, lng: config.store_lng };
      map.panTo(storeCenter);
    }
  }, [config, map]);

  // Calcular distancia automáticamente si hay coordenadas iniciales
  useEffect(() => {
    if (config && onDistanceCalculated && initialLat && initialLng && initialLat !== 0 && initialLng !== 0) {
      console.log('🔄 Calculando distancia para dirección inicial:', { lat: initialLat, lng: initialLng });
      calculateDistanceToStore(initialLat, initialLng);
    }
  }, [config, onDistanceCalculated, initialLat, initialLng]);

  // Debug: Verificar API Key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  console.log('🗺️ Google Maps API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '❌ NO CONFIGURADA');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const extractAddressComponents = (
    place: google.maps.places.PlaceResult | google.maps.GeocoderResult
  ): AddressData => {
    const components = place.address_components || [];

    const getComponent = (type: string, useShortName = false) => {
      const component = components.find((c) => c.types.includes(type));
      return component ? (useShortName ? component.short_name : component.long_name) : '';
    };

    const lat = typeof place.geometry?.location?.lat === 'function'
      ? place.geometry.location.lat()
      : (place.geometry?.location as any)?.lat || 0;

    const lng = typeof place.geometry?.location?.lng === 'function'
      ? place.geometry.location.lng()
      : (place.geometry?.location as any)?.lng || 0;

    return {
      formatted_address: place.formatted_address || '',
      street: getComponent('route'),
      number: getComponent('street_number'),
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      postal_code: getComponent('postal_code'),
      lat,
      lng,
      place_id: place.place_id,
    };
  };

  const calculateDistanceToStore = async (lat: number, lng: number) => {
    // Solo calcular si hay config y callback
    if (!config || !onDistanceCalculated) return;

    setIsCalculatingDistance(true);
    try {
      let distanceKm = 0;
      let durationText = '';
      
      // Intentar con Distance Matrix API
      try {
        const result = await calculateDistance({
          origin: { lat: config.store_lat, lng: config.store_lng },
          destination: { lat, lng },
        });

        if (result.status === 'OK') {
          distanceKm = result.distance_km;
          durationText = result.duration_text;
        } else {
          throw new Error('Distance Matrix no disponible');
        }
      } catch (distanceMatrixError) {
        // Fallback: usar Haversine (distancia en línea recta)
        console.warn('⚠️ Distance Matrix API falló, usando Haversine fallback:', distanceMatrixError);
        distanceKm = calculateStraightLineDistance(
          { lat: config.store_lat, lng: config.store_lng },
          { lat, lng }
        );
        // Estimar duración: ~30 km/h promedio en ciudad
        const durationMinutes = Math.round((distanceKm / 30) * 60);
        durationText = `~${durationMinutes} min (estimado)`;
      }

      const maxDistance =
        shippingMethod === 'express'
          ? config.max_distance_express_km
          : config.max_distance_programado_km;

      const withinCoverage = distanceKm <= maxDistance;

      setDistanceInfo({
        distance: distanceKm,
        duration: durationText,
        withinCoverage,
      });

      if (onDistanceCalculated) {
        onDistanceCalculated(distanceKm, durationText);
      }

      if (!withinCoverage) {
        setValidationStatus('warning');
        setValidationMessage(
          `⚠️ Esta dirección está a ${distanceKm} km (${durationText}). Fuera del área de cobertura ${shippingMethod} (máx: ${maxDistance} km)`
        );
      }
    } catch (error) {
      console.error('❌ Error calculando distancia:', error);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleAddressData = async (addressData: AddressData) => {
    setSelectedAddress(addressData.formatted_address);
    setValidationStatus('success');
    setValidationMessage('✓ Dirección seleccionada correctamente');
    onAddressSelect(addressData);

    // Debug: verificar estado
    console.log('🗺️ handleAddressData:', {
      hasConfig: !!config,
      hasCallback: !!onDistanceCalculated,
      address: addressData.formatted_address,
      lat: addressData.lat,
      lng: addressData.lng
    });

    // Calcular distancia solo si hay config y callback
    if (config && onDistanceCalculated) {
      console.log('✅ Calculando distancia...');
      try {
        await calculateDistanceToStore(addressData.lat, addressData.lng);
      } catch (error) {
        console.error('❌ Error calculando distancia:', error);
        // No bloquear el flujo si falla el cálculo
      }
    } else {
      console.warn('⚠️ No se puede calcular distancia:', {
        config: config ? 'OK' : 'NULL',
        callback: onDistanceCalculated ? 'OK' : 'NULL'
      });
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMarker({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(16);

        const addressData = extractAddressComponents(place);
        handleAddressData(addressData);
      }
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsValidating(true);
    setValidationStatus('idle');

    const geocoder = new google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results[0]) {
        const addressData = extractAddressComponents(response.results[0]);
        handleAddressData(addressData);
      } else {
        setValidationStatus('error');
        setValidationMessage('No se pudo obtener la dirección');
      }
    } catch (error) {
      console.error('Error en geocodificación:', error);
      setValidationStatus('error');
      setValidationMessage('Error al obtener la dirección');
    } finally {
      setIsValidating(false);
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>Error al cargar Google Maps. Por favor, recarga la página.</span>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
        <p className="text-center text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador de direcciones */}
      <div className="relative">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'ar' },
            types: ['address'],
            fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          }}
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar dirección (ej: Av. Corrientes 1234, Buenos Aires)"
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              defaultValue={initialAddress}
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </Autocomplete>
      </div>

      {/* Mensaje de validación */}
      {validationStatus !== 'idle' && (
        <div
          className={`p-3 rounded-lg border ${
            validationStatus === 'success'
              ? 'bg-green-50 border-green-200'
              : validationStatus === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {validationStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : validationStatus === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  validationStatus === 'success'
                    ? 'text-green-800'
                    : validationStatus === 'warning'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}
              >
                {validationMessage}
              </p>
              {selectedAddress && validationStatus === 'success' && (
                <p className="text-sm text-green-700 mt-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {selectedAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información de distancia */}
      {distanceInfo && (
        <div className={`p-3 rounded-lg border ${
          distanceInfo.withinCoverage
            ? 'bg-blue-50 border-blue-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start gap-3">
            <Navigation className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              distanceInfo.withinCoverage ? 'text-blue-600' : 'text-orange-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                distanceInfo.withinCoverage ? 'text-blue-900' : 'text-orange-900'
              }`}>
                Distancia desde la tienda
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-lg font-bold ${
                  distanceInfo.withinCoverage ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {distanceInfo.distance} km
                </span>
                <span className={`text-sm flex items-center gap-1 ${
                  distanceInfo.withinCoverage ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  {distanceInfo.duration}
                </span>
              </div>
              {distanceInfo.withinCoverage && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Dentro del área de cobertura {shippingMethod}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isCalculatingDistance && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-sm">Calculando distancia...</span>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="rounded-lg overflow-hidden border border-gray-300 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={marker}
          zoom={15}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={mapOptions}
        >
          {/* Círculos de cobertura */}
          {config && (
            <>
              {/* Círculo de cobertura Express (más pequeño) */}
              <Circle
                center={{ lat: config.store_lat, lng: config.store_lng }}
                radius={config.max_distance_express_km * 1000} // Convertir km a metros
                options={{
                  fillColor: '#10b981',
                  fillOpacity: 0.1,
                  strokeColor: '#10b981',
                  strokeOpacity: 0.4,
                  strokeWeight: 2,
                }}
              />
              
              {/* Círculo de cobertura Programado (más grande) */}
              <Circle
                center={{ lat: config.store_lat, lng: config.store_lng }}
                radius={config.max_distance_programado_km * 1000}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.05,
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.3,
                  strokeWeight: 2,
                }}
              />

              {/* Marcador de la tienda */}
              <Marker
                position={{ lat: config.store_lat, lng: config.store_lng }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3" fill="#059669"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 40),
                }}
                title={config.store_name}
              />
            </>
          )}

          {/* Marcador del destino */}
          <Marker
            position={marker}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
            animation={google.maps.Animation.DROP}
          />
        </GoogleMap>
      </div>

      {/* Leyenda de círculos */}
      {config && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Áreas de cobertura:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 opacity-30"></div>
              <span className="text-gray-600">Express (hasta {config.max_distance_express_km} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 opacity-20"></div>
              <span className="text-gray-600">Programado (hasta {config.max_distance_programado_km} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <span className="text-gray-600">{config.store_name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          💡 ¿Cómo usar el mapa?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>Busca tu dirección en el campo de arriba</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>O haz clic en el mapa para marcar tu ubicación</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>Arrastra el marcador 📍 para ajustar la posición exacta</span>
          </li>
        </ul>
      </div>

      {/* Estado de carga */}
      {isValidating && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-600"></div>
            <span className="text-sm">Obteniendo dirección...</span>
          </div>
        </div>
      )}
    </div>
  );
}
