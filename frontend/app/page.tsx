import ProductListFinal from './components/ProductListFinal';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Cargar el banner de estado sin SSR para evitar errores de hidratación
const ConnectionStatusBanner = dynamic(
  () => import('./components/ConnectionStatusBanner'),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      <ConnectionStatusBanner />
      <section className="hero-section">
        <div className="hero-content">
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">💻</span>
              <h3 className="feature-title">Comprá online</h3>
              <p className="feature-description">desde cualquier parte</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💳</span>
              <h3 className="feature-title">Pagá con múltiples</h3>
              <p className="feature-description">medios de pago</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🏠</span>
              <h3 className="feature-title">Envíos a domicilio</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">RECOMENDADOS</h2>
        <p className="section-subtitle">Las flores más vendidas en Tucumán</p>
        <ProductListFinal showRecommended={true} />
      </section>

      <section className="section">
        <h2 className="section-title">AGREGÁ ADICIONALES A TU RAMO</h2>
        <p className="section-subtitle">Sumalos dentro de tu compra para completar tu regalo</p>
        <ProductListFinal showAdditionals={true} />
      </section>
    </div>
  );
}
