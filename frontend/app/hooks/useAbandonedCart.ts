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
          'X-API-Key': API_KEY,
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

    // Verificar si ya se registró este teléfono recientemente (últimas 2 horas)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abandoned_cart_registered');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const hoursSince = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          
          // Si es el mismo teléfono y fue hace menos de 2 horas, no registrar
          if (parsed.telefono === telefono && hoursSince < 2) {
            console.log(`⏭️ Carrito abandonado ya registrado hace ${Math.round(hoursSince * 60)} minutos`);
            registeredRef.current = true;
            return;
          } else if (parsed.telefono === telefono) {
            console.log(`🔄 Registro anterior expiró (${Math.round(hoursSince)} horas), permitiendo nuevo registro`);
            localStorage.removeItem('abandoned_cart_registered');
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
          if (timeHidden > TAB_HIDDEN_THRESHOLD_MS && !registeredRef.current) {
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
      // Solo registrar si no se ha completado el checkout y no se ha registrado ya
      if (!isCheckoutCompleted && !registeredRef.current && !beforeUnloadRegisteredRef.current) {
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

  // Limpiar cuando se completa el checkout y marcar como recuperado si existía
  useEffect(() => {
    if (isCheckoutCompleted) {
      console.log('✅ Checkout completado, cancelando detección de abandono');
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Verificar si había un carrito abandonado registrado para marcarlo como recuperado
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('abandoned_cart_registered');
        console.log('🔍 Verificando localStorage para recuperación:', stored);
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('📦 Datos parseados:', parsed);
            
            if (parsed.carrito_id && parsed.carrito_id !== 'pending') {
              console.log(`🔄 Marcando carrito ${parsed.carrito_id} como recuperado...`);
              
              // Marcar como recuperado
              fetch(`${API_URL}/pedidos/carrito-abandonado/${parsed.carrito_id}/recuperado/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': API_KEY,
                },
                body: JSON.stringify({ pedido_id: null })
              }).then(response => {
                console.log('📡 Respuesta de recuperación:', response.status);
                if (response.ok) {
                  console.log('✅ Carrito abandonado marcado como recuperado');
                } else {
                  console.error('❌ Error en respuesta:', response.status);
                }
              }).catch(err => {
                console.error('❌ Error marcando recuperación:', err);
              });
            } else {
              console.log('⏭️ No hay carrito_id válido para marcar como recuperado');
            }
          } catch (e) {
            console.error('❌ Error parseando abandoned_cart_registered:', e);
          }
        } else {
          console.log('ℹ️ No hay carrito abandonado en localStorage');
        }
        
        // Limpiar localStorage
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
