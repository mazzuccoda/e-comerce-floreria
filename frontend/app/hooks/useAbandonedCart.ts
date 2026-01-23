import { useEffect, useRef } from 'react';

interface CartItem {
  producto: {
    id: number;
    nombre: string;
    precio: number | string;
  };
  quantity: number;
  price: number | string;
}

interface AbandonedCartData {
  telefono: string;
  nombre?: string;
  email?: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precio: string;
  }>;
  total: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
const API_KEY = 'floreria_cristina_2025';
const TIMEOUT_MINUTES = 1; // Reducido a 1 minuto para testing

export const useAbandonedCart = (
  telefono: string,
  nombre: string,
  email: string,
  cartItems: CartItem[],
  cartTotal: number,
  isCheckoutCompleted: boolean
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const registeredRef = useRef<boolean>(false);

  const registerAbandonedCart = async (data: AbandonedCartData) => {
    try {
      console.log('📦 Registrando carrito abandonado:', data);
      
      const response = await fetch(`${API_URL}/pedidos/carrito-abandonado/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Carrito abandonado registrado:', result);
        registeredRef.current = true;
        
        // Guardar en localStorage para evitar duplicados
        if (typeof window !== 'undefined') {
          localStorage.setItem('abandoned_cart_registered', JSON.stringify({
            telefono: data.telefono,
            timestamp: Date.now(),
            carrito_id: result.id
          }));
        }
      } else {
        console.error('❌ Error registrando carrito abandonado:', response.status);
      }
    } catch (error) {
      console.error('❌ Error en registerAbandonedCart:', error);
    }
  };

  useEffect(() => {
    // Limpiar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // No hacer nada si:
    // 1. No hay teléfono
    // 2. El carrito está vacío
    // 3. El checkout ya se completó
    // 4. Ya se registró este carrito
    if (!telefono || cartItems.length === 0 || isCheckoutCompleted || registeredRef.current) {
      return;
    }

    // Verificar si ya se registró este teléfono recientemente (últimas 24 horas)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abandoned_cart_registered');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const hoursSince = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          
          // Si es el mismo teléfono y fue hace menos de 24 horas, no registrar
          if (parsed.telefono === telefono && hoursSince < 24) {
            console.log('⏭️ Carrito abandonado ya registrado para este teléfono');
            registeredRef.current = true;
            return;
          }
        } catch (e) {
          console.error('Error parseando abandoned_cart_registered:', e);
        }
      }
    }

    console.log(`⏰ Timer iniciado: ${TIMEOUT_MINUTES} minutos para registrar carrito abandonado`);
    console.log(`📞 Teléfono: ${telefono}, Items: ${cartItems.length}, Total: ${cartTotal}`);

    // Iniciar timer de 1 minuto
    timerRef.current = setTimeout(() => {
      console.log('🔔 Timer disparado! Preparando datos del carrito...');
      
      // Preparar datos del carrito
      const abandonedCartData: AbandonedCartData = {
        telefono: telefono.replace(/\D/g, ''), // Limpiar caracteres no numéricos
        nombre: nombre || undefined,
        email: email || undefined,
        items: cartItems.map(item => ({
          nombre: item.producto.nombre,
          cantidad: item.quantity,
          precio: typeof item.price === 'number' 
            ? item.price.toString() 
            : item.price.toString()
        })),
        total: cartTotal
      };

      console.log('📤 Datos preparados, llamando a registerAbandonedCart...');
      registerAbandonedCart(abandonedCartData);
    }, TIMEOUT_MINUTES * 60 * 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [telefono, nombre, email, cartItems, cartTotal, isCheckoutCompleted]);

  // Limpiar cuando se completa el checkout
  useEffect(() => {
    if (isCheckoutCompleted) {
      console.log('✅ Checkout completado, cancelando timer de carrito abandonado');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      registeredRef.current = false;
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('abandoned_cart_registered');
      }
    }
  }, [isCheckoutCompleted]);

  return {
    isTimerActive: !!timerRef.current,
    isRegistered: registeredRef.current
  };
};
