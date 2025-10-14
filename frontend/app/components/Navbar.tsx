'use client';

import Link from 'next/link';
import { useCartRobust } from '../../context/CartContextRobust';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { cart } = useCartRobust();
  const { user, logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Solo renderizar el contador del carrito en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <span className="flower-icon">🌸</span>
          FLORERIA CRISTINA
        </Link>
        
        <ul className="navbar-nav">
          <li className="navbar-item dropdown">
            <span className="navbar-link">Tipo de flor</span>
            <div className="dropdown-content">
              <Link href="/productos?tipo_flor=rosas" className="dropdown-item">Rosas</Link>
              <Link href="/productos?tipo_flor=gerberas" className="dropdown-item">Gerberas</Link>
              <Link href="/productos?tipo_flor=astromelias" className="dropdown-item">Astromelias</Link>
              <Link href="/productos?tipo_flor=lilium" className="dropdown-item">Lilium</Link>
              <Link href="/productos?tipo_flor=girasoles" className="dropdown-item">Girasoles</Link>
            </div>
          </li>
          
          <li className="navbar-item dropdown">
            <span className="navbar-link">Ocasiones</span>
            <div className="dropdown-content">
              <Link href="/productos?ocasion=cumpleanos" className="dropdown-item">Cumpleaños</Link>
              <Link href="/productos?ocasion=aniversario" className="dropdown-item">Aniversario</Link>
              <Link href="/productos?ocasion=enamorados" className="dropdown-item">Enamorados</Link>
              <Link href="/productos?ocasion=agradecimiento" className="dropdown-item">Agradecimiento</Link>
              <Link href="/productos?ocasion=maternidad" className="dropdown-item">Maternidad</Link>
            </div>
          </li>
          
          <li className="navbar-item">
            <Link href="/zonas" className="navbar-link">Zonas</Link>
          </li>
          
          <li className="navbar-item">
            <Link href="/ayuda" className="navbar-link">Ayuda</Link>
          </li>
          
          <li className="navbar-item">
            <Link href="/contacto" className="navbar-link">Contacto</Link>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          {mounted && isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-gray-700 hover:text-pink-600 font-medium transition-colors flex items-center gap-2"
              >
                👤 {user.first_name || user.username}
                <span className="text-xs">▼</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
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
            <Link href="/login" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">
              👤 Iniciar sesión
            </Link>
          )}
          <Link href="/carrito" className="cart-button" suppressHydrationWarning>
            🛒 Carrito <span className="cart-count" suppressHydrationWarning>{mounted ? (cart?.items?.length || 0) : 0}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
