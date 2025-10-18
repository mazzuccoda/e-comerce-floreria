'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { AddressData, MapCenter } from '@/types/Address';

interface AddressMapPickerProps {
  onAddressSelect: (address: AddressData) => void;
  defaultCenter?: MapCenter;
  initialAddress?: string;
}

const libraries: ("places")[] = ["places"];

// Centro por defecto: Buenos Aires
const DEFAULT_CENTER: MapCenter = { lat: -34.6037, lng: -58.3816 };

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
}: AddressMapPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<MapCenter>(defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
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

  const handleAddressData = (addressData: AddressData) => {
    setSelectedAddress(addressData.formatted_address);
    setValidationStatus('success');
    setValidationMessage('✓ Dirección seleccionada correctamente');
    onAddressSelect(addressData);
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
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {validationStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  validationStatus === 'success' ? 'text-green-800' : 'text-red-800'
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
          <Marker
            position={marker}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
            animation={google.maps.Animation.DROP}
          />
        </GoogleMap>
      </div>

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
