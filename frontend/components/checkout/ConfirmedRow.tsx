'use client';

import React from 'react';

interface ConfirmedRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

export default function ConfirmedRow({ label, value, onEdit }: ConfirmedRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wider text-gray-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex-shrink-0 text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
      >
        Cambiar
      </button>
    </div>
  );
}
