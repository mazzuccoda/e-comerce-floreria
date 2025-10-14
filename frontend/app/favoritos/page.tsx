'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const FavoritosPage: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirigir si no está autenticado
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Favoritos</h1>
        
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes productos favoritos
          </h3>
          <p className="text-gray-500 mb-6">
            Guarda tus productos favoritos para encontrarlos fácilmente más tarde.
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="bg-green-700 text-white px-6 py-3 rounded-md hover:bg-green-800 transition-colors"
          >
            Explorar Productos
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritosPage;
