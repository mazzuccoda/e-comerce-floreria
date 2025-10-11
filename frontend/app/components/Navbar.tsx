'use client';

import Link from 'next/link';
import { useCartRobust } from '../../context/CartContextRobust';

export default function Navbar() {
  const { cart } = useCartRobust();
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

        <Link href="/carrito" className="cart-button">
          🛒 Carrito <span className="cart-count">{cart?.items?.length || 0}</span>
        </Link>
      </div>
    </nav>
  );
}
