'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '../../context/I18nContext';
import { localeHref } from '@/utils/localeHref';
import { getExpressAvailability } from '@/utils/deliveryPromise';
import { cloudinaryThumb } from '@/utils/cloudinary';

interface Slide {
  id: number;
  tipo_media?: string;
  imagen?: string;
  video?: string;
  video_url?: string;
  titulo: string;
  subtitulo: string;
  texto_boton?: string;
  enlace_boton?: string;
}

// Slides por defecto (fallback si la API falla)
const defaultSlides: Slide[] = [
  {
    id: 1,
    imagen: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567953/Carrucel_1.png',
    titulo: 'FLORERÍA CRISTINA',
    subtitulo: 'Ramos de flores Naturales',
    texto_boton: 'Ver Productos',
    enlace_boton: '/productos'
  },
  {
    id: 2,
    imagen: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen26_aeywu7.png',
    titulo: 'Entrega a domicilios',
    subtitulo: 'Yerba Buena y alrededores',
    texto_boton: 'Comprar Ahora',
    enlace_boton: '/productos'
  },
  {
    id: 3,
    imagen: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen17_ozu8fo.png',
    titulo: 'Tenemos el ramo que buscas',
    subtitulo: 'Diseños únicos para cada ocasión',
    texto_boton: 'Explorar',
    enlace_boton: '/productos'
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

// Cantidad máxima de slides: el hero muestra dos imágenes, sin rotación automática.
const MAX_SLIDES = 2;

// Slides preferidos (las dos mejores fotos del hero cargadas en el admin).
const PREFERRED_SLIDE_IDS = [2, 1];

// Dominio antiguo de Railway que quedó guardado en algunos enlaces del admin.
const LEGACY_HOST_PATTERN = /^https?:\/\/floreriayviverocristian\.up\.railway\.app/i;

function normalizeLink(link?: string): string {
  if (!link) return '/productos';
  return link.replace(LEGACY_HOST_PATTERN, '');
}

/**
 * Deja sólo imágenes (sin video), prioriza los slides elegidos y corta en dos.
 */
function curateSlides(slides: Slide[]): Slide[] {
  const withImage = slides.filter((slide) => slide.tipo_media !== 'video' && slide.imagen);
  const preferred = PREFERRED_SLIDE_IDS
    .map((id) => withImage.find((slide) => slide.id === id))
    .filter((slide): slide is Slide => Boolean(slide));
  const rest = withImage.filter((slide) => !preferred.includes(slide));

  return [...preferred, ...rest]
    .slice(0, MAX_SLIDES)
    .map((slide) => ({ ...slide, enlace_boton: normalizeLink(slide.enlace_boton) }));
}

export default function HeroCarousel() {
  const { locale, t } = useI18n();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deliveryPromise, setDeliveryPromise] = useState<string | null>(null);

  useEffect(() => {
    setDeliveryPromise(getExpressAvailability().message.replace('✅ ', ''));
  }, []);

  // Cargar slides desde la API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos
        const timestamp = Date.now();

        const response = await fetch(`${API_URL}/catalogo/hero-slides/?lang=${locale}&_t=${timestamp}`, {
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const curated = Array.isArray(data) ? curateSlides(data) : [];
          setSlides(curated.length > 0 ? curated : curateSlides(defaultSlides));
        } else {
          setSlides(curateSlides(defaultSlides));
        }
      } catch (error) {
        console.error('Error cargando slides del hero:', error);
        setSlides(curateSlides(defaultSlides));
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [locale]);

  const goToSlide = (index: number) => setCurrentSlide(index);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="relative z-10 flex h-[340px] w-full items-center justify-center overflow-hidden bg-gray-900 md:h-[420px] lg:h-[480px]">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  // Si no hay slides, no mostrar nada
  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative z-10 h-[420px] w-full overflow-hidden bg-gray-900 sm:h-[400px] md:h-[440px] lg:h-[480px]">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={index !== currentSlide}
        >
          <div className="relative h-full w-full">
            {/* En celular el recorte es vertical para que la flor no quede fuera de cuadro */}
            <picture className="block h-full w-full">
              <source
                media="(min-width: 640px)"
                srcSet={cloudinaryThumb(slide.imagen, { aspectRatio: '16:9', width: 1600 })}
              />
              <img
                src={cloudinaryThumb(slide.imagen, { aspectRatio: '4:5', width: 900 })}
                alt={slide.titulo}
                className="h-full w-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </picture>
            {/* Degradado para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/40 sm:to-black/10" />
          </div>

          {/* Contenido del slide */}
          <div className="absolute inset-0 z-20 flex items-end pb-14 sm:items-center sm:pb-0">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
              <div className="max-w-xl text-left">
                {deliveryPromise && (
                  <p className="mb-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 sm:px-4 sm:py-1.5 sm:text-xs md:text-sm">
                    {deliveryPromise}
                  </p>
                )}
                <h2 className="mb-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                  {slide.titulo}
                </h2>
                <p className="mb-4 text-sm text-white/90 sm:mb-6 sm:text-base md:text-lg">
                  <span className="sm:hidden">{t('home.hero.coverageShort')}</span>
                  <span className="hidden sm:inline">{t('home.hero.coverage')}</span>
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Link
                    href={localeHref('/productos?categoria=ramos-de-flores', locale)}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-800 sm:px-6 sm:py-3 sm:text-base"
                  >
                    {t('home.hero.primaryCta')}
                  </Link>
                  <Link
                    href={localeHref('/zonas', locale)}
                    className="inline-flex items-center justify-center rounded-md border border-white/80 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white hover:text-gray-900 sm:px-6 sm:py-3 sm:text-base"
                  >
                    {t('home.hero.secondaryCta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navegación manual (sin rotación automática) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-900 shadow-lg transition-colors hover:bg-white md:left-6 md:h-12 md:w-12"
            aria-label="Slide anterior"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-900 shadow-lg transition-colors hover:bg-white md:right-6 md:h-12 md:w-12"
            aria-label="Siguiente slide"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicadores de slide */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
