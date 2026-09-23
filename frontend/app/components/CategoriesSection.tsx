'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { localeHref } from '@/utils/localeHref';
import { cloudinaryThumb } from '@/utils/cloudinary';

interface Category {
  id: number;
  nombre: string;
  slug: string;
  imagen: string;
  is_active: boolean;
}

const PRODUCTOS_BASE = 'https://res.cloudinary.com/dmxc6odsi/image/upload/v1/media/productos';

// Categorías cuya foto de portada no representa el producto: se usa la mejor
// foto de producto de la propia categoría.
const COVER_OVERRIDES: Record<string, string> = {
  plantas: `${PRODUCTOS_BASE}/2026/01/18/WhatsApp_Image_2026-01-05_at_11.27.48_2_qce4kb`,
  iglesias: `${PRODUCTOS_BASE}/2025/10/27/IMG-20220414-WA0017_rh3e9v`,
  empresariales: `${PRODUCTOS_BASE}/2025/10/27/WhatsApp_Image_2025-10-26_at_09.40.42_j3ijdk`,
  adicionales: `${PRODUCTOS_BASE}/2026/01/31/WhatsApp_Image_2026-01-31_at_13.45.49_mfjmjv`,
};

// Las flores primero, los complementos al final.
const CATEGORY_ORDER = [
  'ramos-de-flores',
  'ramos-blancos',
  'centros-de-mesa',
  'floreros-preparados',
  'oferta-del-dia',
  'plantas',
  'condolencias',
  'iglesias',
  'empresariales',
  'adicionales',
];

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    return (indexA === -1 ? CATEGORY_ORDER.length : indexA) - (indexB === -1 ? CATEGORY_ORDER.length : indexB);
  });
}

export default function CategoriesSection() {
  const { locale, t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';
        const timestamp = Date.now();
        const response = await fetch(`${backendUrl}/api/catalogo/categorias/?lang=${locale}&_t=${timestamp}`, {
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }

        const data = await response.json();
        // Filtrar solo categorías activas con imagen
        const activeCategoriesWithImage = data.filter((cat: Category) => cat.is_active && cat.imagen);
        setCategories(sortCategories(activeCategoriesWithImage));
      } catch (error) {
        console.error('Error cargando categorías:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-center text-xl font-semibold text-gray-900 md:text-2xl">
          {t('home.shopByCategory')}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={localeHref(`/productos?categoria=${category.slug}`, locale)}
              className="group relative transform overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={cloudinaryThumb(COVER_OVERRIDES[category.slug] ?? category.imagen, { aspectRatio: '1:1', width: 600 })}
                  alt={category.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-300"></div>
                
                {/* Nombre de la categoría */}
                <div className="absolute inset-0 flex items-end justify-center pb-2 md:pb-3">
                  <h3 className="text-white text-xs md:text-sm lg:text-base font-bold text-center px-2 drop-shadow-2xl tracking-wide">
                    {category.nombre}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
