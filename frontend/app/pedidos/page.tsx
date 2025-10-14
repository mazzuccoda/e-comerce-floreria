'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PedidosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mis-pedidos');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
    </div>
  );
}
