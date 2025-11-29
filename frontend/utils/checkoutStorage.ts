/**
 * Utilidad para guardar y recuperar el progreso del checkout
 * Permite que el usuario retome su pedido donde lo dejó
 */

const CHECKOUT_STORAGE_KEY = 'checkout_progress';
const CHECKOUT_EXPIRY_DAYS = 7; // Días antes de que expire el progreso guardado

export interface CheckoutProgress {
  formData: {
    // Remitente
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    envioAnonimo: boolean;
    // Destinatario
    nombreDestinatario: string;
    apellidoDestinatario: string;
    telefonoDestinatario: string;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
    referencia: string;
    lat: number;
    lng: number;
    // Dedicatoria
    mensaje: string;
    firmadoComo: string;
    incluirTarjeta: boolean;
    // Extras
    tarjetaPersonalizada: boolean;
    textoTarjeta: string;
    osoDePerluche: boolean;
    tipoOso: string;
    // Envío
    metodoEnvio: string;
    fecha: string;
    hora: string;
    franjaHoraria: string;
    instrucciones: string;
    // Pago
    metodoPago: string;
    aceptaTerminos: boolean;
  };
  currentStep: number;
  selectedExtras: number[];
  timestamp: number;
}

/**
 * Guarda el progreso del checkout en localStorage
 */
export const saveCheckoutProgress = (progress: Omit<CheckoutProgress, 'timestamp'>): void => {
  try {
    if (typeof window === 'undefined') return;

    const dataToSave: CheckoutProgress = {
      ...progress,
      timestamp: Date.now(),
    };

    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('💾 Progreso del checkout guardado');
  } catch (error) {
    console.error('❌ Error guardando progreso del checkout:', error);
  }
};

/**
 * Recupera el progreso del checkout desde localStorage
 * Retorna null si no hay progreso guardado o si expiró
 */
export const loadCheckoutProgress = (): CheckoutProgress | null => {
  try {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!stored) return null;

    const progress: CheckoutProgress = JSON.parse(stored);

    // Verificar si el progreso expiró
    const expiryTime = CHECKOUT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Días a milisegundos
    const isExpired = Date.now() - progress.timestamp > expiryTime;

    if (isExpired) {
      console.log('⏰ Progreso del checkout expirado, limpiando...');
      clearCheckoutProgress();
      return null;
    }

    console.log('✅ Progreso del checkout recuperado');
    return progress;
  } catch (error) {
    console.error('❌ Error cargando progreso del checkout:', error);
    return null;
  }
};

/**
 * Limpia el progreso guardado del checkout
 */
export const clearCheckoutProgress = (): void => {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    console.log('🗑️ Progreso del checkout limpiado');
  } catch (error) {
    console.error('❌ Error limpiando progreso del checkout:', error);
  }
};

/**
 * Verifica si hay progreso guardado
 */
export const hasCheckoutProgress = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;

    const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!stored) return false;

    const progress: CheckoutProgress = JSON.parse(stored);
    const expiryTime = CHECKOUT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - progress.timestamp > expiryTime;

    return !isExpired;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el tiempo transcurrido desde que se guardó el progreso
 */
export const getProgressAge = (): number | null => {
  try {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!stored) return null;

    const progress: CheckoutProgress = JSON.parse(stored);
    return Date.now() - progress.timestamp;
  } catch (error) {
    return null;
  }
};

/**
 * Formatea el tiempo transcurrido en un string legible
 */
export const formatProgressAge = (): string | null => {
  const age = getProgressAge();
  if (!age) return null;

  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'hace un momento';
};
