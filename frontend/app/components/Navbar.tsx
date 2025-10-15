'use client';

import Link from 'next/link';
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
  const { cart } = useCartRobust();
  const { user, logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTiposFlor, setShowTiposFlor] = useState(false);
  const [showOcasiones, setShowOcasiones] = useState(false);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  
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
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <img 
            src="https://res.cloudinary.com/dmxc6odsi/image/upload/v1760465112/Logo_Crsitina_t6ofnz.png" 
            alt="Florería Cristina" 
            className="logo-image"
          />
        </Link>
        
        <ul className="navbar-nav">
          <li className={styles.dropdown}>
            <span className={styles.dropdownButton}>Tipo de flor</span>
            <div className={styles.dropdownContent}>
              {tiposFlor.length > 0 ? (
                tiposFlor.map(tipo => (
                  <Link 
                    key={tipo.id} 
                    href={`/productos?tipo_flor=${tipo.id}`} 
                    className={styles.dropdownLink}
                  >
                    {tipo.nombre}
                  </Link>
                ))
              ) : (
                <span className={styles.dropdownLink}>Cargando...</span>
              )}
            </div>
          </li>
          
          <li className={styles.dropdown}>
            <span className={styles.dropdownButton}>Ocasiones</span>
            <div className={styles.dropdownContent}>
              {ocasiones.length > 0 ? (
                ocasiones.map(ocasion => (
                  <Link 
                    key={ocasion.id} 
                    href={`/productos?ocasion=${ocasion.id}`} 
                    className={styles.dropdownLink}
                  >
                    {ocasion.nombre}
                  </Link>
                ))
              ) : (
                <span className={styles.dropdownLink}>Cargando...</span>
              )}
            </div>
          </li>
          
          <li className="navbar-item">
            <Link href="/ayuda" className="navbar-link">Ayuda</Link>
          </li>
          
          <li className="navbar-item">
            <Link href="/contacto" className="navbar-link">Contacto</Link>
          </li>
        </ul>

        <div className="flex items-center gap-3" style={{position: 'relative', zIndex: 100}}>
          {mounted && isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-gray-700 hover:text-green-700 font-medium transition-colors flex items-center gap-2"
              >
                👤 {user.first_name || user.username}
                <span className="text-xs">▼</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200" style={{zIndex: 9999}}>
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
            <Link href="/login" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
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
