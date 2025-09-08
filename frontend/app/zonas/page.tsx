'use client';

import { useEffect, useState } from 'react';

interface ZonaEntrega {
  id: number;
  nombre: string;
  descripcion: string;
  costo_envio: string;
  envio_gratis_desde: string;
  is_active: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined' ? 'http://web:8000' : 'http://localhost:8000');

export default function ZonasPage() {
  const [zonas, setZonas] = useState<ZonaEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/catalogo/zonas/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setZonas(data.results || data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchZonas();
  }, []);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num === 0 ? 'GRATIS' : `$ ${num.toLocaleString('es-AR')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          Error al cargar las zonas de entrega: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Zonas de Entrega</h1>
      <p className="text-gray-600 mb-8">
        Conocé nuestras zonas de cobertura y costos de envío. ¡Envío gratis en Capital Federal!
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {zonas.map((zona) => (
          <div key={zona.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {zona.nombre}
            </h2>
            <p className="text-gray-600 mb-4">
              {zona.descripcion}
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Costo de envío:</span>
                <span className={`font-bold ${zona.costo_envio === '0.00' ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatPrice(zona.costo_envio)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Envío gratis desde:</span>
                <span className="font-bold text-green-600">
                  $ {parseFloat(zona.envio_gratis_desde).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {zona.costo_envio === '0.00' && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 font-medium">¡Envío siempre gratis!</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Información Importante
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Los envíos se realizan de lunes a sábado de 9:00 a 18:00 hs.
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Para envíos el mismo día, realizá tu pedido antes de las 14:00 hs.
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Todas las flores son frescas y se entregan el mismo día de la compra.
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Si tu zona no aparece en la lista, contactanos para consultar disponibilidad.
          </li>
        </ul>
      </div>
    </div>
  );
}
