'use client';

import React, { useState, useEffect } from 'react';

export default function ConnectionStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        // Intenta acceder a la API para verificar conectividad
        const response = await fetch('http://localhost:8000/api/catalogo/productos/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
          // No enviamos credenciales para evitar problemas CORS
          credentials: 'omit',
          // Timeout más corto para no bloquear la UI
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          console.log('✅ Conexión al backend establecida');
          setIsOffline(false);
          setShowBanner(false);
        } else {
          console.log('⚠️ Error de respuesta del backend:', response.status);
          setIsOffline(true);
          setShowBanner(true);
        }
      } catch (error) {
        console.error('❌ Error verificando conexión al backend:', error);
        setIsOffline(true);
        setShowBanner(true);
      } finally {
        setIsChecking(false);
      }
    };

    // Verificar al montar el componente
    checkConnection();

    // También verificar cada 30 segundos
    const intervalId = setInterval(checkConnection, 30000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  if (!showBanner || isChecking) {
    return null;
  }

  return (
    <div className={`w-full p-2 ${isOffline ? 'bg-amber-500' : 'bg-green-500'} text-white text-center`}>
      {isOffline ? (
        <div className="flex items-center justify-center">
          <span className="mr-2">⚠️</span>
          <p>
            <strong>Modo Sin Conexión:</strong> No se detecta conexión al servidor. Algunas funcionalidades no estarán disponibles.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span className="mr-2">✅</span>
          <p>Conexión al servidor restablecida.</p>
        </div>
      )}
    </div>
  );
}
