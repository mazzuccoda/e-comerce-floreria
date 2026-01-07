'use client';

import ProductListFinal from './components/ProductListFinal';
import HeroCarousel from './components/HeroCarousel';
import AdicionalesSection from './components/AdicionalesSection';
import CategoriesSection from './components/CategoriesSection';
import OfertasDelDia from './components/OfertasDelDia';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, UserRound, MessageSquareHeart, Gift, CalendarClock, CreditCard, PackageCheck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

// Cargar el banner de estado sin SSR para evitar errores de hidratación
const ConnectionStatusBanner = dynamic(
  () => import('./components/ConnectionStatusBanner'),
  { ssr: false }
);

function StepByStep() {
  const { t } = useI18n();
  const steps = [
    { icon: ShoppingBag, titleKey: 'home.steps.step1Title', descKey: 'home.steps.step1Desc' },
    { icon: UserRound, titleKey: 'home.steps.step2Title', descKey: 'home.steps.step2Desc' },
    { icon: MessageSquareHeart, titleKey: 'home.steps.step3Title', descKey: 'home.steps.step3Desc' },
    { icon: Gift, titleKey: 'home.steps.step4Title', descKey: 'home.steps.step4Desc' },
    { icon: CalendarClock, titleKey: 'home.steps.step5Title', descKey: 'home.steps.step5Desc' },
    { icon: CreditCard, titleKey: 'home.steps.step6Title', descKey: 'home.steps.step6Desc' },
    { icon: PackageCheck, titleKey: 'home.steps.step7Title', descKey: 'home.steps.step7Desc' },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">{t('home.howToBuyTitle')}</h2>
          <p className="text-gray-600 mt-2">{t('home.howToBuySubtitle')}</p>
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
                    <h3 className="mt-3 text-sm font-medium text-gray-900">{idx + 1}. {t(s.titleKey)}</h3>
                    <p className="mt-1 text-xs text-gray-600">{t(s.descKey)}</p>
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
                  <h3 className="mt-3 text-sm font-medium text-gray-900">{idx + 1}. {t(s.titleKey)}</h3>
                  <p className="mt-1 text-xs text-gray-600">{t(s.descKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="mt-10 flex justify-center">
          <Link href="#catalogo" className="inline-flex items-center px-6 py-3 rounded-md bg-pink-600 text-white font-medium hover:bg-pink-700 transition-colors">{t('home.startShopping')}</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  
  return (
    <div>
      <ConnectionStatusBanner />
      
      {/* Carrusel Hero */}
      <HeroCarousel />

      {/* Sección de categorías */}
      <CategoriesSection />

      {/* Sección de ofertas del día */}
      <OfertasDelDia />

      <section id="catalogo" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header con badge verde similar a Ofertas */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2 rounded-full shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="font-bold text-lg">{t('home.featured')}</span>
            </div>
          </div>
          <ProductListFinal showFeatured={true} />
        </div>
      </section>

      {/* Sección de adicionales con diseño especial */}
      <AdicionalesSection />

      {/* Cómo comprar */}
      <StepByStep />
    </div>
  );
}
