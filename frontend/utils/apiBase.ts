const DEFAULT_API_URL = 'https://e-comerce-floreria-production.up.railway.app/api';

// Base con /api incluido (ej: https://dominio/api)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

// Base sin /api, para armar rutas que ya lo incluyen
export const API_ROOT = API_URL.replace(/\/api$/, '');
