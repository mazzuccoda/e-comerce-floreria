'use client';

import React, { useState, useEffect } from 'react';
import { useCartRobust } from '@/context/CartContextRobust';
import { useAuth } from '@/context/AuthContext';
import ExtrasSelector from '@/app/components/ExtrasSelector';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

// Interfaces para carrito directo
interface CartItem {
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagen: string;
  };
  quantity: number;
  price: number;
  total_price: number;
}

interface DirectCart {
  items: CartItem[];
  total_price: number;
  total_items: number;
  is_empty: boolean;
}

const MultiStepCheckoutPage = () => {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [directCart, setDirectCart] = useState<DirectCart>({
    items: [],
    total_price: 0,
    total_items: 0,
    is_empty: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<number[]>([]);

  // Función para recargar el carrito
  const reloadCart = async () => {
    try {
      console.log('🔄 Recargando carrito...');
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
        const normalizedCart = {
          items: Array.isArray(data.items) ? data.items : [],
          total_price: parseFloat(data.total_price) || 0,
          total_items: parseInt(data.total_items) || 0,
          is_empty: Boolean(data.is_empty)
        };
        setDirectCart(normalizedCart);
        console.log('✅ Carrito recargado:', normalizedCart);
      }
    } catch (error) {
      console.error('❌ Error recargando carrito:', error);
    }
  };

  // Carga directa del carrito desde el API, sin depender del contexto
  useEffect(() => {
    const fetchCartDirectly = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Checkout - Cargando carrito directamente del API...');
        
        const endpoint = `${API_URL}/carrito/simple/`;
        console.log('📡 Fetch URL:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log(`📡 ${endpoint} - Status:`, response.status, response.statusText);
        
        let successData = null;
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} - Datos:`, data);
          
          if (data && Array.isArray(data.items)) {
            successData = data;
            console.log(`🎉 ${endpoint} - ¡Encontrados ${data.items.length} productos!`);
          } else {
            console.log(`⚠️ ${endpoint} - Carrito vacío o inválido`)
          }
        }
        
        if (successData) {
          // Normalizar datos
          const normalizedCart = {
            items: Array.isArray(successData.items) ? successData.items : [],
            total_price: parseFloat(successData.total_price) || 0,
            total_items: parseInt(successData.total_items) || 0,
            is_empty: Boolean(successData.is_empty)
          };
          
          setDirectCart(normalizedCart);
          setHasError(false);
        } else {
          throw new Error('No se pudo cargar el carrito desde ningún endpoint');
        }
      } catch (error) {
        console.error('❌ Checkout - Error cargando carrito:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCartDirectly();
  }, []);
  
  const steps = [
    { id: 1, title: 'Remitente', icon: '👤' },
    { id: 2, title: 'Destinatario', icon: '📍' },
    { id: 3, title: 'Dedicatoria', icon: '💌' },
    { id: 4, title: 'Extras', icon: '🎁' },
    { id: 5, title: 'Envío', icon: '🚚' },
    { id: 6, title: 'Pago', icon: '💳' }
  ];

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
    metodoEnvio: 'express',
    fecha: '',
    hora: '',
    instrucciones: '',
    // Pago
    metodoPago: 'mercadopago',
    aceptaTerminos: false
  });
  
  // Estado para los errores del formulario
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estado para indicar si se ha intentado enviar el formulario
  const [formSubmitted, setFormSubmitted] = useState(false);

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
        error = formData.metodoEnvio === 'programado' && !value ? 'Selecciona una fecha para el envío programado' : '';
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
    console.log(`🔍 Validando paso ${currentStep}...`);
    const errors: Record<string, string> = {};
    
    switch(currentStep) {
      case 1: // Remitente
        console.log('👤 Validando datos del remitente');
        if (!formData.envioAnonimo) {
          errors.nombre = validateField('nombre', formData.nombre);
          errors.email = validateField('email', formData.email);
          errors.telefono = validateField('telefono', formData.telefono);
        } else {
          console.log('El envío es anónimo, no se validan datos del remitente');
        }
        break;
      
      case 2: // Destinatario
        console.log('📍 Validando datos del destinatario');
        errors.nombreDestinatario = validateField('nombreDestinatario', formData.nombreDestinatario);
        errors.telefonoDestinatario = validateField('telefonoDestinatario', formData.telefonoDestinatario);
        errors.direccion = validateField('direccion', formData.direccion);
        errors.ciudad = validateField('ciudad', formData.ciudad);
        break;
      
      case 5: // Envío
        console.log('🚚 Validando datos de envío');
        if (formData.metodoEnvio === 'programado') {
          errors.fecha = validateField('fecha', formData.fecha);
        }
        break;
      
      case 6: // Pago
        console.log('💳 Validando datos de pago');
        errors.aceptaTerminos = validateField('aceptaTerminos', formData.aceptaTerminos);
        break;
    }
    
    // Filtrar los campos vacíos
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== '')
    );
    
    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Maneja los cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;
    
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
    
    if (isValid && currentStep < 6) {
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Al retroceder, no es necesario validar
      setFormSubmitted(false);
    }
  };

  // Calcular total con extras
  const calculateTotal = () => {
    let total = directCart.total_price || 0;
    if (formData.tarjetaPersonalizada) total += 5000;
    if (formData.osoDePerluche) total += 15000;
    if (formData.metodoEnvio === 'programado') total += 5000;
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
    
    try {
      console.log('🚀 INICIANDO CREACIÓN DE PEDIDO');
      alert('🚀 Iniciando creación de pedido...');
      
      // Verificar carrito primero usando API existente
      console.log('📡 Haciendo request a carrito...');
      const cartResponse = await fetch(`${API_URL}/carrito/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      console.log('📡 Response status carrito:', cartResponse.status);
      const cartData = await cartResponse.json();
      console.log('📦 Estado del carrito completo:', JSON.stringify(cartData, null, 2));
      
      if (!cartData.items || cartData.items.length === 0) {
        console.log('❌ CARRITO VACÍO - items:', cartData.items);
        alert('❌ El carrito está vacío. Agrega productos antes de finalizar el pedido.');
        return;
      }
      
      console.log(`✅ CARRITO VÁLIDO: ${cartData.items.length} productos`);
      alert(`✅ Carrito verificado: ${cartData.items.length} productos por $${cartData.total_price}`);

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
      
      // Preparar items del carrito para enviar
      const items = cartData.items.map((item: any) => ({
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
          fecha_entrega: fechaEntrega,
          franja_horaria: "mañana", // Valor debe ser exactamente 'mañana' o 'tarde'
          metodo_envio_id: 1,
          
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
          // Guardar datos del pedido en localStorage para mostrar en la página de éxito
          const pedidoData = {
            pedido_id: result.pedido_id,
            numero_pedido: result.numero_pedido,
            total: result.total,
            items: cartData.items,
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
            fecha_entrega: fechaEntrega,
            medio_pago: formData.metodoPago
          };
          
          localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoData));
          
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extralight text-gray-900 mb-4">
            <span className="text-green-500">Florería</span> Cristina
          </h1>
          <p className="text-lg text-gray-600">
            Paso {currentStep} de 6: <span className="font-medium text-green-600">{steps[currentStep-1].title}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12 overflow-hidden">
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

        {/* Step Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-8">
          {currentStep === 1 && (
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
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="envioAnonimo"
                    checked={formData.envioAnonimo}
                    onChange={handleInputChange}
                    className="mr-2" 
                  />
                  <span>Envío anónimo</span>
                </label>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-light mb-6">📍 Datos del Destinatario</h2>
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
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-light mb-6">💌 Dedicatoria</h2>
              <textarea 
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-white/50 border-0 h-32" 
                placeholder="Mensaje especial..."
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
          )}

          {currentStep === 4 && (
            <ExtrasSelector
              selectedExtras={selectedExtras}
              onExtrasChange={(extras) => {
                setSelectedExtras(extras);
                // Recargar el carrito después de agregar/quitar extras
                // Esperar un poco para que el backend procese
                setTimeout(() => {
                  reloadCart();
                }, 1000);
              }}
            />
          )}

          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-light mb-6">🚚 Método de Envío</h2>
              <p className="text-gray-600 mb-6">Selecciona cómo deseas que entregemos tus flores</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label 
                  className={`flex flex-col h-full p-6 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoEnvio === 'express' ? 'bg-green-50 border-2 border-green-500 shadow-lg' : 'bg-white/50 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoEnvio" 
                      value="express"
                      checked={formData.metodoEnvio === 'express'}
                      onChange={handleInputChange}
                      className="mr-4 mt-1" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">Envío Express</span>
                        <span className="text-green-600 font-medium">Gratis</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-green-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Entrega el mismo día (2-4 horas)
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm bg-green-50 p-3 rounded text-green-700 border border-green-100">
                    <strong>Recomendado:</strong> Ideal para ocasiones especiales y entregas urgentes.
                  </div>
                </label>
                
                <label 
                  className={`flex flex-col h-full p-6 rounded-xl cursor-pointer transition-all duration-200 ${formData.metodoEnvio === 'programado' ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' : 'bg-white/50 hover:shadow-md border-2 border-transparent'}`}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="metodoEnvio" 
                      value="programado"
                      checked={formData.metodoEnvio === 'programado'}
                      onChange={handleInputChange}
                      className="mr-4 mt-1" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">Envío Programado</span>
                        <span className="text-blue-600 font-medium">$5.000</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Elige fecha y hora específica
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm bg-blue-50 p-3 rounded text-blue-700 border border-blue-100">
                    <strong>Planificado:</strong> Perfecto para aniversarios, cumpleaños y eventos programados.
                  </div>
                </label>
              </div>
              
              {formData.metodoEnvio === 'programado' && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <input 
                        type="date" 
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        className={`p-4 rounded-xl bg-white/50 border-0 ${formErrors.fecha ? 'border-2 border-red-300 bg-red-50/10' : ''}`}
                      />
                      {formErrors.fecha && <span className="text-red-600 text-sm mt-1">{formErrors.fecha}</span>}
                    </div>
                    <input 
                      type="time" 
                      name="hora"
                      value={formData.hora}
                      onChange={handleInputChange}
                      className="p-4 rounded-xl bg-white/50 border-0" 
                    />
                  </div>
                  <textarea 
                    name="instrucciones"
                    value={formData.instrucciones}
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-white/50 border-0 h-20" 
                    placeholder="Instrucciones especiales de entrega..."
                  ></textarea>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
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
                    Pago al recibir
                  </div>
                </label>
              </div>
              
              {formData.metodoPago === 'transferencia' && (
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100">
                  <h4 className="font-medium mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Datos para transferencia:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600"><strong>Banco:</strong> Banco de Argentina</p>
                      <p className="text-gray-600"><strong>Titular:</strong> Florería Cristina S.A.</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>CBU:</strong> 0000000000000000000000</p>
                      <p className="text-gray-600"><strong>CUIT:</strong> 30-12345678-9</p>
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

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Anterior
            </button>
          ) : (
            <div>{/* Espacio vacío para mantener la justificación */}</div>
          )}
          
          {currentStep < 6 ? (
            <div className="flex flex-col items-end">
              {formSubmitted && Object.keys(formErrors).length > 0 && (
                <p className="text-red-500 text-sm mb-2">
                  Por favor, completa correctamente todos los campos requeridos.
                </p>
              )}
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 font-medium"
              >
                Siguiente
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              {formSubmitted && Object.keys(formErrors).length > 0 && (
                <p className="text-red-500 text-sm mb-2">
                  Debes aceptar los términos y condiciones para continuar.
                </p>
              )}
              <button
                onClick={handleFinalizarPedido}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all text-lg font-medium flex items-center gap-2"
              >
                <span>Confirmar Pedido</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
              <path d="M16.5 9.4 7.55 4.24"/>
              <polyline points="3.29 7 12 12 20.71 7"/>
              <line x1="12" y1="22" x2="12" y2="12"/>
              <circle cx="18.5" cy="15.5" r="2.5"/>
              <path d="M20.27 17.27 22 19"/>
            </svg>
            <span>Resumen del pedido</span>
          </h3>
          
          {/* Productos del carrito */}
          {directCart?.items && directCart.items.length > 0 ? (
            <div className="space-y-3 mb-4 divide-y divide-gray-100">
              {directCart.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center pt-3 first:pt-0">
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center text-xl">🌸</div>
                    <div>
                      <span className="font-medium text-gray-800">{item.producto.nombre}</span>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">Cantidad: {item.quantity}</span>
                        <span className="text-gray-400">|</span>
                        <span>${(Number(item.price)).toFixed(2)} c/u</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-green-600">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
              ⚠️ No hay productos en el carrito
              <br />
              <button 
                onClick={() => window.location.href = '/'} 
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Ir a agregar productos
              </button>
            </div>
          )}
          
          {/* Extras */}
          {formData.tarjetaPersonalizada && (
            <div className="flex justify-between items-center text-sm">
              <span>📝 Tarjeta Personalizada</span>
              <span>+$5.000</span>
            </div>
          )}
          {formData.osoDePerluche && (
            <div className="flex justify-between items-center text-sm">
              <span>🧸 Oso de Peluche</span>
              <span>+$15.000</span>
            </div>
          )}
          {formData.metodoEnvio === 'programado' && (
            <div className="flex justify-between items-center text-sm">
              <span>🚚 Envío Programado</span>
              <span>+$5.000</span>
            </div>
          )}
          
          {/* Subtotal y extras */}
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${directCart.total_price.toFixed(2)}</span>
            </div>
            
            {formData.tarjetaPersonalizada && (
              <div className="flex justify-between text-gray-600">
                <span>Tarjeta personalizada</span>
                <span>$5,000.00</span>
              </div>
            )}
            
            {formData.osoDePerluche && (
              <div className="flex justify-between text-gray-600">
                <span>Oso de peluche</span>
                <span>$15,000.00</span>
              </div>
            )}
            
            {formData.metodoEnvio === 'programado' && (
              <div className="flex justify-between text-gray-600">
                <span>Envío programado</span>
                <span>$5,000.00</span>
              </div>
            )}
            
            <div className="flex justify-between font-semibold text-lg text-green-700 pt-2 border-t border-dashed border-gray-100">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepCheckoutPage;
