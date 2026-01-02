'use client';

import { useSiteSettings } from '@/app/hooks/useSiteSettings';

export default function VacationBanner() {
  const { settings } = useSiteSettings();

  if (!settings?.vacation_active) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <p className="text-sm text-amber-900">
          {settings.vacation_message}
        </p>
      </div>
    </div>
  );
}
