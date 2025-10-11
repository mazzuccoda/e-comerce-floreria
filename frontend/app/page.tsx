import ProductListFinal from './components/ProductListFinal';

export default function Home() {
  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">FLORERIA PALERMO</h1>
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
