'use client';

import { useStockValidation } from '../hooks/useStockValidation';
import { useEffect } from 'react';

interface StockAlertProps {
  onStockChange?: (hasIssues: boolean) => void;
  showDetails?: boolean;
}

export default function StockAlert({ onStockChange, showDetails = true }: StockAlertProps) {
  const { stockStatus, loading, error, hasStockIssues, checkStock } = useStockValidation();

  useEffect(() => {
    if (onStockChange) {
      onStockChange(hasStockIssues);
    }
  }, [hasStockIssues, onStockChange]);

  if (loading) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          <span className="text-gray-600">Verificando disponibilidad...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">Error al verificar stock</span>
          </div>
          <button
            onClick={checkStock}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stockStatus || stockStatus.items.length === 0) {
    return null;
  }

  if (!hasStockIssues) {
    return null; // No mostrar nada si no hay problemas de stock
  }

  const problemItems = stockStatus.items.filter(item => !item.has_sufficient_stock);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-800 font-medium mb-2">
            Problemas de disponibilidad
          </h3>
          
          {showDetails && (
            <div className="space-y-2">
              {problemItems.map((item) => (
                <div key={item.product_id} className="text-sm text-red-700 bg-red-100 rounded p-2">
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-xs mt-1">
                    {!item.is_active ? (
                      <span>Producto no disponible</span>
                    ) : (
                      <span>
                        Solicitado: {item.requested_quantity} | 
                        Disponible: {item.available_stock} | 
                        Faltante: {item.requested_quantity - item.available_stock}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-red-600">
              Por favor, ajusta las cantidades o elimina los productos no disponibles.
            </p>
            <button
              onClick={checkStock}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
