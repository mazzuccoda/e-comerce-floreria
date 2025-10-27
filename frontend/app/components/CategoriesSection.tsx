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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título de la sección */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🌸</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Explorá por Categoría
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            Encontrá el arreglo perfecto para cada ocasión
          </p>
        </div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?categoria=${category.slug}`}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Imagen de categoría */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={category.imagen}
                  alt={category.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300"></div>
                
                {/* Nombre de la categoría */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-lg md:text-xl font-semibold text-center px-4 drop-shadow-lg">
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
