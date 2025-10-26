'use client';

import { useState, useEffect } from 'react';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567953/Carrucel_1.png',
    title: 'FLORERÍA CRISTINA',
    subtitle: 'Ramos de flores Naturales',
    buttonText: 'Ver Productos',
    buttonLink: '/productos'
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen26_aeywu7.png',
    title: 'Entrega a domicilios',
    subtitle: 'Yerba Buena y alrededores',
    buttonText: 'Comprar Ahora',
    buttonLink: '/productos'
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1760567952/Imagen17_ozu8fo.png',
    title: 'Tenemos el ramo que buscas',
    subtitle: 'Diseños únicos para cada ocasión',
    buttonText: 'Explorar',
    buttonLink: '/productos'
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play del carrusel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Reactiva auto-play después de 10s
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900 z-10">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Imagen de fondo */}
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay oscuro para mejorar legibilidad del texto */}
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Contenido del slide */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-4 max-w-4xl mx-auto">
              <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-light mb-4 tracking-wide animate-fade-in-up">
                {slide.title}
              </h2>
              <p className="text-white text-lg md:text-xl lg:text-2xl font-light mb-8 animate-fade-in-up-delay">
                {slide.subtitle}
              </p>
              {slide.buttonText && slide.buttonLink && (
                <a
                  href={slide.buttonLink}
                  className="inline-block bg-white text-gray-900 px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg animate-fade-in-up-delay-2"
                >
                  {slide.buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Botones de navegación */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-900 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        aria-label="Slide anterior"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-900 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        aria-label="Siguiente slide"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicadores de slide */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'bg-white w-10 h-3'
                : 'bg-white/50 hover:bg-white/75 w-3 h-3'
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in-up-delay {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.2s forwards;
        }

        .animate-fade-in-up-delay-2 {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
        }
      `}</style>
    </div>
  );
}
