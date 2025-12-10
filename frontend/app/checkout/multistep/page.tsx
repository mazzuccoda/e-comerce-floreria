'use client';

import React, { useState, useEffect } from 'react';
import { useCartRobust } from '@/context/CartContextRobust';
import { useAuth } from '@/context/AuthContext';
import ExtrasSelector from '@/app/components/ExtrasSelector';
import AddressMapPicker from '@/app/components/AddressMapPicker';
import { AddressData } from '@/types/Address';
import TransferPaymentData from '@/components/TransferPaymentData';
import { trackBeginCheckout, trackCheckoutProgress, trackAddPaymentInfo } from '@/utils/analytics';
import { 
  saveCheckoutProgress, 
  loadCheckoutProgress, 
  clearCheckoutProgress, 
  hasCheckoutProgress,
  formatProgressAge 
} from '@/utils/checkoutStorage';
import { useShippingConfig } from '@/app/hooks/useShippingConfig';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
console.log('🚀 Checkout page loaded');

// Interfaces para carrito directo (mismo shape que simple_get_cart y CartContextRobust)
interface CartItem {
  producto: {
    id: number;
    nombre: string;
    precio: number | string;
    imagen_principal?: string;
  };
  quantity: number;
  price: number | string;
  total_price: number | string;
}

