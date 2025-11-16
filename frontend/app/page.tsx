import ProductListFinal from './components/ProductListFinal';
import HeroCarousel from './components/HeroCarousel';
import AdicionalesSection from './components/AdicionalesSection';
import CategoriesSection from './components/CategoriesSection';
import OfertasDelDia from './components/OfertasDelDia';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, UserRound, MessageSquareHeart, Gift, CalendarClock, CreditCard, PackageCheck } from 'lucide-react';

// Cargar el banner de estado sin SSR para evitar errores de hidratación
const ConnectionStatusBanner = dynamic(
  () => import('./components/ConnectionStatusBanner'),
  { ssr: false }
);

function StepByStep() {
  const steps = [
    { icon: ShoppingBag, title: 'Elegí el ramo', desc: 'Explorá los más vendidos o por ocasión' },
    { icon: UserRound, title: 'Completá datos del envío', desc: 'Tu nombre y el del destinatario' },
    { icon: MessageSquareHeart, title: 'Agregá dedicatoria', desc: 'Hacelo especial con un mensaje' },
    { icon: Gift, title: 'Sumá un adicional', desc: 'Chocolates, peluches y más' },
    { icon: CalendarClock, title: 'Elegí fecha y horario', desc: 'Coordinamos la franja de entrega' },
    { icon: CreditCard, title: 'Pagá de forma segura', desc: 'Múltiples medios y confirmación inmediata' },
    { icon: PackageCheck, title: 'Entrega confirmada', desc: 'Te confirmamos cuando esté entregado' },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Cómo comprar en 3 minutos</h2>
          <p className="text-gray-600 mt-2">Un proceso simple, seguro y rápido</p>
        </div>
        
        {/* Carrusel horizontal en móvil, grid en desktop */}
        <div className="relative">
          {/* Vista móvil: Carrusel horizontal con scroll */}
          <div className="lg:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <ol role="list" className="flex gap-4 pb-4">
              {steps.map((s, idx) => (
                <li key={idx} role="listitem" className="flex-shrink-0 w-64 snap-center">
                  <div className="flex flex-col items-center text-center h-full bg-gray-50 rounded-lg p-6 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center ring-1 ring-pink-100">
                      <s.icon className="w-7 h-7 text-pink-600" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-gray-900">{idx + 1}. {s.title}</h3>
                    <p className="mt-1 text-xs text-gray-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          
          {/* Vista desktop: Grid */}
          <ol role="list" className="hidden lg:grid relative grid-cols-4 xl:grid-cols-7 gap-6 items-start">
            {steps.map((s, idx) => (
              <li key={idx} role="listitem" className="group">
                <div className="flex flex-col items-center text-center h-full">
                  <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center ring-1 ring-pink-100">
                    <s.icon className="w-7 h-7 text-pink-600" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">{idx + 1}. {s.title}</h3>
                  <p className="mt-1 text-xs text-gray-600">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="mt-10 flex justify-center">
          <Link href="#catalogo" className="inline-flex items-center px-6 py-3 rounded-md bg-pink-600 text-white font-medium hover:bg-pink-700 transition-colors">Empezar compra</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <ConnectionStatusBanner />
      
      {/* Carrusel Hero */}
      <HeroCarousel />

      {/* Sección de categorías */}
      <CategoriesSection />

      {/* Sección de ofertas del día */}
      <OfertasDelDia />

      <section id="catalogo" className="section">
        <h2 className="section-title">DESTACADOS</h2>
        <p className="section-subtitle">Las flores más vendidas en Tucumán</p>
        <ProductListFinal showFeatured={true} />
      </section>

      {/* Sección de adicionales con diseño especial */}
      <AdicionalesSection />

      {/* Cómo comprar */}
      <StepByStep />
    </div>
  );
}
