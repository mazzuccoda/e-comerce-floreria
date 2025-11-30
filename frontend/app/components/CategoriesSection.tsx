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
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Layout con Ramos de flores destacado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          
          {/* RAMOS DE FLORES - Ocupa toda la columna izquierda */}
          {ramosDeFlores && (
            <Link
              href={`/productos?categoria=${ramosDeFlores.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 md:row-span-2"
            >
              <div className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden">
                <img
                  src={ramosDeFlores.imagen}
                  alt={ramosDeFlores.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay con gradiente más fuerte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-300"></div>
                
                {/* Badge destacado */}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
                  ⭐ DESTACADO
                </div>
                
                {/* Nombre de la categoría principal */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 md:pb-8">
                  <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold text-center px-4 drop-shadow-2xl tracking-wide mb-2">
                    {ramosDeFlores.nombre}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base text-center px-4 drop-shadow-lg">
                    Nuestra especialidad 🌹
                  </p>
                  {/* Botón CTA */}
                  <div className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-full font-semibold text-sm md:text-base hover:bg-green-500 hover:text-white transition-all duration-300 shadow-lg">
                    Ver Ramos →
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* OTRAS CATEGORÍAS - Grid en la columna derecha */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 md:col-span-1">
            {otherCategories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?categoria=${category.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                  <div className="absolute inset-0 flex items-end justify-center pb-3 md:pb-4">
                    <h3 className="text-white text-sm md:text-base lg:text-lg font-bold text-center px-2 drop-shadow-2xl tracking-wide">
                      {category.nombre}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
