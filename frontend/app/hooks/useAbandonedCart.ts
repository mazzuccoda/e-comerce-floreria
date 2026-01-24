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
            
            // Limpiar el registro anterior para que pueda iniciar un nuevo ciclo
            localStorage.removeItem('abandoned_cart_registered');
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
      
      // Verificar si había un carrito abandonado registrado para marcarlo como recuperado
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('abandoned_cart_registered');
        console.log('🔍 Verificando localStorage para recuperación:', stored);
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('📦 Datos parseados:', parsed);
            
            // Si tenemos un carrito_id válido, marcarlo como recuperado
            if (parsed.carrito_id && parsed.carrito_id !== 'pending') {
              console.log(`🔄 Marcando carrito ${parsed.carrito_id} como recuperado...`);
              
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
            } else if (parsed.telefono && telefono) {
              // Si no tenemos ID (porque se usó sendBeacon), buscar el último carrito del teléfono
              console.log(`🔍 Buscando último carrito abandonado para teléfono ${telefono}...`);
              
              fetch(`${API_URL}/pedidos/carritos-pendientes/?telefono=${telefono.replace(/\D/g, '')}`, {
                headers: {
                  'X-API-Key': API_KEY,
                }
              }).then(response => response.json())
                .then(carritos => {
                  if (carritos && carritos.length > 0) {
                    const ultimoCarrito = carritos[0]; // El más reciente
                    console.log(`🔄 Marcando último carrito ${ultimoCarrito.id} como recuperado...`);
                    
                    return fetch(`${API_URL}/pedidos/carrito-abandonado/${ultimoCarrito.id}/recuperado/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY,
                      },
                      body: JSON.stringify({ pedido_id: null })
                    });
                  }
                })
                .then(response => {
                  if (response && response.ok) {
                    console.log('✅ Carrito abandonado marcado como recuperado');
                  }
                })
                .catch(err => {
                  console.error('❌ Error buscando/marcando carrito:', err);
                });
            } else {
              console.log('⏭️ No hay carrito_id ni teléfono válido para recuperación');
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
