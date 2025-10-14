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
          <h1 className="hero-title">FLORERIA PALERMO</h1>
          
          <div className="mt-4 mb-6">
            <Link 
              href="/modo-offline" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg flex items-center mx-auto w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Usar Modo sin Conexión
            </Link>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🚚</span>
              <h3 className="feature-title">Envíos gratis</h3>
              <p className="feature-description">en Capital Federal, Buenos Aires</p>
            </div>
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
              <p className="feature-description">sin cargo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">RECOMENDADOS</h2>
        <p className="section-subtitle">Las flores más vendidas en Buenos Aires</p>
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
