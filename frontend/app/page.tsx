import ProductListFinal from './components/ProductListFinal';
import HeroCarousel from './components/HeroCarousel';
import AdicionalesSection from './components/AdicionalesSection';
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
      
      {/* Carrusel Hero */}
      <HeroCarousel />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Comprá online</h3>
              <p className="text-gray-600">desde cualquier parte</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Pagá con múltiples</h3>
              <p className="text-gray-600">medios de pago</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Envíos a domicilio</h3>
              <p className="text-gray-600">en Tucumán</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">RECOMENDADOS</h2>
        <p className="section-subtitle">Las flores más vendidas en Tucumán</p>
        <ProductListFinal showRecommended={true} />
      </section>

      {/* Sección de adicionales con diseño especial */}
      <AdicionalesSection />
    </div>
  );
}
