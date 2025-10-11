'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CheckoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al checkout multi-paso
    router.replace('/checkout/multistep');
  }, [router]);

  // Mostrar un loading mientras redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-lg text-gray-600">Redirigiendo al checkout...</p>
      </div>
    </div>
  );
};

export default CheckoutPage;
