'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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

// Define lo que nuestro contexto expondrá
interface CartContextType {
  cart: CartData;
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// API base URL - Hardcoded for Railway to avoid cache issues
const API_URL = 'https://e-comerce-floreria-production.up.railway.app/api';

// Creamos el contexto con un valor por defecto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Creamos el Proveedor del Contexto
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartData>({
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  });
  const [loading, setLoading] = useState(false);

  // Función para obtener el carrito actual
  const fetchCart = async (): Promise<CartData> => {
    const response = await fetch(`${API_URL}/carrito/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el carrito');
    }

    return await response.json();
  };

  // Función helper para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: any = {}) => {
    try {
      console.log(`🔄 API Call: ${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include', // Para incluir cookies de sesión
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`📡 Response status: ${response.status} for ${endpoint}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP error! status: ${response.status}` };
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`🚨 Network/Parse Error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Cargar carrito desde el servidor
  const refreshCart = async () => {
    // Evitar múltiples llamadas simultáneas
    if (loading) {
      console.log('🔄 RefreshCart ya en progreso, saltando...');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Iniciando refreshCart...');
      
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const data = await apiCall(`/carrito/simple/?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📦 Datos recibidos del servidor:', data);
      
      // Verificar que los datos sean válidos antes de actualizar
      if (data && typeof data === 'object') {
        setCart(data);
        console.log('✅ Carrito actualizado en estado:', data);
      } else {
        console.warn('⚠️ Datos inválidos recibidos del servidor:', data);
        throw new Error('Datos inválidos del servidor');
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      // Solo establecer carrito vacío si realmente hay un error
      const emptyCart = {
        items: [],
        total_price: 0,
        total_items: 0,
        is_empty: true
      };
      console.log('🔄 Estableciendo carrito vacío por error:', emptyCart);
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito
  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setLoading(true);
      console.log('🛒 Agregando producto al carrito:', { product: product.nombre, quantity });
      const data = await apiCall('/carrito/simple/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      
      console.log('📦 Respuesta del servidor al agregar:', data);
      setCart(data.cart);
      console.log('✅ Estado del carrito actualizado:', data.cart);
      toast.success(`${product.nombre} agregado al carrito`);
      console.log('✅ Producto agregado al carrito:', data.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al agregar ${product.nombre}: ${errorMessage}`);
      console.error('❌ Error al agregar al carrito:', err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto del carrito
  const removeFromCart = async (productId: number) => {
    try {
      setLoading(true);
      console.log('🗑️ Eliminando producto del carrito:', productId);
      console.log('🔍 Estado actual del carrito:', cart);
      
      // Eliminar localmente del estado primero
      const updatedItems = cart.items.filter(item => item.producto.id !== productId);
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0);
      
      const newCart = {
        items: updatedItems,
        total_price: parseFloat(newTotalPrice.toFixed(2)),
        total_items: updatedItems.length,
        is_empty: updatedItems.length === 0
      };
      
      console.log('📦 Nuevo estado del carrito después de eliminar:', newCart);
      setCart(newCart);
      
      toast.success('Producto eliminado del carrito');
      
      // Intentar sincronizar con el servidor en segundo plano
      try {
        const syncData = await apiCall('/carrito/simple/add/', {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, quantity: 0 }),
        });
        console.log('🔄 Sincronización con servidor exitosa:', syncData);
      } catch (syncError) {
        console.warn('⚠️ Error sincronizando con servidor:', syncError);
        // No mostrar error al usuario, la eliminación local ya funcionó
      }
      
    } catch (error: any) {
      console.error('❌ Error removing from cart:', error);
      toast.error('Error al eliminar del carrito');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un producto
  const updateQuantity = async (productId: number, newQuantity: number) => {
    try {
      setLoading(true);
      console.log('🔄 Actualizando cantidad:', { productId, newQuantity });
      console.log('🔍 Estado actual del carrito:', cart);
      
      const response = await apiCall('/carrito/update/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      console.log('📦 Respuesta del servidor al actualizar:', response);
      setCart(response.cart);
      console.log('✅ Estado del carrito actualizado:', response.cart);
      
      if (newQuantity === 0) {
        toast.success('Producto eliminado del carrito');
      } else {
        toast.success('Cantidad actualizada');
      }
    } catch (error: any) {
      console.error('❌ Error updating quantity:', error);
      toast.error(error.message || 'Error al actualizar cantidad');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar carrito
  const clearCart = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/carrito/clear/', {
        method: 'DELETE'
      });

      setCart(response.cart);
      toast.success('Carrito limpiado');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error(error.message || 'Error al limpiar carrito');
    } finally {
      setLoading(false);
    }
  };

  // Cargar carrito al montar el componente
  useEffect(() => {
    console.log('🚀 CartProvider montado, iniciando carga inicial del carrito...');
    refreshCart();
  }, []);

  const contextValue: CartContextType = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
