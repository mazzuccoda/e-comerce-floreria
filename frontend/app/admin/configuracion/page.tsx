'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ConfigOption = {
  id: string;
  name: string;
  description: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'number' | 'select';
  options?: { label: string; value: string }[];
};

export default function ConfiguracionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [config, setConfig] = useState<ConfigOption[]>([
    {
      id: 'apiUrl',
      name: 'URL de la API',
      description: 'URL base para las conexiones con el backend',
      value: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
      type: 'text'
    },
    {
      id: 'enableCache',
      name: 'Habilitar caché',
      description: 'Activa el almacenamiento en caché para mejorar rendimiento',
      value: false,
      type: 'boolean'
    },
    {
      id: 'defaultPageSize',
      name: 'Tamaño de página por defecto',
      description: 'Cantidad de productos a mostrar por página',
      value: 12,
      type: 'number'
    },
    {
      id: 'theme',
      name: 'Tema',
      description: 'Tema visual de la aplicación',
      value: 'light',
      type: 'select',
      options: [
        { label: 'Claro', value: 'light' },
        { label: 'Oscuro', value: 'dark' },
        { label: 'Sistema', value: 'system' }
      ]
    }
  ]);

  useEffect(() => {
    // Simulamos la carga de configuraciones desde el almacenamiento local
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem('app-config');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          // Mezclamos las configuraciones guardadas con las predeterminadas
          setConfig(prevConfig => 
            prevConfig.map(item => ({
              ...item,
              value: parsedConfig[item.id] !== undefined ? parsedConfig[item.id] : item.value
            }))
          );
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleChange = (id: string, value: string | boolean | number) => {
    setConfig(prevConfig => 
      prevConfig.map(item => 
        item.id === id ? { ...item, value } : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convertimos el arreglo de config a un objeto para facilitar su uso
      const configObject = config.reduce((acc, item) => {
        acc[item.id] = item.value;
        return acc;
      }, {} as Record<string, any>);
      
      // Guardamos en localStorage
      localStorage.setItem('app-config', JSON.stringify(configObject));
      
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      
      // También se podría enviar al backend si fuera necesario
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
      console.error('Error guardando configuración:', error);
    } finally {
      setSaving(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuración Avanzada</h1>
        
        {message && (
          <div 
            className={`p-4 rounded mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
        
        <div className="space-y-6">
          {config.map(item => (
            <div key={item.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <label htmlFor={item.id} className="font-medium text-gray-700">
                  {item.name}
                </label>
                {item.type === 'boolean' ? (
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id={item.id}
                      checked={item.value as boolean}
                      onChange={e => handleChange(item.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor={item.id}
                      className="block h-6 overflow-hidden bg-gray-300 rounded-full cursor-pointer peer-checked:bg-green-700"
                    >
                      <span className="absolute inset-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out peer-checked:translate-x-4"></span>
                    </label>
                  </div>
                ) : item.type === 'select' ? (
                  <select 
                    id={item.id}
                    value={item.value as string}
                    onChange={e => handleChange(item.id, e.target.value)}
                    className="p-2 border rounded w-32 text-sm"
                  >
                    {item.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : item.type === 'number' ? (
                  <input 
                    type="number"
                    id={item.id}
                    value={item.value as number}
                    onChange={e => handleChange(item.id, parseInt(e.target.value))}
                    className="p-2 border rounded w-20 text-sm text-right"
                  />
                ) : (
                  <input 
                    type="text"
                    id={item.id}
                    value={item.value as string}
                    onChange={e => handleChange(item.id, e.target.value)}
                    className="p-2 border rounded w-64 text-sm"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
          >
            Volver
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded transition ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