interface DirectCart {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

const MultiStepCheckoutPage = () => {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedProgressAge, setSavedProgressAge] = useState<string | null>(null);
  const [directCart, setDirectCart] = useState<DirectCart>({
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para shipping zones
  const { config: shippingConfig, calculateShippingCost, isWithinCoverage } = useShippingConfig();
  const [distanceKm, setDistanceKm] = useState<number>(0);
  
  // Debug: Log shipping config cuando cambia
  useEffect(() => {
    if (shippingConfig) {
      console.log('📦 Shipping Config cargada:', {
        express_max: shippingConfig.max_distance_express_km,
        programado_max: shippingConfig.max_distance_programado_km,
        store_lat: shippingConfig.store_lat,
        store_lng: shippingConfig.store_lng,
      });
    } else {
      console.warn('⚠️ Shipping Config no disponible');
    }
  }, [shippingConfig]);
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);
  const [shippingDuration, setShippingDuration] = useState<string>('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Función para recargar el carrito desde localStorage y, si es necesario, desde el backend
  const reloadCart = async () => {
    try {
      console.log('🔄 Recargando carrito (localStorage + API)...');

      // 1) Intentar desde localStorage, usando el mismo key que CartContextRobust
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            const normalizedFromLocal: DirectCart = {
              items: Array.isArray(parsed.items) ? parsed.items : [],
              total_price: parseFloat(parsed.total_price) || 0,
              total_items: parseInt(parsed.total_items) || 0,
              is_empty: Boolean(parsed.is_empty)
            };
            setDirectCart(normalizedFromLocal);
            console.log('✅ Carrito cargado desde localStorage en checkout:', normalizedFromLocal);
            // Si ya hay items desde local, podemos devolver temprano
            if (!normalizedFromLocal.is_empty && normalizedFromLocal.items.length > 0) {
              return;
            }
          }
        } catch (e) {
          console.error('❌ Error leyendo carrito de localStorage en checkout:', e);
        }
      }

      // 2) Fallback: leer directamente del backend
      const endpoint = `${API_URL}/carrito/simple/`;
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const normalizedCart: DirectCart = {
          items: Array.isArray(data.items) ? data.items : [],
          total_price: parseFloat(data.total_price) || 0,
          total_items: parseInt(data.total_items) || 0,
          is_empty: Boolean(data.is_empty)
        };
        setDirectCart(normalizedCart);
        console.log('✅ Carrito recargado desde API en checkout:', normalizedCart);
      }
    } catch (error) {
      console.error('❌ Error recargando carrito:', error);
    }
  };

  // ===== FUNCIONES DE DISPONIBILIDAD DE ENVÍOS =====
  
  // Verificar si Express está disponible según día y hora
  const isExpressAvailable = () => {
    // Express SIEMPRE está disponible (HOY o MAÑANA)
    return true;
  };

  // Obtener mensaje de disponibilidad de Express
  const getExpressAvailabilityMessage = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Determinar día de mañana para mensajes
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDay();
    const tomorrowName = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][tomorrowDay];
    
    if (currentDay === 0) {
      // Domingo
      if (currentHour >= 9 && currentHour < 13) {
        // Express HOY disponible (9-13hs)
        return { 
          available: true, 
          deliveryType: 'today',
          message: "✅ Entrega HOY en 2-4 horas",
          detail: `Recibirás tu pedido hoy entre ${currentHour + 2}:00 y ${currentHour + 4}:00 hs`
        };
      } else if (currentHour >= 13 && currentHour < 24) {
        // Express para MAÑANA (13-23:59hs domingo)
        return { 
          available: true, 
          deliveryType: 'tomorrow',
          message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
          detail: "Tu pedido llegará mañana por la mañana"
        };
      } else {
        // Express para HOY (0-8:59hs domingo)
        return { 
          available: true, 
          deliveryType: 'today',
          message: "✅ Entrega HOY desde las 8:00 am",
          detail: "Tu pedido llegará hoy por la mañana"
        };
      }
    } else {
      // Lunes a Sábado
      if (currentHour >= 9 && currentHour < 18) {
        // Express HOY disponible (9-18hs)
        const endHour = Math.min(currentHour + 4, 22);
        return { 
          available: true, 
          deliveryType: 'today',
          message: "✅ Entrega HOY en 2-4 horas",
          detail: `Recibirás tu pedido hoy entre ${currentHour + 2}:00 y ${endHour}:00 hs`
        };
      } else if (currentHour >= 19) {
        // Express para MAÑANA (19-23:59hs)
        return { 
          available: true, 
          deliveryType: 'tomorrow',
          message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
          detail: "Tu pedido llegará mañana por la mañana"
        };
      } else if (currentHour < 9) {
        // Express para HOY (0-8:59hs)
        return { 
          available: true, 
          deliveryType: 'today',
          message: "✅ Entrega HOY desde las 8:00 am",
          detail: "Tu pedido llegará hoy por la mañana"
        };
      } else {
        // Ventana 18:00-18:59 (transición)
        return { 
          available: true, 
          deliveryType: 'tomorrow',
          message: `✅ Entrega MAÑANA (${tomorrowName}) desde las 8:00 am`,
          detail: "Disponible desde las 19:00 hs para entrega mañana"
        };
      }
    }
    
    // Fallback (nunca debería llegar aquí)
    return { 
      available: true, 
      deliveryType: 'tomorrow',
      message: "✅ Entrega disponible",
      detail: ""
    };
  };

  // Obtener franjas horarias disponibles para una fecha
  const getAvailableTimeSlots = (selectedDate: string) => {
    if (!selectedDate) return ['tarde']; // Por defecto solo tarde si no hay fecha
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Parsear la fecha seleccionada (formato YYYY-MM-DD)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    
    // Calcular mañana
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Comparar solo año, mes y día (ignorar hora)
    const selectedDateStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    // Si la fecha seleccionada es mañana Y son más de las 19:00
    if (selectedDateStr === tomorrowDateStr && currentHour >= 19) {
      return ['tarde']; // Solo tarde disponible
    }
    
    return ['mañana', 'tarde']; // Ambas disponibles
  };

  // Cargar progreso guardado al iniciar
  useEffect(() => {
    const savedProgress = loadCheckoutProgress();
    if (savedProgress && hasCheckoutProgress()) {
      console.log('💾 Progreso del checkout encontrado');
      setShowRestorePrompt(true);
      setSavedProgressAge(formatProgressAge());
    }
  }, []);

  // Función para restaurar progreso
  const restoreProgress = () => {
    const savedProgress = loadCheckoutProgress();
    if (savedProgress) {
      setFormData(savedProgress.formData);
      setCurrentStep(savedProgress.currentStep);
      setSelectedExtras(savedProgress.selectedExtras);
      setShowRestorePrompt(false);
      console.log('✅ Progreso restaurado');
    }
  };

  // Función para descartar progreso
  const discardProgress = () => {
    clearCheckoutProgress();
    setShowRestorePrompt(false);
    console.log('🗑️ Progreso descartado');
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Checkout - Cargando carrito (localStorage + API)...');
        await reloadCart();
        setHasError(false);
      } catch (error) {
        console.error('❌ Checkout - Error cargando carrito:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    init();
    
    // Trackear inicio de checkout cuando el carrito esté cargado
    if (directCart.items.length > 0) {
      trackBeginCheckout(directCart.items, directCart.total_price);
    }

    // Listener para cambios en localStorage (cuando se actualiza el carrito desde otra pestaña o componente)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart_data' && e.newValue) {
        console.log('🔄 Carrito actualizado en localStorage, recargando...');
        reloadCart();
      }
    };

    // Listener personalizado para cambios en el mismo tab
    const handleCartUpdate = () => {
      console.log('🔄 Evento cart-updated detectado, recargando...');
      reloadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    // Remitente
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    envioAnonimo: false,
    // Destinatario
    nombreDestinatario: '',
    apellidoDestinatario: '',
    telefonoDestinatario: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    referencia: '',
    lat: 0,
    lng: 0,
    // Dedicatoria
    mensaje: '',
    firmadoComo: '',
    incluirTarjeta: true,
    // Extras
    tarjetaPersonalizada: false,
    textoTarjeta: '',
    osoDePerluche: false,
    tipoOso: 'clasico',
    // Envío
    metodoEnvio: 'retiro',
    fecha: '',
    hora: '',
    franjaHoraria: '',
    instrucciones: '',
    // Pago
    metodoPago: 'mercadopago',
    aceptaTerminos: false
  });

  // Steps se adaptan según el tipo de envío para simplificar el flujo
  // Paso 0 es común: elegir método de envío
  const pickupSteps = [
    { id: 0, title: 'Método de envío', icon: '🚚' },
    { id: 1, title: 'Remitente', icon: '👤' },
    { id: 2, title: 'Dedicatoria', icon: '💌' },
    { id: 3, title: 'Pago', icon: '💳' },
  ];

  const deliverySteps = [
    { id: 0, title: 'Método de envío', icon: '🚚' },
    { id: 1, title: 'Destinatario', icon: '📍' },
    { id: 2, title: 'Remitente', icon: '👤' },
    { id: 3, title: 'Dedicatoria', icon: '💌' },
    { id: 4, title: 'Pago', icon: '💳' },
  ];

  const isPickup = formData.metodoEnvio === 'retiro';
  const steps = isPickup ? pickupSteps : deliverySteps;
  
  // Estado para los errores del formulario
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estado para indicar si se ha intentado enviar el formulario
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Estado para validación en tiempo real
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Estado para copiar al portapapeles
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Estado para autocompletar
  const [useSameAsRemitente, setUseSameAsRemitente] = useState(false);

  // Guardar progreso automáticamente cuando cambian los datos
  useEffect(() => {
    // No guardar si estamos en el paso de pago o si el formulario está vacío
    const isPaymentStep = (isPickup && currentStep === 3) || (!isPickup && currentStep === 4);
    const hasData = formData.nombre || formData.email || formData.nombreDestinatario;
    
    if (!isPaymentStep && hasData) {
      saveCheckoutProgress({
        formData,
        currentStep,
        selectedExtras
      });
    }
  }, [formData, currentStep, selectedExtras, isPickup]);

  // Sincronizar selectedExtras con formData
  // Los extras se identifican por estar en el carrito, no por IDs hardcodeados
  useEffect(() => {
    // Buscar en el carrito si hay productos adicionales
    const cartItems = directCart.items || [];
    
    console.log('🔍 DIAGNÓSTICO DE EXTRAS:');
    console.log('   Total items en carrito:', cartItems.length);
    console.log('   Productos en carrito:', cartItems.map(item => ({
      id: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.price,
      cantidad: item.quantity
    })));
    
    const hasTarjeta = cartItems.some(item => 
      item.producto.nombre?.toLowerCase().includes('tarjeta')
    );
    const hasOso = cartItems.some(item => {
      const nombre = item.producto.nombre?.toLowerCase() || '';
      return nombre.includes('oso') || nombre.includes('peluche');
    });
    
    setFormData(prev => ({
      ...prev,
      tarjetaPersonalizada: hasTarjeta,
      osoDePerluche: hasOso
    }));
    
    console.log('🎁 Extras detectados:', { 
      hasTarjeta, 
      hasOso, 
      formData_tarjeta: hasTarjeta,
      formData_oso: hasOso
    });
  }, [directCart.items]);

  // Handler para ExtrasSelector
  const handleExtrasChange = (extras: number[]) => {
    setSelectedExtras(extras);
  };
  
  // Efecto para autocompletar destinatario con datos del remitente
  useEffect(() => {
    if (useSameAsRemitente) {
      setFormData(prev => ({
        ...prev,
        nombreDestinatario: prev.nombre,
        apellidoDestinatario: prev.apellido,
        telefonoDestinatario: prev.telefono
      }));
    }
  }, [useSameAsRemitente, formData.nombre, formData.apellido, formData.telefono]);

  // Trackear cuando selecciona método de pago
  useEffect(() => {
    if (formData.metodoPago && formData.metodoPago !== 'mercadopago') {
      // Solo trackear si cambió de mercadopago (valor por defecto)
      trackAddPaymentInfo(formData.metodoPago, calculateTotal());
    }
  }, [formData.metodoPago]);

  // Validar un campo específico
  const validateField = (name: string, value: any): string => {
    let error = '';
    
    switch(name) {
      case 'nombre':
      case 'nombreDestinatario':
        error = value.trim() ? '' : 'Este campo es obligatorio';
        break;
      
      case 'email':
        // Validación de email más estricta
        if (!value.trim()) {
          error = 'El email es obligatorio';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          error = 'Email inválido (ejemplo: nombre@dominio.com)';
        }
        break;
      
      case 'telefono':
      case 'telefonoDestinatario':
        // Validación de teléfono más clara
        if (!value.trim()) {
          error = 'El teléfono es obligatorio';
        } else if (!/^\d{7,15}$/.test(value.replace(/[\s-]/g, ''))) {
          error = 'Teléfono inválido (solo números, 7-15 dígitos)';
        }
        break;
      
      case 'direccion':
        error = value.trim() ? '' : 'La dirección es obligatoria';
        break;
      
      case 'ciudad':
        error = value.trim() ? '' : 'La ciudad es obligatoria';
        break;
      
      case 'fecha':
        if (formData.metodoEnvio === 'programado' && !value) {
          error = 'Selecciona una fecha para el envío programado';
        } else if (formData.metodoEnvio === 'retiro' && !value) {
          error = 'Selecciona una fecha para el retiro';
        } else if (formData.metodoEnvio === 'retiro' && value) {
          // Validar que no sea domingo
          const selectedDate = new Date(value + 'T00:00:00');
          if (selectedDate.getDay() === 0) {
            error = 'No se puede retirar los domingos. Selecciona de lunes a sábado.';
          }
        }
        break;
      
      case 'hora':
        if (formData.metodoEnvio === 'retiro' && !value) {
          error = 'Selecciona una hora para el retiro';
        } else if (formData.metodoEnvio === 'retiro' && value && formData.fecha) {
          const [hours, minutes] = value.split(':').map(Number);
          
          // Lunes a Sábado: 9:00 a 20:00 (domingos están bloqueados en la fecha)
          if (hours < 9 || hours > 20 || (hours === 20 && minutes > 0)) {
            error = 'El horario de retiro es de 9:00 a 20:00 hs';
          }
        }
        break;
      
      case 'franjaHoraria':
        if (formData.metodoEnvio === 'programado' && !value) {
          error = 'Selecciona una franja horaria';
        }
        break;
      
      case 'aceptaTerminos':
        error = value ? '' : 'Debes aceptar los términos y condiciones';
        break;
    }
    
    // Log para debug
    if (error) {
      console.log(`❌ Campo ${name} inválido:`, error);
    }
    
    return error;
  };

  // Validar todos los campos relevantes para el paso actual
  const validateCurrentStep = (): boolean => {
    // Paso 0: elegir método de envío + validar fecha/hora si es programado
    if (currentStep === 0) {
      const errors: Record<string, string> = {};
      
      // Si eligió envío programado, validar fecha y franja horaria
      if (formData.metodoEnvio === 'programado') {
        if (!formData.fecha) {
          errors.fecha = 'Debes seleccionar una fecha de entrega';
        }
        if (!formData.franjaHoraria) {
          errors.franjaHoraria = 'Debes seleccionar una franja horaria';
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return false;
      }
      
      setFormErrors({});
      return true;
    }
    console.log(`🔍 Validando paso ${currentStep}...`);
    const errors: Record<string, string> = {};
    
    if (isPickup) {
      // Flujo simple de retiro en tienda: 3 pasos
      switch (currentStep) {
        case 0: // Método de envío + fecha/hora de retiro
          console.log('🏪 [Retiro] Validando fecha y hora de retiro');
          errors.fecha = validateField('fecha', formData.fecha);
          errors.hora = validateField('hora', formData.hora);
          break;
        case 1: // Remitente
          console.log('👤 [Retiro] Validando datos del remitente');
          if (!formData.envioAnonimo) {
            errors.nombre = validateField('nombre', formData.nombre);
            errors.email = validateField('email', formData.email);
            errors.telefono = validateField('telefono', formData.telefono);
          }
          break;
        case 3: // Pago + términos
          console.log('💳 [Retiro] Validando datos de pago');
          errors.aceptaTerminos = validateField('aceptaTerminos', formData.aceptaTerminos);
          break;
      }
    } else {
      // Flujo de envío (express/programado): 4 pasos
      switch (currentStep) {
        case 1: // Destinatario + dirección
          console.log('📍 [Envío] Validando datos del destinatario');
          errors.nombreDestinatario = validateField('nombreDestinatario', formData.nombreDestinatario);
          errors.telefonoDestinatario = validateField('telefonoDestinatario', formData.telefonoDestinatario);
          errors.direccion = validateField('direccion', formData.direccion);
          errors.ciudad = validateField('ciudad', formData.ciudad);
          
          // Validar cobertura si hay distancia calculada
          if (distanceKm > 0 && shippingConfig) {
            const maxDistance = formData.metodoEnvio === 'express' 
              ? shippingConfig.max_distance_express_km 
              : shippingConfig.max_distance_programado_km;
            
            if (distanceKm > maxDistance) {
              errors.direccion = `Esta dirección está fuera del área de cobertura ${formData.metodoEnvio} (máx: ${maxDistance} km, distancia: ${distanceKm} km)`;
            }
          }
          break;
        case 2: // Remitente
          console.log('👤 [Envío] Validando datos del remitente');
          if (!formData.envioAnonimo) {
            errors.nombre = validateField('nombre', formData.nombre);
            errors.email = validateField('email', formData.email);
            errors.telefono = validateField('telefono', formData.telefono);
          }
          break;
        case 4: // Envío + pago
          console.log('🚚 [Envío] Validando datos de envío y pago');
          if (formData.metodoEnvio === 'programado') {
            errors.fecha = validateField('fecha', formData.fecha);
            errors.franjaHoraria = validateField('franjaHoraria', formData.franjaHoraria);
          }
          errors.aceptaTerminos = validateField('aceptaTerminos', formData.aceptaTerminos);
          break;
      }
    }
    
    // Filtrar los campos vacíos
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== '')
    );
    
    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };
  
  // Función para marcar campo como tocado
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    // Validar el campo cuando pierde el foco
    const value = formData[fieldName as keyof typeof formData];
    const error = validateField(fieldName, value);
    if (error) {
      setFormErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  
  // Maneja los cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Si cambia la fecha, verificar si la franja horaria sigue siendo válida
    if (name === 'fecha') {
      const availableSlots = getAvailableTimeSlots(value);
      // Si la franja actual no está disponible, limpiarla
      if (formData.franjaHoraria && !availableSlots.includes(formData.franjaHoraria)) {
        setFormData(prev => ({
          ...prev,
          fecha: value,
          franjaHoraria: '' // Limpiar franja si ya no está disponible
        }));
        return;
      }
      
    }
    
    // Validación en tiempo real si el campo ya fue tocado
    if (touchedFields[name] && type !== 'checkbox') {
      const error = validateField(name, newValue);
      if (error) {
        setFormErrors(prev => ({ ...prev, [name]: error }));
      } else {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // VALIDAR SIEMPRE, independientemente de formSubmitted
    const error = validateField(name, newValue);
    console.log(`Validando campo ${name} en tiempo real:`, error ? `❌ ERROR: ${error}` : '✅ OK');
    
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const nextStep = () => {
    // Validar el paso actual antes de avanzar
    const isValid = validateCurrentStep();
    
    // Marcar que se intentó enviar el formulario
    setFormSubmitted(true);
    
    // Mostrar mensaje de validación
    console.log('Validación de formulario:', isValid ? '✅ Paso válido' : '❌ Hay errores en el formulario');
    console.log('Errores:', formErrors);
    
    const maxStep = isPickup ? 3 : 4;

    if (isValid && currentStep < maxStep) {
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      
      // Trackear progreso del checkout
      const stepName = steps[nextStepNumber]?.title || `Paso ${nextStepNumber}`;
      trackCheckoutProgress(nextStepNumber, stepName, calculateTotal());
      
      // Al cambiar de paso, reiniciar el estado de envío del formulario
      setFormSubmitted(false);
    } else {
      // Mostrar una alerta más detallada si hay errores
      const errorMessages = Object.entries(formErrors)
        .filter(([_, value]) => value !== '')
        .map(([field, message]) => `- ${field}: ${message}`)
        .join('\n');
      
      alert(`⚠️ ERRORES DE VALIDACIÓN\n\n${errorMessages}\n\nPor favor, corrige estos campos antes de continuar.`);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Al retroceder, no es necesario validar
      setFormSubmitted(false);
    }
  };

  // Calcular costo de envío
  const getShippingCost = () => {
    switch(formData.metodoEnvio) {
      case 'retiro':
        return 0;
      case 'express':
      case 'programado':
        // Usar el costo calculado si está disponible, sino usar valores por defecto
        return calculatedShippingCost > 0 ? calculatedShippingCost : (formData.metodoEnvio === 'express' ? 10000 : 5000);
      default:
        return 0;
    }
  };

  // Calcular total con extras y envío
  const calculateTotal = () => {
    // El total ya incluye todos los productos del carrito (incluyendo extras)
    let total = directCart.total_price || 0;
    const shippingCost = getShippingCost();
    
    // Solo sumar el costo de envío, los extras ya están en directCart.total_price
    total += shippingCost;
    
    console.log('💰 Cálculo de total:', {
      subtotal: directCart.total_price,
      envio: shippingCost,
      total: total
    });
    
    return total;
  };

  // Función auxiliar para crear pedido y retornar el ID (para usar en TransferPaymentData)
  const createOrderAndGetId = async (): Promise<string | null> => {
    try {
      // Validar antes de crear
      const isValid = validateCurrentStep();
      if (!isValid) {
        console.log('❌ Error de validación');
        return null;
      }

      // Verificar carrito
      if (!directCart.items || directCart.items.length === 0) {
        alert('❌ El carrito está vacío');
        return null;
      }

      // Preparar fecha de entrega
      let fechaEntrega: string;
      if (formData.metodoEnvio === 'express') {
        // Express: entrega el mismo día
        const today = new Date();
        fechaEntrega = today.toISOString().split('T')[0];
      } else {
        // Retiro: mañana (o lunes si mañana es domingo)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
        fechaEntrega = tomorrow.toISOString().split('T')[0];
      }

      // Preparar items
      const items = directCart.items.map((item: any) => ({
        producto_id: item.producto.id,
        cantidad: item.quantity
      }));

      // Preparar headers
      const apiBaseUrl = API_URL.replace('/api', '');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) headers['Authorization'] = `Token ${token}`;

      // Crear pedido
      const response = await fetch(`${apiBaseUrl}/api/pedidos/checkout-with-items/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          nombre_comprador: formData.nombre?.trim() || "Cliente Web",
          email_comprador: formData.email?.trim() || "cliente@floreriacristina.com",
          telefono_comprador: formData.telefono?.trim() || "1123456789",
          nombre_destinatario: formData.nombreDestinatario?.trim() || "Destinatario",
          telefono_destinatario: formData.telefonoDestinatario?.trim() || "1123456789",
          direccion: formData.direccion?.trim() || "Dirección de prueba 123",
          ciudad: formData.ciudad?.trim() || "Buenos Aires",
          codigo_postal: formData.codigoPostal?.trim() || "1000",
          fecha_entrega: formData.metodoEnvio === 'programado' ? formData.fecha : fechaEntrega,
          franja_horaria: formData.metodoEnvio === 'programado' ? (formData.franjaHoraria || 'mañana') : (formData.metodoEnvio === 'express' ? 'durante_el_dia' : 'mañana'),
          metodo_envio_id: 1,
          metodo_envio: formData.metodoEnvio,
          costo_envio: getShippingCost(),
          dedicatoria: formData.mensaje || "Entrega de Florería Cristina",
          firmado_como: formData.firmadoComo || "",
          instrucciones: formData.instrucciones || "",
          regalo_anonimo: false,
          medio_pago: formData.metodoPago,
          items: items
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.message || 'Error desconocido';
        alert(`❌ Error al crear pedido: ${errorMsg}`);
        return null;
      }

      // Retornar el pedido_id
      return result.pedido_id?.toString() || null;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('❌ Error al crear el pedido');
      return null;
    }
  };

  // Función para crear el pedido usando el endpoint simple
  const handleFinalizarPedido = async () => {
    // Validar el último paso antes de finalizar
    const isValid = validateCurrentStep();
    setFormSubmitted(true);
    
    if (!isValid) {
      console.log('❌ Error de validación en el paso final');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🚀 INICIANDO CREACIÓN DE PEDIDO');
      alert('🚀 Iniciando creación de pedido...');
      
      // Usar directamente el carrito ya cargado en el checkout (directCart)
      if (!directCart.items || directCart.items.length === 0) {
        console.log('❌ CARRITO VACÍO EN directCart - items:', directCart.items);
        alert('❌ El carrito está vacío. Agrega productos antes de finalizar el pedido.');
        return;
      }

      console.log(`✅ CARRITO VÁLIDO (directCart): ${directCart.items.length} productos`);
      alert(`✅ Carrito verificado: ${directCart.items.length} productos por $${directCart.total_price}`);

      // Crear pedido usando el endpoint API existente
      console.log('📡 Enviando pedido a simple-checkout...');
      
      // Preparar fecha de entrega según tipo de envío
      let fechaEntrega: string;
      if (formData.metodoEnvio === 'express') {
        // Express: entrega el mismo día
        const today = new Date();
        fechaEntrega = today.toISOString().split('T')[0];
      } else {
        // Retiro: mañana (o lunes si mañana es domingo)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 0) { // 0 = domingo
          tomorrow.setDate(tomorrow.getDate() + 1);
        }
        fechaEntrega = tomorrow.toISOString().split('T')[0];
      }
      
      // Determinar la URL base de la API correctamente para evitar problemas CORS
      const apiBaseUrl = API_URL.replace('/api', '');  // Remove /api suffix for pedidos endpoint
      
      // Mostrar detalles para debugging
      console.log('👀 Valores del formulario:', {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        nombreDestinatario: formData.nombreDestinatario,
        direccion: formData.direccion
      });
      
      // Preparar items del carrito para enviar usando directCart
      const items = directCart.items.map((item: any) => ({
        producto_id: item.producto.id,
        cantidad: item.quantity
      }));
      
      console.log('📦 Items a enviar:', items);
      console.log('🔗 URL de la API:', `${apiBaseUrl}/api/pedidos/checkout-with-items/`);
        
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Agregar token si el usuario está autenticado
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/api/pedidos/checkout-with-items/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          // Datos del comprador - obligatorios
          nombre_comprador: formData.nombre ? formData.nombre.trim() : "Cliente Web",
          email_comprador: formData.email ? formData.email.trim() : "cliente@floreriacristina.com", 
          telefono_comprador: formData.telefono ? formData.telefono.trim() : "1123456789",
          
          // Datos del destinatario - obligatorios
          nombre_destinatario: formData.nombreDestinatario ? formData.nombreDestinatario.trim() : "Destinatario",
          telefono_destinatario: formData.telefonoDestinatario ? formData.telefonoDestinatario.trim() : "1123456789",
          direccion: formData.direccion ? formData.direccion.trim() : "Dirección de prueba 123",
          ciudad: formData.ciudad ? formData.ciudad.trim() : "Buenos Aires",
          codigo_postal: formData.codigoPostal ? formData.codigoPostal.trim() : "1000",
          
          // Datos de entrega - obligatorios
          fecha_entrega: formData.metodoEnvio === 'programado' ? formData.fecha : fechaEntrega,
          franja_horaria: formData.metodoEnvio === 'programado' ? (formData.franjaHoraria || 'mañana') : (formData.metodoEnvio === 'express' ? 'durante_el_dia' : 'mañana'),
          metodo_envio_id: 1,
          metodo_envio: formData.metodoEnvio, // 'retiro', 'express', 'programado'
          costo_envio: getShippingCost(), // Costo de envío calculado
          
          // Datos adicionales - opcionales
          dedicatoria: formData.mensaje || "Entrega de Florería Cristina",
          firmado_como: formData.firmadoComo || "",
          instrucciones: formData.instrucciones || "",
          regalo_anonimo: false,
          medio_pago: formData.metodoPago,
          
          // ITEMS DEL CARRITO - NUEVO
          items: items
        }),
      });

      const result = await response.json();
      console.log('📋 Respuesta del servidor:', result);
      console.log('📋 Respuesta completa (JSON):', JSON.stringify(result, null, 2));
      
      // Mostrar detalles específicos del error si existen
      if (result.details) {
        console.log('⚠️ CAMPOS CON ERROR:', result.details);
        // Recorrer todos los errores y mostrarlos claramente
        Object.entries(result.details).forEach(([campo, errores]) => {
          console.error(`Campo con error: ${campo} - ${JSON.stringify(errores)}`);
        });
        
        // Mostrar un mensaje de alerta con todos los errores
        const mensajeErrores = Object.entries(result.details)
          .map(([campo, error]) => `${campo}: ${JSON.stringify(error)}`)
          .join('\n');
        
        alert(`❌ Error de validación:\n${mensajeErrores}`);
      }

      if (!response.ok) {
        // Si hay error, mostrar el mensaje
        const errorMsg = result.error || result.message || 'Error desconocido';
        alert(`❌ Error al crear pedido:\n${errorMsg}\n\nDetalles: ${JSON.stringify(result.details || {}, null, 2)}`);
        return;
      }
      
      if (response.ok) {
        alert(`🎉 ¡Pedido #${result.numero_pedido} creado exitosamente! ID: ${result.pedido_id}`);
        
        // Guardar datos del pedido en localStorage SIEMPRE (para todos los métodos de pago)
        const costoEnvio = getShippingCost();
        // NOTA: result.total YA incluye el costo de envío (calculado en el backend)
        
        const pedidoData = {
          pedido_id: result.pedido_id,
          numero_pedido: result.numero_pedido,
          total: result.total, // Total ya incluye envío (viene del backend)
          items: directCart.items,
          comprador: {
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono
          },
          destinatario: {
            nombre: formData.nombreDestinatario,
            telefono: formData.telefonoDestinatario,
            direccion: formData.direccion,
            ciudad: formData.ciudad
          },
          dedicatoria: {
            mensaje: formData.mensaje,
            firmadoComo: formData.firmadoComo,
            incluirTarjeta: formData.incluirTarjeta
          },
          fecha_entrega: formData.metodoEnvio === 'programado' ? formData.fecha : fechaEntrega,
          franja_horaria: formData.metodoEnvio === 'programado' ? formData.franjaHoraria : 'mañana',
          metodo_envio: formData.metodoEnvio,
          costo_envio: costoEnvio, // Usar la variable ya calculada
          medio_pago: formData.metodoPago
        };
        
        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoData));
        console.log('💾 Datos del pedido guardados en localStorage');
        
        // Limpiar el carrito SIEMPRE (para todos los métodos de pago)
        try {
          console.log('🗑️ Limpiando carrito usando CartContext...');
          
          // Limpiar localStorage directamente
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cart_data');
            sessionStorage.removeItem('cart_data');
            console.log('✅ localStorage y sessionStorage limpiados');
          }
          
          // Actualizar el estado del carrito a vacío
          setDirectCart({
            items: [],
            total_price: 0,
            total_items: 0,
            is_empty: true
          });
          
          // Intentar limpiar en el backend también (sin bloquear si falla)
          fetch(`${API_URL}/carrito/simple/clear/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }).catch(err => console.log('⚠️ Error limpiando backend (no crítico):', err));
          
          console.log('✅ Carrito limpiado completamente');
        } catch (clearError) {
          console.error('⚠️ Error al limpiar carrito:', clearError);
        }
        
        // Si el método de pago es MercadoPago, crear preferencia y redirigir
        if (formData.metodoPago === 'mercadopago') {
          try {
            console.log('💳 Creando preferencia de MercadoPago...');
            const paymentResponse = await fetch(`${apiBaseUrl}/api/pedidos/simple/${result.pedido_id}/payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            
            const paymentResult = await paymentResponse.json();
            console.log('💳 Respuesta de pago:', paymentResult);
            
            if (paymentResult.success) {
              console.log('✅ Preferencia creada, redirigiendo a MercadoPago...');
              clearCheckoutProgress(); // Limpiar progreso guardado
              // Redirigir a MercadoPago
              window.location.href = paymentResult.init_point;
            } else {
              alert(`❌ Error al crear el pago: ${paymentResult.error || 'Error desconocido'}`);
              console.error('Error de pago:', paymentResult);
            }
          } catch (error) {
            console.error('Error creating payment preference:', error);
            alert('❌ Error al procesar el pago. Pedido creado pero pago pendiente.');
          }
        } else if (formData.metodoPago === 'paypal') {
          // PayPal: Crear pago y redirigir
          try {
            console.log('💳 Creando pago de PayPal...');
            const paymentResponse = await fetch(`${apiBaseUrl}/api/pedidos/${result.pedido_id}/payment/paypal/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            
            const paymentResult = await paymentResponse.json();
            console.log('💳 Respuesta de PayPal:', paymentResult);
            
            if (paymentResult.success) {
              console.log('✅ Pago PayPal creado, redirigiendo...');
              console.log('💱 Conversión:', paymentResult.conversion_info);
              
              // Mostrar información de conversión al usuario
              const convInfo = paymentResult.conversion_info;
              alert(`💱 Conversión USD:\n` +
                    `Total ARS: $${convInfo.total_ars.toFixed(2)}\n` +
                    `Total USD: $${convInfo.total_usd.toFixed(2)}\n` +
                    `TC Oficial: $${convInfo.official_rate.toFixed(2)} ARS/USD\n` +
                    `(Incluye ${convInfo.margin_percentage.toFixed(0)}% de margen)`);
              
              clearCheckoutProgress(); // Limpiar progreso guardado
              // Redirigir a PayPal
              window.location.href = paymentResult.approval_url;
            } else {
              alert(`❌ Error al crear el pago PayPal: ${paymentResult.error || 'Error desconocido'}`);
              console.error('Error de pago PayPal:', paymentResult);
            }
          } catch (error) {
            console.error('Error creating PayPal payment:', error);
            alert('❌ Error al procesar el pago PayPal. Pedido creado pero pago pendiente.');
          }
        } else {
          // Para otros métodos de pago (transferencia), redirigir directamente a la página de éxito
          clearCheckoutProgress(); // Limpiar progreso guardado
          window.location.href = `/checkout/success?pedido=${result.pedido_id}`;
        }
      } else {
        console.error('❌ ERROR COMPLETO:', result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error de conexión: ${errorMessage}`);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      alert('🚀 Iniciando creación de pedido...');
      
      // Validar datos del formulario
      if (!formData.nombre || !formData.email || !formData.telefono) {
        alert('❌ Faltan datos del remitente');
        return;
      }
      
      if (!formData.nombreDestinatario || !formData.direccion || !formData.telefonoDestinatario) {
        alert('❌ Faltan datos del destinatario');
        return;
      }

      const checkoutData = {
        nombre_comprador: `${formData.nombre} ${formData.apellido}`.trim(),
        email_comprador: formData.email,
        telefono_comprador: formData.telefono,
        nombre_destinatario: `${formData.nombreDestinatario} ${formData.apellidoDestinatario}`.trim(),
        telefono_destinatario: formData.telefonoDestinatario,
        direccion: formData.direccion,
        ciudad: formData.ciudad || 'Buenos Aires',
        codigo_postal: formData.codigoPostal || '',
        fecha_entrega: formData.fecha || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        franja_horaria: 'mañana',
        metodo_envio_id: formData.metodoEnvio === 'programado' ? 2 : 1,
        dedicatoria: formData.mensaje || '',
        instrucciones: formData.instrucciones || '',
        regalo_anonimo: formData.envioAnonimo,
        medio_pago: formData.metodoPago
      };

      console.log('📤 Datos a enviar:', checkoutData);
      alert('📤 Enviando petición al servidor...');

      const response = await fetch('http://localhost:8000/api/pedidos/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
        credentials: 'include',
      });

      console.log('📡 Status de respuesta:', response.status);
      console.log('📡 Headers de respuesta:', Object.fromEntries(response.headers.entries()));

      console.log('📡 Response status pedido:', response.status);
      const result = await response.json();
      console.log('🎉 Respuesta completa del servidor:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`✅ PEDIDO CREADO: ${result.numero_pedido}`);
        alert(`✅ ¡Pedido creado exitosamente! Número: ${result.numero_pedido}`);
        // Aquí podrías redirigir a una página de confirmación
        // router.push(`/checkout/success?pedido=${result.pedido_id}`);
      } else {
        console.log(`❌ ERROR EN PEDIDO:`, result);
        alert(`❌ Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('💥 Error al crear pedido:', error);
      alert(`💥 Error al crear pedido: ${(error as Error).message}`);
    }
  };

  // Mostrar loading mientras se carga el carrito directamente
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu carrito directamente...</p>
        </div>
      </div>
    );
  }
  
  // Mostrar error si ocurrió alguno
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error de Conexión</h1>
          <p className="text-gray-600 mb-4">No pudimos cargar tu carrito. Por favor intenta nuevamente.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  // Mostrar mensaje si el carrito está vacío
  if (!directCart.items || directCart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Carrito Vacío</h1>
          <p className="text-gray-600 mb-4">Tu carrito está vacío. Agrega productos antes de continuar al checkout.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  // Prompt para restaurar progreso guardado
  const RestoreProgressPrompt = () => {
    if (!showRestorePrompt) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">💾</span>
            <h3 className="text-xl font-bold text-gray-800">Continuar pedido anterior</h3>
          </div>
          <p className="text-gray-600 mb-2">
            Encontramos un pedido sin completar guardado {savedProgressAge}.
          </p>
          <p className="text-gray-600 mb-6">
            ¿Deseas continuar donde lo dejaste?
          </p>
          <div className="flex gap-3">
            <button
              onClick={restoreProgress}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✅ Continuar pedido
            </button>
            <button
              onClick={discardProgress}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              🗑️ Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-24 sm:pt-28">
      {/* Prompt para restaurar progreso */}
      <RestoreProgressPrompt />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
        {/* Header mejorado */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌸</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Florería</span> Cristina
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-100">
            <span className="text-sm font-medium text-gray-500">Paso</span>
            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-bold">{currentStep + 1}</span>
            <span className="text-sm text-gray-400">de {steps.length}</span>
            <span className="hidden sm:inline text-sm text-gray-400">|</span>
            <span className="hidden sm:inline text-sm font-medium text-green-600">{steps[currentStep].title}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6 overflow-hidden">
          <div className="hidden md:flex relative max-w-3xl w-full px-10">
            {/* Línea conectora */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 z-0"></div>
            
            {/* Pasos */}
            <div className="flex justify-between w-full relative z-10">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 transition-transform duration-300 ${
                    currentStep === step.id ? 'scale-110' : ''
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg 
                    ${currentStep > step.id ? 'bg-green-500 text-white' : ''}
                    ${currentStep === step.id ? 'bg-green-100 border-2 border-green-500 ring-4 ring-green-50 text-green-600' : ''}
                    ${currentStep < step.id ? 'bg-gray-100 border-2 border-gray-300 text-gray-400' : ''}
                    transition-all duration-300 shadow-sm`}
                  >
                    {currentStep > step.id ? '✓' : step.icon}
                  </div>
                  <div className={`text-xs font-medium ${
                    currentStep === step.id ? 'text-green-600' : 
                    currentStep > step.id ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Resumen del pedido - Movido aquí para mejor UX en mobile */}
        <div className="mb-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
                <path d="M16.5 9.4 7.55 4.24"/>
                <polyline points="3.29 7 12 12 20.71 7"/>
                <line x1="12" y1="22" x2="12" y2="12"/>
                <circle cx="18.5" cy="15.5" r="2.5"/>
                <path d="M20.27 17.27 22 19"/>
              </svg>
              <span>Resumen del pedido</span>
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
              {directCart?.total_items || 0} {directCart?.total_items === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          
          {/* Productos del carrito */}
          {directCart?.items && directCart.items.length > 0 ? (
            <div className="space-y-2 mb-4">
              {directCart.items.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="flex gap-3 items-center">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.producto.imagen_principal ? (
                        <img
                          src={item.producto.imagen_principal}
                          alt={item.producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🌸</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{item.producto.nombre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          × {item.quantity}
                        </span>
                        <span className="text-xs text-gray-500">
                          ${Number(item.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-green-600">
                        ${(Number(item.price) * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-sm">
              ⚠️ No hay productos en el carrito
            </div>
          )}
          
          {/* Totales */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-gray-700 text-sm">
              <span>Subtotal productos</span>
              <span className="font-semibold">${directCart.total_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {/* Costo de envío */}
            <div className="flex justify-between text-gray-700 text-sm">
              <span className="flex items-center gap-1">
                {formData.metodoEnvio === 'retiro' && '🏪 Retiro en tienda'}
                {formData.metodoEnvio === 'express' && '⚡ Envío Express'}
                {formData.metodoEnvio === 'programado' && '📅 Envío Programado'}
              </span>
              <span className="font-semibold">
                {formData.metodoEnvio === 'retiro' && 'Sin cargo'}
                {formData.metodoEnvio !== 'retiro' && (
                  isCalculatingShipping ? (
                    <span className="text-gray-400">Calculando...</span>
                  ) : (calculatedShippingCost !== null && calculatedShippingCost !== undefined && calculatedShippingCost > 0) ? (
                    `+$${calculatedShippingCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                )}
              </span>
            </div>
            
            {/* Total */}
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total a Pagar</span>
              <span className="text-green-600">
                ${(() => {
                  const costoEnvio = formData.metodoEnvio === 'retiro' ? 0 : (calculatedShippingCost || 0);
                  return (directCart.total_price + costoEnvio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de pasos completados */}
        {currentStep > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border-2 border-green-200 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="font-semibold text-green-800">Datos completados</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Método de envío siempre se muestra */}
              <div className="bg-white p-3 rounded-lg flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <div>
                  <span className="font-medium text-gray-700">Método de envío:</span>
                  <span className="ml-2 text-gray-900">
                    {formData.metodoEnvio === 'retiro' && '🏪 Retiro en tienda'}
                    {formData.metodoEnvio === 'express' && '⚡ Express'}
                    {formData.metodoEnvio === 'programado' && '📅 Programado'}
                  </span>
                </div>
              </div>
              
              {/* Destinatario (solo en flujo de envío) */}
              {!isPickup && currentStep > 1 && formData.nombreDestinatario && (
                <div className="bg-white p-3 rounded-lg flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <div>
                    <span className="font-medium text-gray-700">Destinatario:</span>
                    <span className="ml-2 text-gray-900">{formData.nombreDestinatario}</span>
                  </div>
                </div>
              )}
              
              {/* Remitente */}
              {((isPickup && currentStep > 1) || (!isPickup && currentStep > 2)) && formData.nombre && (
                <div className="bg-white p-3 rounded-lg flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <div>
                    <span className="font-medium text-gray-700">Remitente:</span>
                    <span className="ml-2 text-gray-900">{formData.nombre}</span>
                  </div>
                </div>
              )}
              
              {/* Dedicatoria */}
              {((isPickup && currentStep > 2) || (!isPickup && currentStep > 3)) && formData.mensaje && (
                <div className="bg-white p-3 rounded-lg flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">Dedicatoria:</span>
                    <p className="ml-2 text-gray-900 text-sm italic mt-1">"{formData.mensaje}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Content con animación */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 mb-8 transform transition-all duration-300 hover:shadow-3xl animate-fadeIn">
          {/* PASO 0: ELEGIR MÉTODO DE ENVÍO (común para ambos flujos) */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-light mb-6">🚚 ¿Cómo deseas recibir tu pedido?</h2>
              <p className="text-gray-600 mb-6">Selecciona el método de envío que prefieras</p>
              
              <div className="space-y-4">
                {/* Retiro en Tienda */}
                <label 
                  className={`flex flex-col p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.metodoEnvio === 'retiro' 
                      ? 'bg-purple-50 border-2 border-purple-500 shadow-lg' 
                      : 'bg-white/50 hover:shadow-md border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoEnvio" 
                      value="retiro"
                      checked={formData.metodoEnvio === 'retiro'}
                      onChange={handleInputChange}
                      className="mr-4 mt-1 w-5 h-5 text-purple-600" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">🏪 Retiro en Tienda</span>
                        <span className="text-purple-600 font-semibold">Sin cargo</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-purple-600">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">Solano Vera 480 – Yerba Buena</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-purple-600">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Programa tu retiro (9:00 a 20:00 hs)
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Campos de fecha y hora para Retiro Programado */}
                {formData.metodoEnvio === 'retiro' && (
                  <div className="mt-4 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-purple-600">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="font-semibold text-lg text-purple-900">Programa tu retiro</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          📅 Fecha de retiro
                          <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date" 
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleInputChange}
                          min={(() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()}
                          required
                          className={`p-4 rounded-xl bg-white border-2 font-medium transition-all ${
                            formErrors.fecha 
                              ? 'border-red-400 bg-red-50 focus:border-red-500' 
                              : 'border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                          }`}
                        />
                        {formErrors.fecha && (
                          <span className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {formErrors.fecha}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          ⏰ Hora de retiro
                          <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="time" 
                          name="hora"
                          value={formData.hora}
                          onChange={handleInputChange}
                          min="09:00"
                          max="20:00"
                          required
                          className={`p-4 rounded-xl bg-white border-2 font-medium transition-all ${
                            formErrors.hora 
                              ? 'border-red-400 bg-red-50 focus:border-red-500' 
                              : 'border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                          }`}
                        />
                        {formErrors.hora && (
                          <span className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {formErrors.hora}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800 flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>Horario de retiro: De lunes a sábado de 9:00 a 20:00 hs. Domingos cerrado.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Envío Express */}
                {(() => {
                  const expressStatus = getExpressAvailabilityMessage();
                  const isAvailable = expressStatus.available;
                  
                  return (
                    <label 
                      className={`flex flex-col p-6 rounded-xl transition-all duration-200 ${
                        !isAvailable 
                          ? 'opacity-60 cursor-not-allowed bg-gray-100 border-2 border-gray-300' 
                          : formData.metodoEnvio === 'express' 
                            ? 'bg-green-50 border-2 border-green-500 shadow-lg cursor-pointer' 
                            : 'bg-white/50 hover:shadow-md border-2 border-transparent cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start">
                        <input 
                          type="radio" 
                          name="metodoEnvio" 
                          value="express"
                          checked={formData.metodoEnvio === 'express'}
                          onChange={handleInputChange}
                          disabled={!isAvailable}
                          className="mr-4 mt-1 w-5 h-5 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-lg">
                              ⚡ Envío Express 
                              <span className="text-sm text-gray-500 ml-1">(Solo en Yerba Buena)</span>
                            </span>
                            <span className={`font-semibold ${isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                              $10.000
                            </span>
                          </div>
                          {/* Mensaje de disponibilidad principal */}
                          <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg mb-2">
                            <div className="font-semibold flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {expressStatus.message}
                            </div>
                            {expressStatus.detail && (
                              <div className="text-xs mt-1 text-green-600">
                                {expressStatus.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isAvailable && (
                        <div className="mt-3 text-sm bg-green-50 p-3 rounded-lg text-green-700 border border-green-200">
                          <strong>Recomendado:</strong> Ideal para ocasiones especiales y entregas urgentes.
                        </div>
                      )}
                    </label>
                  );
                })()}

                {/* Campo de instrucciones para Envío Express */}
                {formData.metodoEnvio === 'express' && (
                  <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        📝 Instrucciones de entrega (opcional)
                      </label>
                      <textarea
                        name="instrucciones"
                        value={formData.instrucciones}
                        onChange={handleInputChange}
                        placeholder="Ej: Tocar timbre 2 veces, dejar con el portero, etc."
                        rows={3}
                        maxLength={200}
                        className="p-4 rounded-xl bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {formData.instrucciones.length}/200 caracteres
                      </span>
                    </div>
                  </div>
                )}

                {/* Envío Programado */}
                <label 
                  className={`flex flex-col p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.metodoEnvio === 'programado' 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' 
                      : 'bg-white/50 hover:shadow-md border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoEnvio" 
                      value="programado"
                      checked={formData.metodoEnvio === 'programado'}
                      onChange={handleInputChange}
                      className="mr-4 mt-1 w-5 h-5 text-blue-600" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">📅 Envío Programado</span>
                        <span className="text-blue-600 font-semibold">$5.000</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Elige fecha y franja horaria
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Selector de fecha y hora para Envío Programado */}
              {formData.metodoEnvio === 'programado' && (
                <div className="mt-6 space-y-4 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-semibold text-lg text-blue-900">Selecciona fecha y franja horaria</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        📅 Fecha de entrega
                        <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        min={(() => {
                          const now = new Date();
                          // Para envíos programados, la fecha mínima es siempre mañana
                          // (el mismo día solo está disponible para Express)
                          const tomorrow = new Date(now);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          
                          // Formatear como YYYY-MM-DD en zona horaria local
                          const year = tomorrow.getFullYear();
                          const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                          const day = String(tomorrow.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()}
                        required
                        className={`p-4 rounded-xl bg-white border-2 font-medium transition-all ${
                          formErrors.fecha 
                            ? 'border-red-400 bg-red-50 focus:border-red-500' 
                            : 'border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                      />
                      {formErrors.fecha && (
                        <span className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {formErrors.fecha}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        ⏰ Franja horaria
                        <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="franjaHoraria"
                        value={formData.franjaHoraria || ''}
                        onChange={handleInputChange}
                        title="Selecciona la franja horaria de entrega"
                        required
                        className={`p-4 rounded-xl bg-white border-2 font-medium transition-all ${
                          formErrors.franjaHoraria 
                            ? 'border-red-400 bg-red-50 focus:border-red-500' 
                            : 'border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                      >
                        <option value="">Selecciona una franja</option>
                        {(() => {
                          const availableSlots = getAvailableTimeSlots(formData.fecha);
                          return (
                            <>
                              {availableSlots.includes('mañana') && (
                                <option value="mañana">🌅 Mañana (9:00 a 12:00)</option>
                              )}
                              {availableSlots.includes('tarde') && (
                                <option value="tarde">🌆 Tarde (16:00 a 20:00)</option>
                              )}
                            </>
                          );
                        })()}
                      </select>
                      {formErrors.franjaHoraria && (
                        <span className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {formErrors.franjaHoraria}
                        </span>
                      )}
                      {(() => {
                        const availableSlots = getAvailableTimeSlots(formData.fecha);
                        if (formData.fecha && availableSlots.length === 1 && availableSlots[0] === 'tarde') {
                          return (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                              ⚠️ Solo disponible franja TARDE para esta fecha (son más de las 19:00 hs)
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Campo de instrucciones adicionales */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        📝 Instrucciones adicionales (opcional)
                      </label>
                      <textarea
                        name="instrucciones"
                        value={formData.instrucciones}
                        onChange={handleInputChange}
                        placeholder="Ej: Tocar timbre 2 veces, dejar con el portero, etc."
                        rows={3}
                        maxLength={200}
                        className="p-4 rounded-xl bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {formData.instrucciones.length}/200 caracteres
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span>El envío programado se realizará en la fecha y franja horaria seleccionada. Asegúrate de que haya alguien disponible para recibir el pedido.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FLUJO RETIRO EN TIENDA */}
          {isPickup && currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-light mb-6">👤 Datos del Remitente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col relative">
                  <input 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('nombre')}
                    className={`p-4 pr-12 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.nombre 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : touchedFields.nombre && formData.nombre.trim()
                        ? 'border-2 border-green-500 bg-green-50'
                        : 'bg-white/50 border-2 border-transparent focus:border-green-300'
                    }`} 
                    placeholder="Nombre *" 
                    disabled={formData.envioAnonimo}
                  />
                  {touchedFields.nombre && formData.nombre.trim() && !formErrors.nombre && (
                    <span className="absolute right-4 top-4 text-green-600 text-xl">✓</span>
                  )}
                  {formErrors.nombre && <span className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.nombre}</span>}
                </div>
                <input 
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`p-4 rounded-xl transition-all ${
                    formData.envioAnonimo
                      ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white/50 border-2 border-transparent focus:border-green-300'
                  }`}
                  placeholder="Apellido" 
                  disabled={formData.envioAnonimo}
                />
                <div className="flex flex-col relative">
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('email')}
                    className={`p-4 pr-12 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.email 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : touchedFields.email && formData.email.trim() && !formErrors.email
                        ? 'border-2 border-green-500 bg-green-50'
                        : 'bg-white/50 border-2 border-transparent focus:border-green-300'
                    }`} 
                    placeholder="Email *" 
                    disabled={formData.envioAnonimo}
                    aria-required="true"
                    aria-invalid="false"
                    {...(formErrors.email && { 'aria-invalid': 'true' })}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                  />
                  {touchedFields.email && formData.email.trim() && !formErrors.email && (
                    <span className="absolute right-4 top-4 text-green-600 text-xl">✓</span>
                  )}
                  {formErrors.email && <span id="email-error" className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.email}</span>}
                </div>
                <div className="flex flex-col relative">
                  <label htmlFor="telefono" className="sr-only">Teléfono</label>
                  <input 
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('telefono')}
                    className={`p-4 pr-12 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.telefono 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : touchedFields.telefono && formData.telefono.trim() && !formErrors.telefono
                        ? 'border-2 border-green-500 bg-green-50'
                        : 'bg-white/50 border-2 border-transparent focus:border-green-300'
                    }`} 
                    placeholder="Teléfono * (ej: 3815551234)" 
                    disabled={formData.envioAnonimo}
                    aria-required="true"
                    aria-invalid="false"
                    {...(formErrors.telefono && { 'aria-invalid': 'true' })}
                    aria-describedby={formErrors.telefono ? "telefono-error" : undefined}
                  />
                  {touchedFields.telefono && formData.telefono.trim() && !formErrors.telefono && (
                    <span className="absolute right-4 top-4 text-green-600 text-xl">✓</span>
                  )}
                  {formErrors.telefono && <span id="telefono-error" className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.telefono}</span>}
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                  <input 
                    type="checkbox" 
                    name="envioAnonimo"
                    checked={formData.envioAnonimo}
                    onChange={handleInputChange}
                    className="mr-3 w-4 h-4 text-blue-600" 
                  />
                  <span className="text-gray-700 font-medium">Envío anónimo</span>
                </label>
                {formData.envioAnonimo && (
                  <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">ℹ️ Los campos de remitente son opcionales</p>
                )}
              </div>
            </div>
          )}

          {isPickup && currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-light mb-6">💌 Dedicatoria y Extras</h2>
              
              {/* Dedicatoria */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Mensaje especial</h3>
                <textarea 
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-xl bg-white/50 border-0 h-32" 
                  placeholder="Escribe un mensaje especial (opcional)..."
                ></textarea>
                <input 
                  name="firmadoComo"
                  value={formData.firmadoComo}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-xl bg-white/50 border-0 mt-4" 
                  placeholder="Firmado como (opcional)" 
                />
                <div className="mt-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="incluirTarjeta"
                      checked={formData.incluirTarjeta}
                      onChange={handleInputChange}
                      className="mr-2" 
                    />
                    <span>Incluir tarjeta con el mensaje</span>
                  </label>
                </div>
              </div>

              {/* Extras */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-700">Agregar extras</h3>
                <ExtrasSelector
                  selectedExtras={selectedExtras}
                  onExtrasChange={(extras) => {
                    setSelectedExtras(extras);
                    setTimeout(() => {
                      reloadCart();
                    }, 1000);
                  }}
                />
              </div>
            </div>
          )}

          {isPickup && currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-light mb-6">💳 Método de Pago</h2>
              <p className="text-gray-600 mb-6">Selecciona cómo deseas pagar tu compra</p>
              
              {/* PayPal Integration v1.0 - 4 payment methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <label 
                  className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'mercadopago' ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' : 'bg-white/50 hover:bg-blue-50/30 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="mercadopago"
                      checked={formData.metodoPago === 'mercadopago'}
                      onChange={handleInputChange}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <div className="font-medium">MercadoPago</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <img src="/images/mercadopago.png" alt="MercadoPago" className="h-10" onError={(e) => {e.currentTarget.src = 'https://imgmp.mlstatic.com/org-img/banners/ar/medios/online/468X60.jpg'; e.currentTarget.className='h-8'}} />
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    Tarjetas (ARS)
                  </div>
                </label>
                
                <label 
                  className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'paypal' ? 'bg-blue-100 border-2 border-blue-600 shadow-lg' : 'bg-white/50 hover:bg-blue-100/30 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="paypal"
                      checked={formData.metodoPago === 'paypal'}
                      onChange={handleInputChange}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <div className="font-medium">PayPal</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 33" className="h-8">
                      <path fill="#003087" d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/>
                      <path fill="#0070E0" d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/>
                      <path fill="#003087" d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"/>
                      <path fill="#0070E0" d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z"/>
                      <path fill="#003087" d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z"/>
                      <path fill="#0070E0" d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z"/>
                    </svg>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    Pago en USD
                  </div>
                </label>
                
                <label 
                  className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'transferencia' ? 'bg-green-50 border-2 border-green-500 shadow-lg' : 'bg-white/50 hover:bg-green-50/30 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="transferencia"
                      checked={formData.metodoPago === 'transferencia'}
                      onChange={handleInputChange}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <div className="font-medium">Transferencia</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center text-3xl">
                    🏦
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    Transferencia bancaria
                  </div>
                </label>
                
                <label 
                  className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'efectivo' ? 'bg-yellow-50 border-2 border-yellow-500 shadow-lg' : 'bg-white/50 hover:bg-yellow-50/30 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="efectivo"
                      checked={formData.metodoPago === 'efectivo'}
                      onChange={handleInputChange}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <div className="font-medium">Efectivo</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center text-3xl">
                    💵
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    Pago al retirar
                  </div>
                </label>
              </div>
              
              {formData.metodoPago === 'paypal' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">💱</span>
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">Pago en Dólares (USD)</h3>
                      <p className="text-sm text-blue-800">
                        El pago se procesará en dólares estadounidenses (USD) usando la cotización oficial del día + 15% de margen.
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        Se te mostrará el monto exacto en USD antes de confirmar el pago en PayPal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.metodoPago === 'transferencia' && (
                <TransferPaymentData 
                  total={calculateTotal()} 
                  showQR={true}
                  pedidoId={undefined}
                  onCreateOrder={createOrderAndGetId}
                />
              )}
              
              <div className="mt-6">
                <div className="flex flex-col">
                  <label className="flex items-start">
                    <input 
                      type="checkbox" 
                      name="aceptaTerminos"
                      checked={formData.aceptaTerminos}
                      onChange={handleInputChange}
                      className={`mr-3 mt-1 ${formErrors.aceptaTerminos ? 'outline outline-2 outline-red-300' : ''}`} 
                    />
                    <span className="text-sm text-gray-600">
                      Acepto los <span className="text-green-600 underline cursor-pointer">términos y condiciones</span> y la <span className="text-green-600 underline cursor-pointer">política de privacidad</span>
                    </span>
                  </label>
                  {formErrors.aceptaTerminos && <span className="text-red-600 text-sm mt-1">{formErrors.aceptaTerminos}</span>}
                </div>
              </div>
            </div>
          )}

          {/* FLUJO ENVÍO A DOMICILIO */}
          {!isPickup && currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-light mb-6">📍 Datos del Destinatario</h2>
              
              {/* Mapa interactivo para seleccionar dirección */}
              <div className="mb-6">
                <AddressMapPicker
                  onAddressSelect={async (addressData: AddressData) => {
                    console.log('Dirección seleccionada:', addressData);
                    setFormData({
                      ...formData,
                      direccion: addressData.formatted_address,
                      ciudad: addressData.city,
                      codigoPostal: addressData.postal_code,
                      lat: addressData.lat,
                      lng: addressData.lng,
                    });
                  }}
                  shippingMethod={formData.metodoEnvio as 'express' | 'programado'}
                  initialLat={formData.lat}
                  initialLng={formData.lng}
                  onDistanceCalculated={async (distance: number, duration: string) => {
                    console.log(`📏 Distancia calculada: ${distance} km (${duration})`);
                    console.log(`🔍 Debug - calculateShippingCost existe:`, !!calculateShippingCost);
                    console.log(`🔍 Debug - directCart.total_price:`, directCart.total_price);
                    console.log(`🔍 Debug - metodoEnvio:`, formData.metodoEnvio);
                    
                    setDistanceKm(distance);
                    setShippingDuration(duration);
                    
                    // Calcular costo de envío
                    if (distance > 0 && calculateShippingCost) {
                      console.log(`💸 Llamando a calculateShippingCost con:`, {
                        distance,
                        method: formData.metodoEnvio,
                        orderAmount: directCart.total_price
                      });
                      
                      setIsCalculatingShipping(true);
                      try {
                        const result = await calculateShippingCost(
                          distance,
                          formData.metodoEnvio as 'express' | 'programado',
                          directCart.total_price
                        );
                        
                        console.log('💰 Costo de envío calculado:', result);
                        setCalculatedShippingCost(result.shipping_cost);
                      } catch (error) {
                        console.error('❌ Error calculando costo de envío:', error);
                      } finally {
                        setIsCalculatingShipping(false);
                      }
                    } else {
                      console.warn('⚠️ No se puede calcular costo:', {
                        distance,
                        hasCalculateFunction: !!calculateShippingCost
                      });
                    }
                  }}
                  defaultCenter={shippingConfig ? { lat: shippingConfig.store_lat, lng: shippingConfig.store_lng } : { lat: -26.8167, lng: -65.3167 }}
                  initialAddress={formData.direccion}
                />
              </div>

              {/* Info de distancia y costo */}
              {distanceKm > 0 && shippingConfig && (() => {
                const maxDistance = formData.metodoEnvio === 'express' 
                  ? shippingConfig.max_distance_express_km
                  : shippingConfig.max_distance_programado_km;
                const isOutOfCoverage = distanceKm > maxDistance;
                
                console.log('🎯 Validando cobertura:', {
                  metodo: formData.metodoEnvio,
                  distancia: distanceKm,
                  maxDistance,
                  isOutOfCoverage
                });
                
                // Solo mostrar mensaje si está fuera de cobertura
                if (isOutOfCoverage) {
                  return (
                    <div className="mb-6 p-4 rounded-xl border-2 bg-gradient-to-r from-red-50 to-orange-50 border-red-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-500">
                          <span className="text-white text-lg">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-red-900">
                            Fuera de cobertura
                          </h4>
                          <p className="text-red-900 font-semibold text-sm mt-2 bg-red-100 p-2 rounded">
                            ❌ Esta dirección supera la distancia máxima de {maxDistance} km para envío {formData.metodoEnvio}.
                            Por favor, selecciona otra dirección o cambia el método de envío.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // No mostrar nada si está dentro de cobertura
                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2">
                  <input 
                    name="nombreDestinatario"
                    value={formData.nombreDestinatario}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl bg-white/50 border-0 ${formErrors.nombreDestinatario ? 'border-2 border-red-300 bg-red-50/10' : ''}`}
                    placeholder="Nombre completo del destinatario" 
                  />
                  {formErrors.nombreDestinatario && <span className="text-red-600 text-sm mt-1">{formErrors.nombreDestinatario}</span>}
                </div>
                <div className="flex flex-col md:col-span-2">
                  <input 
                    name="telefonoDestinatario"
                    value={formData.telefonoDestinatario}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl bg-white/50 border-0 ${formErrors.telefonoDestinatario ? 'border-2 border-red-300 bg-red-50/10' : ''}`} 
                    placeholder="Teléfono (para coordinar la entrega)" 
                  />
                  {formErrors.telefonoDestinatario && <span className="text-red-600 text-sm mt-1">{formErrors.telefonoDestinatario}</span>}
                </div>
              </div>
              
              {/* Campos ocultos pero guardados */}
              <input type="hidden" name="apellidoDestinatario" value={formData.apellidoDestinatario} />
              <input type="hidden" name="codigoPostal" value={formData.codigoPostal} />
              <input type="hidden" name="direccion" value={formData.direccion} />
              <input type="hidden" name="ciudad" value={formData.ciudad} />
              
              {/* Checkbox para autocompletar con datos del remitente */}
              <div className="mt-6">
                <label className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={useSameAsRemitente}
                    onChange={(e) => setUseSameAsRemitente(e.target.checked)}
                    className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
                  />
                  <div className="flex-1">
                    <span className="text-gray-800 font-semibold">👤 Soy yo el destinatario</span>
                    <p className="text-sm text-gray-600 mt-1">Usar mis datos como remitente para el destinatario</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {!isPickup && currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-light mb-6">👤 Datos del Remitente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2">
                  <input 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.nombre 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : 'bg-white/50 border-0'
                    }`} 
                    placeholder="Nombre completo" 
                    disabled={formData.envioAnonimo}
                  />
                  {formErrors.nombre && <span className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.nombre}</span>}
                </div>
                <input type="hidden" name="apellido" value={formData.apellido} />
                <div className="flex flex-col">
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.email 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : 'bg-white/50 border-0'
                    }`} 
                    placeholder="Email" 
                    disabled={formData.envioAnonimo}
                    aria-required="true"
                    aria-invalid="false"
                    {...(formErrors.email && { 'aria-invalid': 'true' })}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                  />
                  {formErrors.email && <span id="email-error" className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.email}</span>}
                </div>
                <div className="flex flex-col">
                  <label htmlFor="telefono" className="sr-only">Teléfono</label>
                  <input 
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl transition-all ${
                      formData.envioAnonimo
                        ? 'bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                        : formErrors.telefono 
                        ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' 
                        : 'bg-white/50 border-0'
                    }`} 
                    placeholder="Teléfono (solo números, mínimo 7 dígitos)" 
                    disabled={formData.envioAnonimo}
                    aria-required="true"
                    aria-invalid="false"
                    {...(formErrors.telefono && { 'aria-invalid': 'true' })}
                    aria-describedby={formErrors.telefono ? "telefono-error" : undefined}
                  />
                  {formErrors.telefono && <span id="telefono-error" className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.telefono}</span>}
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                  <input 
                    type="checkbox" 
                    name="envioAnonimo"
                    checked={formData.envioAnonimo}
                    onChange={handleInputChange}
                    className="mr-3 w-4 h-4 text-blue-600" 
                  />
                  <span className="text-gray-700 font-medium">Envío anónimo</span>
                </label>
                {formData.envioAnonimo && (
                  <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">ℹ️ Los campos de remitente son opcionales</p>
                )}
              </div>
            </div>
          )}

          {!isPickup && currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-light mb-6">💌 Dedicatoria y Extras</h2>
              
              {/* Dedicatoria */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Mensaje especial</h3>
                <textarea 
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-xl bg-white/50 border-0 h-32" 
                  placeholder="Escribe un mensaje especial (opcional)..."
                ></textarea>
                <input 
                  name="firmadoComo"
                  value={formData.firmadoComo}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-xl bg-white/50 border-0 mt-4" 
                  placeholder="Firmado como (opcional)" 
                />
                <div className="mt-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="incluirTarjeta"
                      checked={formData.incluirTarjeta}
                      onChange={handleInputChange}
                      className="mr-2" 
                    />
                    <span>Incluir tarjeta con el mensaje</span>
                  </label>
                </div>
              </div>

              {/* Extras */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-700">Agregar extras</h3>
                <ExtrasSelector
                  selectedExtras={selectedExtras}
                  onExtrasChange={(extras) => {
                    setSelectedExtras(extras);
                    setTimeout(() => {
                      reloadCart();
                    }, 1000);
                  }}
                />
              </div>
            </div>
          )}

          {/* Paso 4 (Pago) para delivery */}
          {!isPickup && currentStep === 4 && (
            <div>
              {/* Método de pago ya seleccionado en paso anterior */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>Método de envío: <strong>
                    {formData.metodoEnvio === 'retiro' && '🏪 Retiro en tienda'}
                    {formData.metodoEnvio === 'express' && '⚡ Envío Express'}
                    {formData.metodoEnvio === 'programado' && '📅 Envío Programado'}
                  </strong></span>
                </p>
              </div>

              <h2 className="text-2xl font-light mb-6">💳 Método de Pago</h2>
              <p className="text-gray-600 mb-6">Selecciona cómo deseas pagar tu compra</p>
                
                {/* PayPal Integration v1.0 - 4 payment methods (Delivery) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <label 
                    className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'mercadopago' ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' : 'bg-white/50 hover:bg-blue-50/30 hover:shadow-md border-2 border-transparent'}`}
                  >
                    <div className="flex items-start">
                      <input 
                        type="radio" 
                        name="metodoPago" 
                        value="mercadopago"
                        checked={formData.metodoPago === 'mercadopago'}
                        onChange={handleInputChange}
                        className="mr-3 mt-1" 
                      />
                      <div>
                        <div className="font-medium">MercadoPago</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <img src="/images/mercadopago.png" alt="MercadoPago" className="h-10" onError={(e) => {e.currentTarget.src = 'https://imgmp.mlstatic.com/org-img/banners/ar/medios/online/468X60.jpg'; e.currentTarget.className='h-8'}} />
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      Tarjetas (ARS)
                    </div>
                  </label>
                  
                  <label 
                    className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'paypal' ? 'bg-blue-100 border-2 border-blue-600 shadow-lg' : 'bg-white/50 hover:bg-blue-100/30 hover:shadow-md border-2 border-transparent'}`}
                  >
                    <div className="flex items-start">
                      <input 
                        type="radio" 
                        name="metodoPago" 
                        value="paypal"
                        checked={formData.metodoPago === 'paypal'}
                        onChange={handleInputChange}
                        className="mr-3 mt-1" 
                      />
                      <div>
                        <div className="font-medium">PayPal</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 33" className="h-8">
                        <path fill="#003087" d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/>
                        <path fill="#0070E0" d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/>
                        <path fill="#003087" d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"/>
                        <path fill="#0070E0" d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z"/>
                        <path fill="#003087" d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z"/>
                        <path fill="#0070E0" d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z"/>
                      </svg>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      Pago en USD
                    </div>
                  </label>
                  
                  <label 
                    className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'transferencia' ? 'bg-green-50 border-2 border-green-500 shadow-lg' : 'bg-white/50 hover:bg-green-50/30 hover:shadow-md border-2 border-transparent'}`}
                  >
                    <div className="flex items-start">
                      <input 
                        type="radio" 
                        name="metodoPago" 
                        value="transferencia"
                        checked={formData.metodoPago === 'transferencia'}
                        onChange={handleInputChange}
                        className="mr-3 mt-1" 
                      />
                      <div>
                        <div className="font-medium">Transferencia</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center text-3xl">
                      🏦
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      Transferencia bancaria
                    </div>
                  </label>
                  
                  <label 
                    className={`flex flex-col h-full p-5 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoPago === 'efectivo' ? 'bg-yellow-50 border-2 border-yellow-500 shadow-lg' : 'bg-white/50 hover:bg-yellow-50/30 hover:shadow-md border-2 border-transparent'}`}
                  >
                    <div className="flex items-start">
                      <input 
                        type="radio" 
                        name="metodoPago" 
                        value="efectivo"
                        checked={formData.metodoPago === 'efectivo'}
                        onChange={handleInputChange}
                        className="mr-3 mt-1" 
                      />
                      <div>
                        <div className="font-medium">Efectivo</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center text-3xl">
                      💵
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      Pago al recibir
                    </div>
                  </label>
                </div>
                
                {formData.metodoPago === 'paypal' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">💱</span>
                      <div>
                        <h3 className="font-medium text-blue-900 mb-2">Pago en Dólares (USD)</h3>
                        <p className="text-sm text-blue-800">
                          El pago se procesará en dólares estadounidenses (USD) usando la cotización oficial del día + 15% de margen.
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                          Se te mostrará el monto exacto en USD antes de confirmar el pago en PayPal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.metodoPago === 'transferencia' && (
                  <TransferPaymentData 
                    total={calculateTotal()} 
                    showQR={true}
                    pedidoId={undefined}
                    onCreateOrder={createOrderAndGetId}
                  />
                )}
                
                <div className="mt-6">
                  <div className="flex flex-col">
                    <label className="flex items-start">
                      <input 
                        type="checkbox" 
                        name="aceptaTerminos"
                        checked={formData.aceptaTerminos}
                        onChange={handleInputChange}
                        className={`mr-3 mt-1 ${formErrors.aceptaTerminos ? 'outline outline-2 outline-red-300' : ''}`} 
                      />
                      <span className="text-sm text-gray-600">
                        Acepto los <span className="text-green-600 underline cursor-pointer">términos y condiciones</span> y la <span className="text-green-600 underline cursor-pointer">política de privacidad</span>
                      </span>
                    </label>
                    {formErrors.aceptaTerminos && <span className="text-red-600 text-sm mt-1">{formErrors.aceptaTerminos}</span>}
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons mejorados */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          {currentStep > 0 ? (
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-medium text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              ← Anterior
            </button>
          ) : (
            <div className="hidden sm:block">{/* Espacio vacío en desktop */}</div>
          )}
          
          {currentStep < (isPickup ? 3 : 4) ? (
            <div className="flex flex-col items-stretch sm:items-end flex-1 sm:flex-initial">
              {formSubmitted && Object.keys(formErrors).length > 0 && (
                <p className="text-red-500 text-sm mb-2 text-center sm:text-right bg-red-50 p-2 rounded-lg border border-red-200">
                  ⚠️ Por favor, completa correctamente todos los campos requeridos.
                </p>
              )}
              <button
                onClick={nextStep}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 font-semibold text-lg shadow-lg hover:scale-105 transform"
              >
                Siguiente →
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-stretch sm:items-end flex-1 sm:flex-initial">
              {formSubmitted && Object.keys(formErrors).length > 0 && (
                <p className="text-red-500 text-sm mb-2 text-center sm:text-right bg-red-50 p-2 rounded-lg border border-red-200">
                  ⚠️ Debes aceptar los términos y condiciones para continuar.
                </p>
              )}
              <button
                onClick={handleFinalizarPedido}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl hover:shadow-xl transition-all text-lg font-bold flex items-center justify-center gap-3 shadow-lg hover:scale-105 transform disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>🎉 Confirmar Pedido</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepCheckoutPage;
