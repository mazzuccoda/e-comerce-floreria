import { useState, useEffect } from 'react';

interface StockItem {
  product_id: number;
  product_name: string;
  requested_quantity: number;
  available_stock: number;
  is_active: boolean;
  has_sufficient_stock: boolean;
  stock_difference: number;
}

interface StockStatus {
  items: StockItem[];
  has_stock_issues: boolean;
  total_items: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api`;

export const useStockValidation = () => {
  const [stockStatus, setStockStatus] = useState<StockStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStock = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/pedidos/stock-status/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al verificar stock');
      }

      const data = await response.json();
      setStockStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const validateStock = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/pedidos/validate-stock/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.valid;
    } catch (err) {
      console.error('Error validating stock:', err);
      return false;
    }
  };

  useEffect(() => {
    checkStock();
  }, []);

  return {
    stockStatus,
    loading,
    error,
    checkStock,
    validateStock,
    hasStockIssues: stockStatus?.has_stock_issues || false,
  };
};
