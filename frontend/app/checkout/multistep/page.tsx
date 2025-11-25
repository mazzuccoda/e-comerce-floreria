'use client';

import React, { useState, useEffect } from 'react';
import { useCartRobust } from '@/context/CartContextRobust';
import { useAuth } from '@/context/AuthContext';
import ExtrasSelector from '@/app/components/ExtrasSelector';
import AddressMapPicker from '@/app/components/AddressMapPicker';
import { AddressData } from '@/types/Address';
import dynamic from 'next/dynamic';

// Importar componente de datos de transferencia dinámicamente
const TransferPaymentData = dynamic(() => import('@/components/TransferPaymentData'), {
  ssr: false,
  loading: () => (
    <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100 animate-pulse">
      <div className="h-6 bg-green-200 rounded w-1/3 mb-4"></div>
      <div className="h-32 bg-green-200 rounded"></div>
    </div>
  )
});

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

  // Carga inicial del carrito: primero localStorage, luego API si hace falta
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
      setCurrentStep(currentStep + 1);
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
        return 10000;
      case 'programado':
        return 5000;
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
      // Asegurarnos de que la fecha es futura (al menos mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Si cae domingo, moverla al lunes
      if (tomorrow.getDay() === 0) { // 0 = domingo
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      // Formato YYYY-MM-DD para la fecha
      const fechaEntrega = tomorrow.toISOString().split('T')[0];
      
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
          franja_horaria: formData.metodoEnvio === 'programado' ? (formData.franjaHoraria || 'mañana') : 'mañana',
          metodo_envio_id: 1,
          metodo_envio: formData.metodoEnvio, // 'retiro', 'express', 'programado'
          costo_envio: getShippingCost(), // Costo de envío calculado
          
          // Datos adicionales - opcionales
          dedicatoria: formData.mensaje || "Entrega de Florería Cristina",
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
        const totalConEnvio = parseFloat(result.total) + costoEnvio;
        
        const pedidoData = {
          pedido_id: result.pedido_id,
          numero_pedido: result.numero_pedido,
          total: totalConEnvio.toString(), // Total incluyendo envío
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
        } else {
          // Para otros métodos de pago, redirigir directamente a la página de éxito
          
          // Para otros métodos de pago, redirigir a página de éxito
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-24 sm:pt-28">
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
                {formData.metodoEnvio === 'express' && '+$10.000,00'}
                {formData.metodoEnvio === 'programado' && '+$5.000,00'}
              </span>
            </div>
            
            {/* Total */}
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total a Pagar</span>
              <span className="text-green-600">
                ${(() => {
                  const costoEnvio = formData.metodoEnvio === 'express' ? 10000 : formData.metodoEnvio === 'programado' ? 5000 : 0;
                  return (directCart.total_price + costoEnvio).toLocaleString('es-AR', { minimumFractionDigits: 2 });
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
                          Retiro en horario comercial
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Envío Express */}
                <label 
                  className={`flex flex-col p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.metodoEnvio === 'express' 
                      ? 'bg-green-50 border-2 border-green-500 shadow-lg' 
                      : 'bg-white/50 hover:shadow-md border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoEnvio" 
                      value="express"
                      checked={formData.metodoEnvio === 'express'}
                      onChange={handleInputChange}
                      className="mr-4 mt-1 w-5 h-5 text-green-600" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">⚡ Envío Express <span className="text-sm text-gray-500">(Solo en Yerba Buena)</span></span>
                        <span className="text-green-600 font-semibold">$10.000</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-green-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Entrega el mismo día (2-4 horas)
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm bg-green-50 p-3 rounded-lg text-green-700 border border-green-200">
                    <strong>Recomendado:</strong> Ideal para ocasiones especiales y entregas urgentes.
                  </div>
                </label>

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
                          const currentHour = now.getHours();
                          // Si son más de las 17:00, la fecha mínima es mañana
                          if (currentHour >= 17) {
                            const tomorrow = new Date(now.getTime() + 86400000);
                            return tomorrow.toISOString().split('T')[0];
                          }
                          // Si son menos de las 17:00, puede ser hoy
                          return now.toISOString().split('T')[0];
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
                        <option value="manana">🌅 Mañana (9:00 a 12:00)</option>
                        <option value="tarde">🌆 Tarde (16:00 a 20:00)</option>
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
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>El envío programado se realizará en la fecha y franja horaria seleccionada. Asegúrate de que haya alguien disponible para recibir el pedido.</span>
                      </p>
                    </div>
                    {(() => {
                      const currentHour = new Date().getHours();
                      if (currentHour >= 17) {
                        return (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800 flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              <span>Son más de las 17:00 hs. Los envíos programados están disponibles a partir de mañana.</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
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
                      formErrors.nombre 
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
                  className="p-4 rounded-xl bg-white/50 border-2 border-transparent focus:border-green-300 transition-all" 
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
                      formErrors.email 
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
                      formErrors.telefono 
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    Tarjetas de crédito/débito
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
              
              {formData.metodoPago === 'transferencia' && (
                <TransferPaymentData 
                  total={calculateTotal()} 
                  showQR={true}
                  pedidoId={undefined}
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
                  onAddressSelect={(addressData: AddressData) => {
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
                  defaultCenter={{ lat: -34.6037, lng: -58.3816 }}
                  initialAddress={formData.direccion}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <input 
                    name="nombreDestinatario"
                    value={formData.nombreDestinatario}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl bg-white/50 border-0 ${formErrors.nombreDestinatario ? 'border-2 border-red-300 bg-red-50/10' : ''}`}
                    placeholder="Nombre destinatario" 
                  />
                  {formErrors.nombreDestinatario && <span className="text-red-600 text-sm mt-1">{formErrors.nombreDestinatario}</span>}
                </div>
                <input 
                  name="apellidoDestinatario"
                  value={formData.apellidoDestinatario}
                  onChange={handleInputChange}
                  className="p-4 rounded-xl bg-white/50 border-0" 
                  placeholder="Apellido destinatario" 
                />
                <div className="flex flex-col">
                  <input 
                    name="telefonoDestinatario"
                    value={formData.telefonoDestinatario}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl bg-white/50 border-0 ${formErrors.telefonoDestinatario ? 'border-2 border-red-300 bg-red-50/10' : ''}`} 
                    placeholder="Teléfono" 
                  />
                  {formErrors.telefonoDestinatario && <span className="text-red-600 text-sm mt-1">{formErrors.telefonoDestinatario}</span>}
                </div>
                <input 
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                  className="p-4 rounded-xl bg-white/50 border-0" 
                  placeholder="Código Postal" 
                />
              </div>
              <div className="flex flex-col w-full mt-4">
                <input 
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className={`w-full p-4 rounded-xl bg-white/50 border-0 ${formErrors.direccion ? 'border-2 border-red-300 bg-red-50/10' : ''}`}
                  placeholder="Dirección completa" 
                />
                {formErrors.direccion && <span className="text-red-600 text-sm mt-1">{formErrors.direccion}</span>}
              </div>
              <div className="flex flex-col w-full mt-4">
                <input 
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  className={`w-full p-4 rounded-xl bg-white/50 border-0 ${formErrors.ciudad ? 'border-2 border-red-300 bg-red-50/10' : ''}`}
                  placeholder="Ciudad" 
                />
                {formErrors.ciudad && <span className="text-red-600 text-sm mt-1">{formErrors.ciudad}</span>}
              </div>
              
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
                <div className="flex flex-col">
                  <input 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl ${formErrors.nombre ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' : 'bg-white/50 border-0'}`} 
                    placeholder="Nombre" 
                    disabled={formData.envioAnonimo}
                  />
                  {formErrors.nombre && <span className="text-red-600 font-medium text-sm mt-1">⚠️ {formErrors.nombre}</span>}
                </div>
                <input 
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="p-4 rounded-xl bg-white/50 border-0" 
                  placeholder="Apellido" 
                />
                <div className="flex flex-col">
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`p-4 rounded-xl ${formErrors.email ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' : 'bg-white/50 border-0'}`} 
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
                    className={`p-4 rounded-xl ${formErrors.telefono ? 'border-2 border-red-500 bg-red-50 shadow-md shadow-red-300/30' : 'bg-white/50 border-0'}`} 
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                      Tarjetas de crédito/débito
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
                
                {formData.metodoPago === 'transferencia' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl mb-6 border-2 border-green-200 shadow-lg">
                    <h4 className="font-semibold text-lg mb-4 flex items-center text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Datos para transferencia
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Alias</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('eleososatuc', 'alias')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-all"
                          >
                            {copiedField === 'alias' ? (
                              <>✓ Copiado</>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copiar
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xl font-bold text-gray-800">eleososatuc</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">CVU</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('0000003100095405777972', 'cvu')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-all"
                          >
                            {copiedField === 'cvu' ? (
                              <>✓ Copiado</>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copiar
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-lg font-mono font-semibold text-gray-800">0000003100095405777972</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <span className="text-xs font-medium text-gray-500">Banco</span>
                          <p className="font-semibold text-gray-800">Mercado Pago</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <span className="text-xs font-medium text-gray-500">CUIT</span>
                          <p className="font-semibold text-gray-800">27-26676582-2</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-xs font-medium text-gray-500">Titular</span>
                        <p className="font-semibold text-gray-800">Monica Eleonora Sosa</p>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                          </svg>
                          <span>Envía el comprobante de transferencia por WhatsApp al <strong>3813671352</strong> para confirmar tu pedido.</span>
                        </p>
                      </div>
                    </div>
                  </div>
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
