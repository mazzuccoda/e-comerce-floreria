/**
 * Servicio para cálculo de distancias usando Google Maps Distance Matrix API
 */

export interface DistanceMatrixRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

export interface DistanceMatrixResponse {
  distance_km: number;
  distance_text: string;
  duration_text: string;
  duration_seconds: number;
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'ERROR';
}

/**
 * Calcula la distancia entre dos puntos usando Google Maps Distance Matrix API
 */
export async function calculateDistance(
  request: DistanceMatrixRequest
): Promise<DistanceMatrixResponse> {
  try {
    // Verificar que la API de Google Maps esté cargada
    if (typeof google === 'undefined' || !google.maps) {
      throw new Error('Google Maps API no está cargada');
    }

    const service = new google.maps.DistanceMatrixService();

    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [new google.maps.LatLng(request.origin.lat, request.origin.lng)],
          destinations: [new google.maps.LatLng(request.destination.lat, request.destination.lng)],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response) {
            const result = response.rows[0]?.elements[0];

            if (result && result.status === 'OK') {
              const distanceKm = result.distance.value / 1000; // Convertir metros a km

              resolve({
                distance_km: parseFloat(distanceKm.toFixed(2)),
                distance_text: result.distance.text,
                duration_text: result.duration.text,
                duration_seconds: result.duration.value,
                status: 'OK',
              });
            } else {
              resolve({
                distance_km: 0,
                distance_text: '',
                duration_text: '',
                duration_seconds: 0,
                status: result?.status === 'ZERO_RESULTS' ? 'ZERO_RESULTS' : 'NOT_FOUND',
              });
            }
          } else {
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error calculando distancia:', error);
    throw error;
  }
}

/**
 * Calcula la distancia "en línea recta" entre dos puntos (Haversine)
 * Útil como fallback si Distance Matrix falla
 */
export function calculateStraightLineDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
