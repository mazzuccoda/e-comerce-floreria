'use client';

import ProductListFinal from './components/ProductListFinal';
import HeroCarousel from './components/HeroCarousel';
import AdicionalesSection from './components/AdicionalesSection';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ShoppingBag, UserRound, MessageSquareHeart, Gift, CalendarClock, CreditCard, PackageCheck, ChevronDown } from 'lucide-react';

// Cargar el banner de estado sin SSR para evitar errores de hidratación
const ConnectionStatusBanner = dynamic(
  () => import('./components/ConnectionStatusBanner'),
  { ssr: false }
);

function StepByStep() {
  const [activeSection, setActiveSection] = useState(0);
  
  const stepGroups = [
    {
      title: 'Selección y personalización',
      steps: [
        { icon: ShoppingBag, title: 'Elegí el ramo', desc: 'Explorá los más vendidos o por ocasión' },
        { icon: MessageSquareHeart, title: 'Agregá dedicatoria', desc: 'Hacelo especial con un mensaje' },
        { icon: Gift, title: 'Sumá un adicional', desc: 'Chocolates, peluches y más' },
      ]
    },
    {
      title: 'Datos y envío',
      steps: [
        { icon: UserRound, title: 'Completá datos del envío', desc: 'Tu nombre y el del destinatario' },
        { icon: CalendarClock, title: 'Elegí fecha y horario', desc: 'Coordinamos la franja de entrega' },
      ]
    },
    {
      title: 'Pago y confirmación',
      steps: [
        { icon: CreditCard, title: 'Pagá de forma segura', desc: 'Múltiples medios y confirmación inmediata' },
        { icon: PackageCheck, title: 'Entrega confirmada', desc: 'Te confirmamos cuando esté entregado' },
      ]
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Cómo comprar en 3 minutos</h2>
          <p className="text-gray-600 mt-2">Un proceso simple, seguro y rápido</p>
        </div>
        
        {/* Desktop: Grilla completa */}
        <div className="hidden lg:block">
          <ol role="list" className="grid grid-cols-7 gap-6 items-start">
            {stepGroups.flatMap(group => group.steps).map((s, idx) => (
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

        {/* Mobile: Accordion */}
        <div className="lg:hidden space-y-4">
          {stepGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveSection(activeSection === groupIdx ? -1 : groupIdx)}
                className="w-full px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{group.title}</h3>
                  <p className="text-sm text-gray-600">{group.steps.length} pasos</p>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    activeSection === groupIdx ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {activeSection === groupIdx && (
                <div className="px-4 py-4 bg-white">
                  <ol className="space-y-4">
                    {group.steps.map((step, stepIdx) => {
                      const globalIdx = stepGroups.slice(0, groupIdx).reduce((acc, g) => acc + g.steps.length, 0) + stepIdx;
                      return (
                        <li key={stepIdx} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center ring-1 ring-pink-100">
                            <step.icon className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {globalIdx + 1}. {step.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="#catalogo" className="inline-flex items-center px-6 py-3 rounded-md bg-pink-600 text-white font-medium hover:bg-pink-700 transition-colors">
            Empezar compra
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="w-full">
      <ConnectionStatusBanner />
      
      {/* Carrusel Hero */}
      <HeroCarousel />

      <StepByStep />

      <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">RECOMENDADOS</h2>
            <p className="text-lg text-gray-600">Las flores más vendidas en Tucumán</p>
          </div>
          <ProductListFinal showRecommended={true} />
        </div>
      </section>

      {/* Sección de adicionales con diseño especial */}
      <AdicionalesSection />
    </div>
  );
}
