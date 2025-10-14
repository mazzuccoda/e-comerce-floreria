'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener URL de API dinámica
  const getApiUrl = () => {
    if (typeof window === 'undefined') {
      // Server-side: usar URL interna de Docker
      return 'http://web:8000/api';
    } else {
      // Client-side: usar variable de entorno o Railway
      return process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
    }
  };

  // Función para hacer peticiones a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}${endpoint}`, {
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await apiCall('/usuarios/simple/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setUser(data.user);
      setToken(data.token);
      
      // Guardar en localStorage
      localStorage.setItem('auth_token', data.token);
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
      const data = await apiCall('/usuarios/simple/registro/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      setUser(data.user);
      setToken(data.token);
      
      // Guardar en localStorage
      localStorage.setItem('auth_token', data.token);
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
  const logout = async () => {
    try {
      if (token) {
        await apiCall('/usuarios/simple/logout/', {
          method: 'POST',
        });
      }
    } catch (err) {
      console.error('Error al hacer logout:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      toast.success('Sesión cerrada exitosamente');
    }
  };

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

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
