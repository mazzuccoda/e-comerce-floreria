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

// API base URL - Configuración dinámica para Docker
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: usar URL interna de Docker
    return 'http://web:8000/api';
  } else {
    // Client-side: usar puerto directo del backend
    return 'http://localhost:8000/api';
  }
};

const API_URL = getApiUrl();

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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/carrito/`, {
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

  // Función para hacer peticiones a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const apiUrl = getApiUrl(); // Obtener URL dinámica en cada llamada
    const response = await fetch(`${apiUrl}${endpoint}`, {
      credentials: 'include', // Para incluir cookies de sesión
      mode: 'cors', // Modo CORS explícito
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Cargar carrito desde el servidor
  const refreshCart = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/carrito/');
      setCart(data);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito
  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setLoading(true);
      const data = await apiCall('/carrito/simple/add/', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      
      setCart(data.cart);
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
      
      // Eliminar localmente del estado primero
      const updatedItems = cart.items.filter(item => item.producto.id !== productId);
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0);
      
      setCart({
        items: updatedItems,
        total_price: newTotalPrice.toFixed(2),
        total_items: updatedItems.length,
        is_empty: updatedItems.length === 0
      });
      
      toast.success('Producto eliminado del carrito');
      
      // Intentar sincronizar con el servidor en segundo plano
      try {
        await apiCall('/carrito/simple/add/', {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, quantity: 0 }),
        });
      } catch (syncError) {
        console.warn('Error sincronizando con servidor:', syncError);
        // No mostrar error al usuario, la eliminación local ya funcionó
      }
      
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast.error('Error al eliminar del carrito');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un producto
  const updateQuantity = async (productId: number, newQuantity: number) => {
    try {
      setLoading(true);
      const response = await apiCall('/carrito/update/', {
        method: 'PUT',
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity
        })
      });

      setCart(response.cart);
      
      if (newQuantity === 0) {
        toast.success('Producto eliminado del carrito');
      } else {
        toast.success('Cantidad actualizada');
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
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
