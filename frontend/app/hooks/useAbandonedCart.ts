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
const TIMEOUT_MINUTES = 10; // 10 minutos de inactividad
const INACTIVITY_RESET_EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
const TAB_HIDDEN_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos en otra pestaña

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
  const lastActivityRef = useRef<number>(Date.now());
  const tabHiddenTimeRef = useRef<number | null>(null);
  const beforeUnloadRegisteredRef = useRef<boolean>(false);

  const registerAbandonedCart = async (data: AbandonedCartData, reason: string = 'timeout') => {
    // Evitar duplicados
    if (registeredRef.current || beforeUnloadRegisteredRef.current) {
      console.log('⏭️ Carrito ya registrado, evitando duplicado');
      return;
    }

    try {
      console.log(`📦 Registrando carrito abandonado (${reason}):`, data);
      
      const response = await fetch(`${API_URL}/pedidos/carrito-abandonado/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Carrito abandonado registrado:', result);
        registeredRef.current = true;
        beforeUnloadRegisteredRef.current = true;
        
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

  const prepareCartData = (): AbandonedCartData => {
    return {
      telefono: telefono.replace(/\D/g, ''),
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
  };

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Limpiar y reiniciar el timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Solo reiniciar si no se ha completado el checkout y no se ha registrado
    if (!isCheckoutCompleted && !registeredRef.current && telefono && cartItems.length > 0) {
      timerRef.current = setTimeout(() => {
        console.log('🔔 Timer de inactividad disparado!');
        const data = prepareCartData();
        registerAbandonedCart(data, 'inactividad');
      }, TIMEOUT_MINUTES * 60 * 1000);
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

    // Verificar si ya se registró este teléfono recientemente
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abandoned_cart_registered');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const minutesSince = (Date.now() - parsed.timestamp) / (1000 * 60);
          
          // Si el cliente vuelve al checkout en menos de 30 minutos, darle otra oportunidad
          if (parsed.telefono === telefono && minutesSince < 30) {
            console.log(`🔄 Cliente volvió al checkout después de ${Math.round(minutesSince)} minutos`);
            console.log(`♻️ Reseteando estado - dando otra oportunidad antes de marcar como abandonado`);
            
            // Marcar carritos anteriores como cancelados en el backend
            fetch(`${API_URL}/pedidos/carrito-abandonado/cancelar-anteriores/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ telefono: telefono.replace(/\D/g, '') })
            }).then(response => response.json())
              .then(result => {
                if (result.success) {
                  console.log(`🚫 ${result.carritos_cancelados} carritos anteriores cancelados`);
                }
              })
              .catch(err => {
                console.error('❌ Error cancelando carritos anteriores:', err);
              });
            
            // NO limpiar localStorage aquí - mantenerlo para poder cancelar si vacía el carrito
            // Solo resetear flags internos para permitir nuevo registro si abandona nuevamente
            registeredRef.current = false;
            beforeUnloadRegisteredRef.current = false;
          } else if (parsed.telefono === telefono && minutesSince >= 30) {
            // Si pasaron más de 30 minutos, ya es un abandono real
            console.log(`⏭️ Carrito abandonado hace ${Math.round(minutesSince)} minutos - no resetear`);
            registeredRef.current = true;
            return;
          }
        } catch (e) {
          console.error('Error parseando abandoned_cart_registered:', e);
        }
      }
    }

    console.log(`⏰ Sistema de detección de abandono activado: ${TIMEOUT_MINUTES} minutos de inactividad`);
    console.log(`📞 Teléfono: ${telefono}, Items: ${cartItems.length}, Total: ${cartTotal}`);

    // Iniciar timer de inactividad
    resetInactivityTimer();

    // Event listeners para detectar actividad del usuario
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Agregar listeners de actividad
    INACTIVITY_RESET_EVENTS.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Detectar cuando el usuario cambia de pestaña
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Usuario cambió de pestaña
        tabHiddenTimeRef.current = Date.now();
        console.log('👁️ Usuario cambió de pestaña');
      } else {
        // Usuario volvió a la pestaña
        if (tabHiddenTimeRef.current) {
          const timeHidden = Date.now() - tabHiddenTimeRef.current;
          console.log(`👁️ Usuario volvió después de ${Math.round(timeHidden / 1000)}s`);
          
          // Si estuvo más de 2 minutos en otra pestaña, considerar abandono
          if (timeHidden > TAB_HIDDEN_THRESHOLD_MS && !registeredRef.current && cartItems.length > 0) {
            console.log('🚪 Usuario estuvo mucho tiempo fuera, registrando abandono');
            const data = prepareCartData();
            registerAbandonedCart(data, 'cambio_pestana');
          }
          
          tabHiddenTimeRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detectar cuando el usuario cierra la ventana/pestaña
    const handleBeforeUnload = () => {
      // Solo registrar si no se ha completado el checkout, no se ha registrado ya, y hay items en el carrito
      if (!isCheckoutCompleted && !registeredRef.current && !beforeUnloadRegisteredRef.current && cartItems.length > 0) {
        console.log('🚪 Usuario cerrando ventana, registrando abandono');
        beforeUnloadRegisteredRef.current = true;
        
        const data = prepareCartData();
        
        // Usar sendBeacon para envío garantizado al cerrar
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(
          `${API_URL}/pedidos/carrito-abandonado/`,
          blob
        );
        
        // También guardar en localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('abandoned_cart_registered', JSON.stringify({
            telefono: data.telefono,
            timestamp: Date.now(),
            carrito_id: 'pending'
          }));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      INACTIVITY_RESET_EVENTS.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [telefono, nombre, email, cartItems, cartTotal, isCheckoutCompleted]);

  // Detener timer si el carrito se vacía y cancelar carrito abandonado si ya se registró
  useEffect(() => {
    if (cartItems.length === 0 && timerRef.current) {
      console.log('🛒 Carrito vacío, deteniendo detección de abandono');
      clearTimeout(timerRef.current);
      timerRef.current = null;
      
      // Si había un carrito registrado, cancelarlo en el backend
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('abandoned_cart_registered');
        
        if (stored && telefono) {
          console.log('🚫 Cancelando carrito abandonado porque el usuario vació el carrito');
          
          // Cancelar todos los carritos pendientes de este teléfono
          fetch(`${API_URL}/pedidos/carrito-abandonado/cancelar-anteriores/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telefono: telefono.replace(/\D/g, '') })
          }).then(response => response.json())
            .then(result => {
              if (result.success) {
                console.log(`✅ ${result.carritos_cancelados} carritos cancelados por vaciado de carrito`);
              }
            })
            .catch(err => {
              console.error('❌ Error cancelando carritos:', err);
            });
        }
        
        // Limpiar localStorage
        localStorage.removeItem('abandoned_cart_registered');
      }
      
      registeredRef.current = false;
      beforeUnloadRegisteredRef.current = false;
    }
  }, [cartItems.length, telefono]);

  // Limpiar cuando se completa el checkout y marcar como recuperado si existía
  useEffect(() => {
    if (isCheckoutCompleted) {
      console.log('✅ Checkout completado, cancelando detección de abandono');
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // El backend marca los carritos como recuperados al crear el pedido
      // (CarritoAbandonado.marcar_recuperados_por_telefono), así que acá sólo
      // limpiamos el estado local.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('abandoned_cart_registered');
      }
      
      registeredRef.current = false;
      beforeUnloadRegisteredRef.current = false;
    }
  }, [isCheckoutCompleted]);

  return {
    isTimerActive: !!timerRef.current,
    isRegistered: registeredRef.current
  };
};
