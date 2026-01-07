'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';

interface Category {
  id: number;
  nombre: string;
  slug: string;
  imagen: string;
  is_active: boolean;
}

export default function CategoriesSection() {
  const { locale } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/catalogo/categorias/?lang=${locale}`, {
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }

        const data = await response.json();
        // Filtrar solo categorías activas con imagen
        const activeCategoriesWithImage = data.filter((cat: Category) => cat.is_active && cat.imagen);
        setCategories(activeCategoriesWithImage);
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

  // Separar "Ramos de flores" del resto
  const ramosDeFlores = categories.find(cat => 
    cat.nombre.toLowerCase().includes('ramos') || 
    cat.slug.includes('ramos')
  );
  const otherCategories = categories.filter(cat => 
    !cat.nombre.toLowerCase().includes('ramos') && 
    !cat.slug.includes('ramos')
  );

  return (
    <section className="py-4 md:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        {/* Grid compacto sin espacios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-1.5">
          {/* Todas las categorías con mismo tamaño */}
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?categoria=${category.slug}`}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={category.imagen}
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
