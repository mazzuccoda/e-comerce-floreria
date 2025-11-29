'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  nombre: string;
  slug: string;
  imagen: string;
  is_active: boolean;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/catalogo/categorias/`, {
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
  }, []);

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
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Grid de categorías - más compacto */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?categoria=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Imagen de categoría */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={category.imagen}
                  alt={category.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-300"></div>
                
                {/* Nombre de la categoría */}
                <div className="absolute inset-0 flex items-end justify-center pb-4 md:pb-6">
                  <h3 className="text-white text-base md:text-lg lg:text-xl font-bold text-center px-3 drop-shadow-2xl tracking-wide">
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
