'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ProductImage {
  id: number;
  imagen: string;
  alt_text?: string;
  orden?: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  mainImage: string;
}

export default function ProductImageGallery({ images, productName, mainImage }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Combinar imagen principal con imágenes adicionales
  const allImages = [
    { id: 0, imagen: mainImage, alt_text: productName },
    ...images
  ];

  const getImageUrl = (url: string) => {
    const fallbackImage = '/images/no-image.jpg';
    
    if (!url || url === 'null' || url === 'undefined') {
      return fallbackImage;
    }
    
    if (url.startsWith('/media/')) {
      return `https://e-comerce-floreria-production.up.railway.app${url}`;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    return fallbackImage;
  };

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    setModalImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setModalImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Manejar teclas del teclado en el modal
  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <>
      {/* Galería principal */}
      <div className="relative">
        <div className="sticky top-8">
          {/* Imagen principal */}
          <div 
            className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl cursor-pointer group"
            onClick={() => openModal(selectedImageIndex)}
          >
            <img
              src={getImageUrl(allImages[selectedImageIndex].imagen)}
              alt={allImages[selectedImageIndex].alt_text || productName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/no-image.jpg';
              }}
            />
            
            {/* Overlay con icono de zoom */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-lg">
                <ZoomIn className="w-8 h-8 text-gray-700" />
              </div>
            </div>

            {/* Indicador de cantidad de imágenes */}
            {allImages.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {allImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {allImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden transition-all duration-200
                    ${selectedImageIndex === index 
                      ? 'ring-4 ring-green-600 shadow-lg scale-105' 
                      : 'ring-2 ring-gray-200 hover:ring-green-400 hover:shadow-md'
                    }
                  `}
                >
                  <img
                    src={getImageUrl(image.imagen)}
                    alt={`${productName} - imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/no-image.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Instrucción */}
          <p className="text-center text-sm text-gray-500 mt-4">
            <ZoomIn className="w-4 h-4 inline mr-1" />
            Haz clic en la imagen para verla en tamaño completo
          </p>
        </div>
      </div>

      {/* Modal Lightbox */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Botón cerrar */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Contador de imágenes */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            {modalImageIndex + 1} / {allImages.length}
          </div>

          {/* Contenedor de imagen */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen */}
            <img
              src={getImageUrl(allImages[modalImageIndex].imagen)}
              alt={allImages[modalImageIndex].alt_text || productName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/no-image.jpg';
              }}
            />

            {/* Botones de navegación */}
            {allImages.length > 1 && (
              <>
                {/* Botón anterior */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                {/* Botón siguiente */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas en el modal (opcional) */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
              {allImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex(index);
                  }}
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200
                    ${modalImageIndex === index 
                      ? 'ring-4 ring-white scale-110' 
                      : 'ring-2 ring-white/30 hover:ring-white/60'
                    }
                  `}
                >
                  <img
                    src={getImageUrl(image.imagen)}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/no-image.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Instrucciones de teclado */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs hidden md:block">
            Usa las flechas ← → para navegar • ESC para cerrar
          </div>
        </div>
      )}
    </>
  );
}
