'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { API_URL } from '@/utils/apiBase';

interface Ocasion {
  id: number;
  nombre: string;
  is_active: boolean;
}

/**
 * Navegación por ocasión: el mismo filtro del catálogo, pero visible como entrada
 * para quien busca un regalo y no una flor puntual.
 */
export default function OccasionsSection() {
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);

  useEffect(() => {
    const fetchOcasiones = async () => {
      try {
        const response = await fetch(`${API_URL}/catalogo/ocasiones/`, { credentials: 'omit' });
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data)) {
          setOcasiones(data.filter((ocasion: Ocasion) => ocasion.is_active));
        }
      } catch {
        // Sin ocasiones disponibles no mostramos la sección
      }
    };

    fetchOcasiones();
  }, []);

  if (ocasiones.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900">¿Para qué ocasión?</h2>
        <p className="mt-1 text-gray-600">
          Elegí el motivo y te mostramos los ramos y arreglos que mejor van.
        </p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {ocasiones.map((ocasion) => (
            <li key={ocasion.id}>
              <Link
                href={`/productos?ocasion=${ocasion.id}`}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {ocasion.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
