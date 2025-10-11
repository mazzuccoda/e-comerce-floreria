'use client';

import dynamic from 'next/dynamic';

const CartClientSimple = dynamic(() => import('./CartClientSimple'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  )
});

const CartPage = () => {
  return <CartClientSimple />;
};

export default CartPage;
