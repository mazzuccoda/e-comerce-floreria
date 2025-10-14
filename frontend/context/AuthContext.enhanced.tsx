'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  perfil: {
    telefono: string;
    direccion: string;
    ciudad: string;
    codigo_postal: string;
    fecha_nacimiento: string | null;
    recibir_ofertas: boolean;
  };
}

interface TokenData {
  token: string;
  refresh_token: string;
  expiry: number; // timestamp de expiración
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
  tokenData: TokenData | null;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  fecha_nacimiento?: string;
  recibir_ofertas?: boolean;
}

interface JwtPayload {
  exp: number;
  user_id: number;
  jti: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener URL de API dinámica
  const getApiUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      // Server-side: usar URL interna de Docker
      return 'http://web:8000/api';
    } else {
      // Client-side: usar Nginx como proxy
      return 'http://localhost/api';
    }
  }, []);

  // Función para verificar si el token está expirado
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Agregar margen de seguridad de 60 segundos
      return decoded.exp < currentTime - 60;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return true; // Si hay error, considerar expirado
    }
  }, []);

  // Función para refrescar token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!tokenData?.refresh_token) return false;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/usuarios/simple/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ refresh: tokenData.refresh_token }),
      });

      if (!response.ok) {
        throw new Error('Error al refrescar token');
      }

      const data = await response.json();
      
      // Calcular expiración (1 hora desde ahora)
      const expiry = Date.now() + 3600 * 1000;
      
      const newTokenData: TokenData = {
        token: data.access,
        refresh_token: data.refresh || tokenData.refresh_token,
        expiry
      };
      
      setTokenData(newTokenData);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokenData));
      
      return true;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return false;
    }
  }, [tokenData, getApiUrl]);

  // Función para obtener CSRF token
  const getCsrfToken = useCallback(() => {
    // En una aplicación real, obtendríamos esto de las cookies
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));
    
    return csrfCookie ? csrfCookie.split('=')[1] : '';
  }, []);

  // Función para hacer peticiones a la API con manejo automático de token
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // Verificar si el token está expirado y refrescarlo si es necesario
    if (tokenData && isTokenExpired(tokenData.token)) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        // Si no se puede refrescar, forzar logout
        logout();
        throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
    }

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}${endpoint}`, {
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': getCsrfToken(),
        ...(tokenData && { 'Authorization': `Bearer ${tokenData.token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [tokenData, isTokenExpired, refreshToken, getApiUrl, getCsrfToken]);

  // Cargar datos de autenticación al inicializar
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const savedTokenData = localStorage.getItem('auth_tokens');
        const savedUser = localStorage.getItem('auth_user');

        if (savedTokenData && savedUser) {
          const parsedTokenData = JSON.parse(savedTokenData) as TokenData;
          
          // Verificar si el token no está expirado
          if (!isTokenExpired(parsedTokenData.token)) {
            setTokenData(parsedTokenData);
            setUser(JSON.parse(savedUser));
          } else {
            // Si está expirado, intentar refrescar
            setTokenData(parsedTokenData); // Necesario para que refreshToken tenga acceso al refresh_token
            refreshToken().then(success => {
              if (!success) {
                // Si no se puede refrescar, limpiar datos
                localStorage.removeItem('auth_tokens');
                localStorage.removeItem('auth_user');
                setUser(null);
                setTokenData(null);
              } else {
                setUser(JSON.parse(savedUser));
              }
            });
          }
        }
      } catch (error) {
        console.error('Error cargando datos de autenticación:', error);
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, [isTokenExpired, refreshToken]);

  // Login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await fetch(`${getApiUrl()}/usuarios/simple/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ username, password }),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Error de autenticación: ${res.status}`);
        }
        return res.json();
      });

      // Calcular expiración (1 hora desde ahora)
      const expiry = Date.now() + 3600 * 1000;
      
      const newTokenData: TokenData = {
        token: data.access_token,
        refresh_token: data.refresh_token,
        expiry
      };
      
      setUser(data.user);
      setTokenData(newTokenData);
      
      // Guardar en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(newTokenData));
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      toast.success(`¡Bienvenido, ${data.user.first_name || data.user.username}!`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al iniciar sesión: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await fetch(`${getApiUrl()}/usuarios/simple/registro/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(userData),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Error de registro: ${res.status}`);
        }
        return res.json();
      });

      // Calcular expiración (1 hora desde ahora)
      const expiry = Date.now() + 3600 * 1000;
      
      const newTokenData: TokenData = {
        token: data.access_token,
        refresh_token: data.refresh_token,
        expiry
      };
      
      setUser(data.user);
      setTokenData(newTokenData);
      
      // Guardar en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(newTokenData));
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      toast.success(`¡Cuenta creada exitosamente! Bienvenido, ${data.user.first_name || data.user.username}!`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al registrarse: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      if (tokenData) {
        await fetch(`${getApiUrl()}/usuarios/simple/logout/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCsrfToken(),
            'Authorization': `Bearer ${tokenData.token}`,
          },
        });
      }
    } catch (err) {
      console.error('Error al hacer logout:', err);
    } finally {
      setUser(null);
      setTokenData(null);
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      toast.success('Sesión cerrada exitosamente');
    }
  }, [tokenData, getApiUrl, getCsrfToken]);

  // Update Profile
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await apiCall('/usuarios/simple/perfil/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      toast.success('Perfil actualizado exitosamente');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al actualizar perfil: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Configurar intervalo para refrescar token automáticamente
  useEffect(() => {
    if (!tokenData) return;

    // Refrescar cuando quede el 25% del tiempo de validez
    const timeToRefresh = Math.max(
      (tokenData.expiry - Date.now()) * 0.75, 
      0
    );
    
    const refreshInterval = setInterval(() => {
      refreshToken();
    }, timeToRefresh);

    return () => clearInterval(refreshInterval);
  }, [tokenData, refreshToken]);

  const value: AuthContextType = {
    user,
    tokenData,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user && !!tokenData?.token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
