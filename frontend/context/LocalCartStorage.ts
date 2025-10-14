/**
 * LocalCartStorage.ts
 * Proporciona funcionalidades para guardar y recuperar el carrito localmente
 * cuando la conexión al backend falla.
 */

import { Product } from '@/types/Product';

export interface CartItem {
  producto: Product;
  quantity: number;
  price: number;
  total_price: number;
  item_id?: number;
}

export interface CartData {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

const STORAGE_KEY = 'floreria_cristina_cart';

/**
 * Guarda el carrito en el almacenamiento local
 */
export const saveCartToLocalStorage = (cart: CartData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    console.log('💾 Carrito guardado en localStorage');
  } catch (error) {
    console.error('❌ Error guardando carrito en localStorage:', error);
  }
};

/**
 * Recupera el carrito desde el almacenamiento local
 */
export const loadCartFromLocalStorage = (): CartData | null => {
  try {
    console.log('🔍 Intentando cargar carrito desde localStorage');
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      console.log('⚠️ No se encontró carrito en localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(storedData) as CartData;
    console.log('✅ Carrito cargado desde localStorage:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('❌ Error cargando carrito desde localStorage:', error);
    return null;
  }
};

/**
 * Añade un producto al carrito local
 */
export const addToLocalCart = (product: Product, quantity: number = 1): CartData => {
  const cart = loadCartFromLocalStorage() || {
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  };
  
  // Buscar si el producto ya existe en el carrito
  const existingItemIndex = cart.items.findIndex(item => item.producto.id === product.id);
  
  if (existingItemIndex >= 0) {
    // Actualizar cantidad si ya existe
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].total_price = 
      cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
  } else {
    // Añadir nuevo item
    const price = parseFloat(product.precio_descuento || product.precio);
    cart.items.push({
      producto: product,
      quantity,
      price,
      total_price: price * quantity,
      item_id: Date.now() // ID temporal
    });
  }
  
  // Recalcular totales
  cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.total_price = cart.items.reduce((sum, item) => sum + item.total_price, 0);
  cart.is_empty = cart.items.length === 0;
  
  // Guardar carrito actualizado
  saveCartToLocalStorage(cart);
  
  return cart;
};

/**
 * Sincroniza el carrito local con el backend cuando la conexión se restaura
 */
export const clearLocalCart = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Carrito local limpiado');
  } catch (error) {
    console.error('❌ Error limpiando carrito local:', error);
  }
};
