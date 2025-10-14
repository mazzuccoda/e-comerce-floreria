'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ProductListClient = dynamic(() => import('./ProductListClient'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
    </div>
  )
});

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
}

export default function ProductListFinal({ showRecommended = false, showAdditionals = false }: ProductListProps) {
  return <ProductListClient showRecommended={showRecommended} showAdditionals={showAdditionals} />;
}
