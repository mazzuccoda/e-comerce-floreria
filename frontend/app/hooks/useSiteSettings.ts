import { useEffect, useState } from 'react';

export interface SiteSettings {
  vacation_enabled: boolean;
  vacation_from: string | null;
  vacation_until: string | null;
  reopen_date: string | null;
  vacation_message: string;
  vacation_active: boolean;
  min_delivery_date: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/core/site-settings/`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) {
          setSettings(null);
          return;
        }
        const data = (await res.json()) as SiteSettings;
        setSettings(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { settings, loading };
}
