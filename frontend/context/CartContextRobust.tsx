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
          
          // Disparar evento personalizado para que otros componentes se enteren
          window.dispatchEvent(new CustomEvent('cart-updated', { detail: newCart }));
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

        // PROTECCIÓN: Si el backend devuelve un carrito vacío pero localStorage tiene productos,
        // NO sobrescribir (probablemente es un problema de sesión)
        if (normalizedCart.is_empty && typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('cart_data');
            if (stored) {
              const localCart = JSON.parse(stored);
              if (!localCart.is_empty && localCart.items && localCart.items.length > 0) {
                console.log('⚠️ Backend devolvió carrito vacío pero localStorage tiene productos. Manteniendo localStorage.');
                console.log('📦 Carrito de localStorage:', localCart);
                safeSetCart(localCart);
                return; // No actualizar con el carrito vacío del backend
              }
            }
          } catch (e) {
            console.error('❌ Error verificando localStorage:', e);
          }
        }

        safeSetCart(normalizedCart);
        console.log('✅ Cart refreshed successfully:', normalizedCart);
      } else {
        throw new Error('Invalid data structure received from server');
      }
    } catch (error: any) {
      console.error('❌ Cart refresh failed:', error);
      safeSetError(`Connection failed: ${error.message}`);
      
      // NO vaciar el carrito en caso de error - mantener el estado actual de localStorage
      console.log('⚠️ Manteniendo carrito actual debido a error de conexión');
      
      // Intentar cargar desde localStorage como fallback
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('✅ Recuperando carrito desde localStorage después de error:', parsed);
            safeSetCart(parsed);
            return; // Salir sin vaciar el carrito
          }
        } catch (e) {
          console.error('❌ Error recuperando carrito de localStorage:', e);
        }
      }
      
      // Solo si no hay nada en localStorage, entonces sí vaciar
      console.log('⚠️ No hay carrito en localStorage, usando carrito vacío');
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

      // IMPORTANTE: Leer el carrito actual DIRECTAMENTE de localStorage para evitar problemas de closure
      let currentCart: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            currentCart = parsed.items || [];
            console.log('📦 Carrito actual en localStorage:', currentCart.length, 'productos');
          }
        } catch (e) {
          console.error('❌ Error leyendo carrito de localStorage:', e);
        }
      }

      const existingItemIndex = currentCart.findIndex(item => item.producto.id === product.id);
      console.log('🔍 Buscando producto existente:', { found: existingItemIndex >= 0, index: existingItemIndex });
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Producto ya existe, actualizar cantidad
        updatedItems = [...currentCart];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          total_price: (updatedItems[existingItemIndex].quantity + quantity) * Number(product.precio_descuento || product.precio)
        };
      } else {
        // Producto nuevo, agregarlo
        updatedItems = [
          ...currentCart,
          {
            producto: product,
            quantity: quantity,
            price: Number(product.precio_descuento || product.precio),
            total_price: quantity * Number(product.precio_descuento || product.precio)
          }
        ];
      }

      // Calcular totales
      const total_price = updatedItems.reduce((sum, item) => sum + Number(item.total_price), 0);
      const total_items = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      const optimisticCart: CartData = {
        items: updatedItems,
        total_price: total_price,
        total_items: total_items,
        is_empty: updatedItems.length === 0
      };

      // Actualizar inmediatamente el estado local (optimistic update)
      console.log('💾 Guardando carrito optimista:', {
        items: optimisticCart.items.length,
        total_items: optimisticCart.total_items,
        total_price: optimisticCart.total_price
      });
      safeSetCart(optimisticCart);
      toast.success(`${product.nombre} agregado al carrito`);

      // Luego intentar sincronizar con backend (sin bloquear la UI)
      try {
        const data = await apiClient.current.request('/carrito/simple/add/', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product.id,
            quantity: quantity
          })
        });

        // Si el backend responde correctamente, verificar que tenga TODOS los productos
        if (data?.cart && data.cart.items && data.cart.items.length > 0) {
          console.log('✅ Backend respondió con carrito:', data.cart);
          
          // PROTECCIÓN: Si el backend tiene MENOS productos que nuestro carrito local, NO sobrescribir
          if (data.cart.items.length < optimisticCart.items.length) {
            console.log('⚠️ Backend tiene MENOS productos que el carrito local. Manteniendo carrito local.');
            console.log('   Backend:', data.cart.items.length, 'productos');
            console.log('   Local:', optimisticCart.items.length, 'productos');
            // NO actualizar, mantener el carrito optimista
          } else {
            console.log('✅ Backend tiene todos los productos, actualizando');
            safeSetCart(data.cart);
          }
        } else {
          console.log('⚠️ Backend devolvió carrito vacío, manteniendo carrito local');
        }
      } catch (backendError: any) {
        console.error('⚠️ Error sincronizando con backend, pero el producto ya está en localStorage:', backendError);
        // No hacer nada, el carrito local ya está actualizado
      }
    } catch (error: any) {
      console.error('❌ Add to cart failed:', error);
      toast.error(error.message || 'Error al agregar producto');
      safeSetError(error.message);
      throw error;
    } finally {
      safeSetLoading(false);
    }
  }, [cart, refreshCart, safeSetCart, safeSetLoading, safeSetError]);

  // Remove from cart
  const removeFromCart = useCallback(async (productId: number) => {
    try {
      safeSetLoading(true);
      console.log('🗑️ Removing from cart:', productId);

      // OPTIMISTIC UPDATE: Eliminar de localStorage PRIMERO
      let currentCart: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            currentCart = parsed.items || [];
          }
        } catch (e) {
          console.error('❌ Error leyendo carrito:', e);
        }
      }

      // Filtrar el producto eliminado
      const updatedItems = currentCart.filter(item => item.producto.id !== productId);

      // Recalcular totales
      const total_price = updatedItems.reduce((sum, item) => sum + Number(item.total_price), 0);
      const total_items = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      const optimisticCart: CartData = {
        items: updatedItems,
        total_price: total_price,
        total_items: total_items,
        is_empty: updatedItems.length === 0
      };

      // Actualizar inmediatamente
      console.log('💾 Eliminando producto de localStorage:', optimisticCart);
      safeSetCart(optimisticCart);
      toast.success('Producto eliminado del carrito');

      // Si el carrito quedó vacío, cancelar carritos abandonados
      if (optimisticCart.is_empty && typeof window !== 'undefined') {
        const stored = localStorage.getItem('abandoned_cart_registered');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.telefono) {
              console.log('🚫 Carrito vacío, cancelando carritos abandonados');
              
              // Limpiar teléfono (solo números)
              const telefonoLimpio = parsed.telefono.replace(/\D/g, '');
              console.log(`📞 Cancelando carritos para teléfono: ${telefonoLimpio}`);
              
              fetch(`${API_CONFIG.baseUrl}/pedidos/carrito-abandonado/cancelar-anteriores/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telefono: telefonoLimpio })
              }).then(response => response.json())
                .then(result => {
                  if (result.success) {
                    console.log(`✅ ${result.carritos_cancelados} carritos cancelados por vaciado de carrito`);
                    localStorage.removeItem('abandoned_cart_registered');
                  }
                })
                .catch(err => {
                  console.error('❌ Error cancelando carritos:', err);
                });
            }
          } catch (e) {
            console.error('Error parseando abandoned_cart_registered:', e);
          }
        }
      }

      // Intentar sincronizar con backend en background
      try {
        await apiClient.current.request('/carrito/remove/', {
          method: 'DELETE',
          body: JSON.stringify({ product_id: productId })
        });
        console.log('✅ Backend confirmó eliminación');
      } catch (backendError: any) {
        console.error('⚠️ Error sincronizando con backend, pero el producto ya está eliminado localmente:', backendError);
      }
    } catch (error: any) {
      console.error('❌ Remove from cart failed:', error);
      toast.error(error.message || 'Error al eliminar producto');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [safeSetCart, safeSetLoading, safeSetError]);

  // Update quantity
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    try {
      safeSetLoading(true);
      console.log('📝 Updating quantity:', { productId, newQuantity });

      // OPTIMISTIC UPDATE: Actualizar localStorage PRIMERO
      let currentCart: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            currentCart = parsed.items || [];
          }
        } catch (e) {
          console.error('❌ Error leyendo carrito:', e);
        }
      }

      // Actualizar la cantidad del producto
      const updatedItems = currentCart.map(item => {
        if (item.producto.id === productId) {
          return {
            ...item,
            quantity: newQuantity,
            total_price: newQuantity * Number(item.price)
          };
        }
        return item;
      });

      // Recalcular totales
      const total_price = updatedItems.reduce((sum, item) => sum + Number(item.total_price), 0);
      const total_items = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      const optimisticCart: CartData = {
        items: updatedItems,
        total_price: total_price,
        total_items: total_items,
        is_empty: updatedItems.length === 0
      };

      // Actualizar inmediatamente
      console.log('💾 Actualizando cantidad en localStorage:', optimisticCart);
      safeSetCart(optimisticCart);
      toast.success('Cantidad actualizada');

      // Intentar sincronizar con backend en background
      try {
        await apiClient.current.request('/carrito/update/', {
          method: 'PUT',
          body: JSON.stringify({
            product_id: productId,
            quantity: newQuantity
          })
        });
        console.log('✅ Backend confirmó actualización de cantidad');
      } catch (backendError: any) {
        console.error('⚠️ Error sincronizando con backend, pero la cantidad ya está actualizada localmente:', backendError);
      }
    } catch (error: any) {
      console.error('❌ Update quantity failed:', error);
      toast.error(error.message || 'Error al actualizar cantidad');
      safeSetError(error.message);
    } finally {
      safeSetLoading(false);
    }
  }, [safeSetCart, safeSetLoading, safeSetError]);

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
    console.log('🚀 CartProviderRobust mounted');
    
    // PRIMERO: Cargar desde localStorage inmediatamente
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cart_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('✅ Carrito cargado INMEDIATAMENTE desde localStorage:', parsed);
          setCart(parsed);
        }
      } catch (e) {
        console.error('❌ Error cargando carrito inicial:', e);
      }
    }
    
    // LUEGO: Intentar sincronizar con backend (sin vaciar si falla)
    console.log('🔄 Intentando sincronizar con backend...');
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
