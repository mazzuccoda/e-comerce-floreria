'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/types/Product';
import toast from 'react-hot-toast';

// Definir tipos para el carrito
interface CartItem {
  producto: Product;
  quantity: number;
  price: number;
  total_price: number;
  item_id?: number;
}

interface CartData {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

interface CartContextType {
  cart: CartData;
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

// API Configuration - Use environment variable or fallback to production URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

const API_CONFIG = {
  baseUrl: API_URL,
  timeout: 10000,  // Aumentado a 10 segundos
  retryAttempts: 3,  // 3 intentos
  retryDelay: 1000,  // 1 segundo entre reintentos
};

// Robust API client with retry logic
class RobustApiClient {
  private static instance: RobustApiClient;
  private requestQueue: Map<string, Promise<any>> = new Map();

  static getInstance(): RobustApiClient {
    if (!RobustApiClient.instance) {
      RobustApiClient.instance = new RobustApiClient();
    }
    return RobustApiClient.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestKey(url: string, options: RequestInit): string {
    return `${url}-${JSON.stringify(options)}`;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Construir URL completa usando la configuración
    let finalEndpoint = endpoint;
    
    // Normalizar endpoint
    if (finalEndpoint.startsWith('http://') || finalEndpoint.startsWith('https://')) {
      // Ya es una URL completa, no hacer nada
    } else if (finalEndpoint.startsWith('/api/')) {
      // Convertir a URL absoluta (baseUrl ya contiene /api)
      finalEndpoint = `${API_CONFIG.baseUrl}${finalEndpoint.replace('/api', '')}`;
    } else {
      // Para cualquier otro endpoint relativo, concatenarlo directamente
      // Asegurar que no haya doble barra
      const cleanEndpoint = finalEndpoint.replace(/^\/+/, '');
      finalEndpoint = `${API_CONFIG.baseUrl}/${cleanEndpoint}`;
    }

    const url = finalEndpoint;
    const requestKey = this.generateRequestKey(url, options);

    // Prevent duplicate requests
    if (this.requestQueue.has(requestKey)) {
      console.log(`🔄 Reusing existing request for ${endpoint}`);
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.executeRequest(url, options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  private async executeRequest(url: string, options: RequestInit): Promise<any> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Request timeout after ${API_CONFIG.timeout}ms`);
        controller.abort();
      }, API_CONFIG.timeout);

      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${url}`);

        const method = (options.method || 'GET').toUpperCase();
        const baseHeaders: Record<string, string> = {
          'Accept': 'application/json',
        };
        // Evitar forzar Content-Type en GET para prevenir preflight innecesario
        if (method !== 'GET' && !(options.headers && 'Content-Type' in (options.headers as any))) {
          baseHeaders['Content-Type'] = 'application/json';
        }

        const fetchOptions: RequestInit = {
          ...options,
          method,
          signal: controller.signal,
          credentials: 'include',  // Incluir credenciales con Nginx
          headers: {
            ...baseHeaders,
            ...(options.headers || {})
          }
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        console.log(`📡 Response received: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          const cloned = response.clone();
          try {
            const errorData = await response.json();
            if (errorData && typeof errorData === 'object') {
              errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
            }
          } catch (e) {
            try {
              const errorText = await cloned.text();
              if (errorText) errorMessage = errorText;
            } catch {}
          }

          const error = new Error(errorMessage);
          (error as any).status = response.status;
          throw error;
        }

        try {
          const data = await response.json();
          console.log(`✅ API Success: ${url}`, data);
          return data;
        } catch (e) {
          console.error('❌ Error parsing JSON response:', e);
          throw new Error('Invalid JSON response from server');
        }

      } catch (error: any) {
        lastError = error;
        console.error(`❌ API Error (attempt ${attempt}): ${url}`, error.message);

        // Si es un error de timeout o red, intentar de nuevo
        if (error.name === 'AbortError' || error.message.includes('fetch')) {
          console.log(`🔄 Network/timeout error, will retry...`);
        }

        if (attempt < API_CONFIG.retryAttempts) {
          const delay = API_CONFIG.retryDelay * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export const CartProviderRobust: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Intentar cargar el carrito desde localStorage para persistencia incluso tras cerrar navegador
  const getInitialCart = (): CartData => {
    // IMPORTANTE: Solo ejecutar en el cliente para evitar error de hidratación
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cart_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('✅ Carrito cargado desde localStorage:', parsed);
          return parsed;
        }
      } catch (error) {
        console.error('❌ Error cargando carrito:', error);
      }
    }
    
    // Retornar carrito vacío por defecto
    return {
      items: [],
      total_price: 0,
      total_items: 0,
      is_empty: true
    };
  };

  // Usar lazy initialization para evitar error de hidratación
  const [cart, setCart] = useState<CartData>(() => getInitialCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useRef(RobustApiClient.getInstance());
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);
  const isRefreshingRef = useRef(false); // Flag para evitar llamadas concurrentes

  // Safe state update - only if component is mounted
  const safeSetCart = useCallback((newCart: CartData) => {
    if (mountedRef.current) {
      console.log('🔄 Updating cart state:', newCart);
      setCart(newCart);
      setError(null);
      
      // Guardar en localStorage para persistencia completa
      if (typeof window !== 'undefined') {
        try {
          // Guardar en ambos para compatibilidad durante la transición
          localStorage.setItem('cart_data', JSON.stringify(newCart));
          sessionStorage.setItem('cart_data', JSON.stringify(newCart));
          console.log('💾 Carrito guardado en localStorage y sessionStorage');
        } catch (e) {
          console.error('❌ Error guardando carrito:', e);
        }
      }
    }
  }, []);

  const safeSetLoading = useCallback((isLoading: boolean) => {
    if (mountedRef.current) {
      setLoading(isLoading);
    }
  }, []);

  const safeSetError = useCallback((errorMsg: string | null) => {
    if (mountedRef.current) {
      setError(errorMsg);
    }
  }, []);

  // Refresh cart with robust error handling
  const refreshCart = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('🔄 RefreshCart already in progress, skipping...');
      return;
    }

    isRefreshingRef.current = true;
    
    try {
      safeSetLoading(true);
      safeSetError(null);
      console.log('🔄 Starting robust cart refresh...');

      const timestamp = Date.now();
      // GET sin headers personalizados para evitar preflight
      const data = await apiClient.current.request(`/carrito/simple/?t=${timestamp}`, {
        method: 'GET'
      });

      if (data && typeof data === 'object') {
        // Normalize data structure
        const normalizedCart: CartData = {
          items: Array.isArray(data.items) ? data.items : [],
          total_price: parseFloat(data.total_price) || 0,
          total_items: parseInt(data.total_items) || 0,
          is_empty: Boolean(data.is_empty)
        };

        safeSetCart(normalizedCart);
        console.log('✅ Cart refreshed successfully:', normalizedCart);
      } else {
        throw new Error('Invalid data structure received from server');
      }
    } catch (error: any) {
      console.error('❌ Cart refresh failed:', error);
      safeSetError(`Connection failed: ${error.message}`);
      
      // Set empty cart as fallback
      safeSetCart({
        items: [],
        total_price: 0,
        total_items: 0,
        is_empty: true
      });
    } finally {
      safeSetLoading(false);
      isRefreshingRef.current = false;
    }
  }, [safeSetCart, safeSetLoading, safeSetError]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    console.log('🔄 Retrying connection...');
    await refreshCart();
  }, [refreshCart]);

  // Add to cart
  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      safeSetLoading(true);
      console.log('🛒 Adding to cart:', { product: product.nombre, quantity });

      const data = await apiClient.current.request('/carrito/simple/add/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          quantity: quantity
        })
      });

      if (data?.cart) {
        safeSetCart(data.cart);
        toast.success(`${product.nombre} agregado al carrito`);
      } else {
        await refreshCart(); // Fallback refresh
      }
    } catch (error: any) {
      console.error('❌ Add to cart failed:', error);
      toast.error(error.message || 'Error al agregar producto');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [refreshCart, safeSetCart, safeSetLoading, safeSetError]);

  // Remove from cart
  const removeFromCart = useCallback(async (productId: number) => {
    try {
      safeSetLoading(true);
      console.log('🗑️ Removing from cart:', productId);

      await apiClient.current.request('/carrito/remove/', {
        method: 'DELETE',
        body: JSON.stringify({ product_id: productId })
      });

      await refreshCart();
      toast.success('Producto eliminado del carrito');
    } catch (error: any) {
      console.error('❌ Remove from cart failed:', error);
      toast.error(error.message || 'Error al eliminar producto');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [refreshCart, safeSetLoading, safeSetError]);

  // Update quantity
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    try {
      safeSetLoading(true);
      console.log('📝 Updating quantity:', { productId, newQuantity });

      await apiClient.current.request('/carrito/update/', {
        method: 'PUT',
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      await refreshCart();
      toast.success('Cantidad actualizada');
    } catch (error: any) {
      console.error('❌ Update quantity failed:', error);
      toast.error(error.message || 'Error al actualizar cantidad');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [refreshCart, safeSetLoading, safeSetError]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      safeSetLoading(true);
      console.log('🧹 Clearing cart...');

      await apiClient.current.request('/carrito/clear/', {
        method: 'DELETE'
      });

      safeSetCart({
        items: [],
        total_price: 0,
        total_items: 0,
        is_empty: true
      });

      toast.success('Carrito limpiado');
    } catch (error: any) {
      console.error('❌ Clear cart failed:', error);
      toast.error(error.message || 'Error al limpiar carrito');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [safeSetCart, safeSetLoading, safeSetError]);

  // Initial load
  useEffect(() => {
    console.log('🚀 CartProviderRobust mounted, starting initial load...');
    refreshCart();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar (sin refreshCart en deps para evitar loop)

  const contextValue: CartContextType = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    retryConnection,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCartRobust = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartRobust must be used within a CartProviderRobust');
  }
  return context;
};

export default CartContext;
