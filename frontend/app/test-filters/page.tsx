'use client';

import { useState, useEffect } from 'react';

export default function TestFiltersPage() {
  const [tiposFlor, setTiposFlor] = useState<any[]>([]);
  const [ocasiones, setOcasiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Iniciando fetch de datos de filtros...');
        
        const [tiposResponse, ocasionesResponse] = await Promise.all([
          fetch('http://localhost:8000/api/catalogo/tipos-flor/'),
          fetch('http://localhost:8000/api/catalogo/ocasiones/')
        ]);

        console.log('📡 Respuestas recibidas:', {
          tiposStatus: tiposResponse.status,
          ocasionesStatus: ocasionesResponse.status
        });

        if (tiposResponse.ok) {
          const tiposData = await tiposResponse.json();
          console.log('🌸 Datos tipos de flor:', tiposData);
          setTiposFlor(tiposData);
        } else {
          console.error('❌ Error en tipos de flor:', tiposResponse.status);
        }

        if (ocasionesResponse.ok) {
          const ocasionesData = await ocasionesResponse.json();
          console.log('🎉 Datos ocasiones:', ocasionesData);
          setOcasiones(ocasionesData);
        } else {
          console.error('❌ Error en ocasiones:', ocasionesResponse.status);
        }

      } catch (err) {
        console.error('💥 Error general:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Prueba de Filtros - Debug</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h3>Estado de Carga:</h3>
        <p><strong>Loading:</strong> {loading ? '✅ SÍ' : '❌ NO'}</p>
        <p><strong>Error:</strong> {error || '✅ Ninguno'}</p>
        <p><strong>Tipos de Flor:</strong> {tiposFlor.length} elementos</p>
        <p><strong>Ocasiones:</strong> {ocasiones.length} elementos</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>🔄 Cargando datos...</p>
        </div>
      )}

      {error && (
        <div style={{ background: '#ffebee', padding: '15px', borderRadius: '8px', color: '#c62828' }}>
          <h3>❌ Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <h3>🌸 Tipos de Flor ({tiposFlor.length}):</h3>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
              {tiposFlor.length > 0 ? (
                <ul>
                  {tiposFlor.map((tipo, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      <strong>ID:</strong> {tipo.id} - <strong>Nombre:</strong> {tipo.nombre}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>❌ No hay tipos de flor</p>
              )}
            </div>
          </div>

          <div>
            <h3>🎉 Ocasiones ({ocasiones.length}):</h3>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
              {ocasiones.length > 0 ? (
                <ul>
                  {ocasiones.map((ocasion, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      <strong>ID:</strong> {ocasion.id} - <strong>Nombre:</strong> {ocasion.nombre}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>❌ No hay ocasiones</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
