import { useEffect, useState } from 'react';

import { applySchedule, SchedulePayload } from '@/utils/businessHours';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

function normalizeApiBase(url: string) {
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

const API_URL = normalizeApiBase(RAW_API_URL);

/**
 * Trae el horario real del negocio (semana + días especiales, editables desde el
 * panel) y lo deja en `businessHours`. Hasta que responde rige el horario
 * habitual de las constantes, así que el checkout nunca queda en blanco.
 */
export function useBusinessHours() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let vigente = true;

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/publico/entrega/horario`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok || !vigente) return;
        applySchedule((await res.json()) as SchedulePayload);
      } catch {
        // sin horario del servidor queda el habitual; no hay nada que avisar
      } finally {
        if (vigente) setLoaded(true);
      }
    };

    load();
    return () => {
      vigente = false;
    };
  }, []);

  return { loaded };
}
