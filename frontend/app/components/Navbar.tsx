'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartRobust } from '../../context/CartContextRobust';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

interface TipoFlor {
  id: number;
  nombre: string;
}

interface Ocasion {
  id: number;
  nombre: string;
}

export default function Navbar() {
  const router = useRouter();
  const { cart } = useCartRobust();
  const { isAuthenticated, user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  const [showOcasiones, setShowOcasiones] = useState(false);
  const [showTiposFlor, setShowTiposFlor] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Cargar tipos de flor y ocasiones desde la API
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';
    
    console.log('🌸 Navbar: Cargando tipos de flor y ocasiones desde:', apiUrl);
    
    // Cargar tipos de flor
    fetch(`${apiUrl}/catalogo/tipos-flor/`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Tipos de flor cargados:', data.length);
        setTiposFlor(data);
      })
      .catch(err => console.error('❌ Error cargando tipos de flor:', err));
    
    // Cargar ocasiones
    fetch(`${apiUrl}/catalogo/ocasiones/`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Ocasiones cargadas:', data.length);
        setOcasiones(data);
      })
      .catch(err => console.error('❌ Error cargando ocasiones:', err));
  }, []);
  
  // Solo renderizar el contador del carrito en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menús cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // No cerrar si el click es dentro de cualquier menú o botón
      if (target.closest('[data-mobile-menu]') || 
          target.closest('[data-mobile-button]') ||
          target.closest('[data-desktop-menu]') ||
          target.closest('[data-desktop-button]')) {
        return;
      }
      
      setShowTiposFlor(false);
      setShowOcasiones(false);
      setShowUserMenu(false);
      setShowMobileMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  return (
    <nav className="bg-[#f5f0eb] border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Botón hamburguesa móvil */}
          <button
            data-mobile-button
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileMenu(!showMobileMenu);
            }}
            className="md:hidden text-gray-700 hover:text-gray-900 transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
            aria-label="Menú"
          >
            {showMobileMenu ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dmxc6odsi/image/upload/v1760465112/Logo_Crsitina_t6ofnz.png" 
              alt="Florería Cristina" 
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Menú central */}
          <ul className="hidden md:flex items-center space-x-8">
            <li className="relative">
              <button 
                data-desktop-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTiposFlor(!showTiposFlor);
                }}
                className="text-gray-700 hover:text-gray-900 font-light text-base transition-colors flex items-center gap-1"
              >
                Tipo de flor
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div data-desktop-menu className={`absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 transition-all duration-200 ${showTiposFlor ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                {tiposFlor.length > 0 ? (
                  tiposFlor.map(tipo => (
                    <a 
                      key={tipo.id} 
                      onClick={() => window.location.href = `/productos?tipo_flor=${tipo.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {tipo.nombre}
                    </a>
                  ))
                ) : (
                  <span className="block px-4 py-2 text-sm text-gray-400">Cargando...</span>
                )}
              </div>
            </li>
            
            <li className="relative">
              <button 
                data-desktop-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOcasiones(!showOcasiones);
                }}
                className="text-gray-700 hover:text-gray-900 font-light text-base transition-colors flex items-center gap-1"
              >
                Ocasiones
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div data-desktop-menu className={`absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 transition-all duration-200 ${showOcasiones ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                {ocasiones.length > 0 ? (
                  ocasiones.map(ocasion => (
                    <a 
                      key={ocasion.id} 
                      onClick={() => window.location.href = `/productos?ocasion=${ocasion.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {ocasion.nombre}
                    </a>
                  ))
                ) : (
                  <span className="block px-4 py-2 text-sm text-gray-400">Cargando...</span>
                )}
              </div>
            </li>
            
            <li>
              <Link href="/ayuda" className="text-gray-700 hover:text-gray-900 font-light text-base transition-colors">
                Ayuda
              </Link>
            </li>
            
            <li>
              <Link href="/contacto" className="text-gray-700 hover:text-gray-900 font-light text-base transition-colors">
                Contacto
              </Link>
            </li>
          </ul>

          {/* Iconos derecha */}
          <div className="flex items-center gap-4">
            {/* Búsqueda */}
            <button className="text-gray-700 hover:text-gray-900 transition-colors" aria-label="Buscar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Usuario */}
            {mounted && isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden lg:inline text-sm">{user.first_name || user.username}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mis Pedidos
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition-colors" aria-label="Iniciar sesión">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Carrito */}
            <Link href="/carrito" className="relative text-gray-700 hover:text-gray-900 transition-colors" suppressHydrationWarning>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {mounted && cart?.items?.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full" suppressHydrationWarning>
                  {cart.items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {showMobileMenu && (
        <div 
          data-mobile-menu
          className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 space-y-1">
            {/* Tipo de flor */}
            <div className="border-b border-gray-100 pb-2">
              <p className="text-gray-500 text-sm font-medium mb-2">Tipo de flor</p>
              {tiposFlor.length > 0 ? (
                tiposFlor.map(tipo => (
                  <a 
                    key={tipo.id} 
                    onClick={() => {
                      window.location.href = `/productos?tipo_flor=${tipo.id}`;
                      setShowMobileMenu(false);
                    }}
                    className="block px-2 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer rounded"
                  >
                    {tipo.nombre}
                  </a>
                ))
              ) : (
                <span className="block px-2 py-2 text-gray-400 text-sm">Cargando...</span>
              )}
            </div>

            {/* Ocasiones */}
            <div className="border-b border-gray-100 pb-2">
              <p className="text-gray-500 text-sm font-medium mb-2">Ocasiones</p>
              {ocasiones.length > 0 ? (
                ocasiones.map(ocasion => (
                  <a 
                    key={ocasion.id} 
                    onClick={() => {
                      window.location.href = `/productos?ocasion=${ocasion.id}`;
                      setShowMobileMenu(false);
                    }}
                    className="block px-2 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer rounded"
                  >
                    {ocasion.nombre}
                  </a>
                ))
              ) : (
                <span className="block px-2 py-2 text-gray-400 text-sm">Cargando...</span>
              )}
            </div>

            {/* Enlaces adicionales */}
            <div className="pt-2">
              <Link 
                href="/ayuda" 
                className="block px-2 py-3 text-gray-700 hover:bg-gray-50 rounded font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Ayuda
              </Link>
              <Link 
                href="/contacto" 
                className="block px-2 py-3 text-gray-700 hover:bg-gray-50 rounded font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
