/**
 * Hook para obtener configuración de envíos y calcular costos
 */

import { useState, useEffect } from 'react';

export interface ShippingConfig {
  store_name: string;
  store_address: string;
  store_lat: number;
  store_lng: number;
  max_distance_express_km: number;
  max_distance_programado_km: number;
  use_distance_matrix: boolean;
}

export interface ShippingZone {
  id: number;
  shipping_method: 'express' | 'programado';
  zone_name: string;
  min_distance_km: number;
  max_distance_km: number;
  base_price: number;
  price_per_km: number;
  zone_order: number;
  is_active: boolean;
}

export interface ShippingCalculation {
  available: boolean;
  zone_name: string;
  distance_km: number;
  shipping_cost: number;
  is_free_shipping: boolean;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useShippingConfig() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [zones, setZones] = useState<{
    express: ShippingZone[];
    programado: ShippingZone[];
  }>({
    express: [],
    programado: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  const fetchShippingConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener configuración general
      const configResponse = await fetch(`${API_BASE_URL}/api/pedidos/shipping/config/`);
      if (!configResponse.ok) {
        throw new Error('Error al obtener configuración de envíos');
      }
      const configData = await configResponse.json();
      setConfig(configData);

      // Obtener zonas Express
      const expressResponse = await fetch(`${API_BASE_URL}/api/pedidos/shipping/zones/express/`);
      if (!expressResponse.ok) {
        throw new Error('Error al obtener zonas Express');
      }
      const expressData = await expressResponse.json();

      // Obtener zonas Programado
      const programadoResponse = await fetch(`${API_BASE_URL}/api/pedidos/shipping/zones/programado/`);
      if (!programadoResponse.ok) {
        throw new Error('Error al obtener zonas Programado');
      }
      const programadoData = await programadoResponse.json();

      setZones({
        express: expressData,
        programado: programadoData,
      });
    } catch (err) {
      console.error('Error fetching shipping config:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const calculateShippingCost = async (
    distanceKm: number,
    shippingMethod: 'express' | 'programado',
    orderAmount: number
  ): Promise<ShippingCalculation> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pedidos/shipping/calculate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance_km: distanceKm,
          shipping_method: shippingMethod,
          order_amount: orderAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al calcular costo de envío');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error calculating shipping cost:', err);
      throw err;
    }
  };

  const isWithinCoverage = (
    distanceKm: number,
    shippingMethod: 'express' | 'programado'
  ): boolean => {
    if (!config) return false;

    const maxDistance =
      shippingMethod === 'express'
        ? config.max_distance_express_km
        : config.max_distance_programado_km;

    return distanceKm <= maxDistance;
  };

  const getZoneForDistance = (
    distanceKm: number,
    shippingMethod: 'express' | 'programado'
  ): ShippingZone | null => {
    const methodZones = zones[shippingMethod];
    
    return (
      methodZones.find(
        (zone) =>
          zone.is_active &&
          distanceKm >= zone.min_distance_km &&
          distanceKm <= zone.max_distance_km
      ) || null
    );
  };

  return {
    config,
    zones,
    loading,
    error,
    calculateShippingCost,
    isWithinCoverage,
    getZoneForDistance,
    refetch: fetchShippingConfig,
  };
}
