'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.enhanced';
import LoadingScreen from '../ui/LoadingScreen';

interface WithAuthProps {
  adminRequired?: boolean;
  redirectUrl?: string;
}

/**
 * High Order Component (HOC) para proteger rutas que requieren autenticación
 * @param WrappedComponent El componente que se va a proteger
 * @param options Opciones de configuración
 * @returns Un componente protegido que verifica la autenticación
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>, 
  options: WithAuthProps = {}
) {
  const { adminRequired = false, redirectUrl = '/login' } = options;

  const WithAuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Solo redirigir si no está cargando y no está autenticado
      if (!loading && !isAuthenticated) {
        router.replace(`${redirectUrl}?redirect=${window.location.pathname}`);
        return;
      }

      // NOTA: Verificación de admin deshabilitada temporalmente
      // Requiere actualizar el tipo User para incluir is_staff/is_superuser
    }, [loading, isAuthenticated, router, adminRequired, redirectUrl]);

    // Mostrar pantalla de carga mientras se verifica la autenticación
    if (loading || !isAuthenticated) {
      return <LoadingScreen message="Verificando autenticación..." />;
    }

    // Si está autenticado, renderizar el componente
    return <WrappedComponent {...props} />;
  };

  // Asignar displayName para debugging
  WithAuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAuthComponent;
}

export default withAuth;
