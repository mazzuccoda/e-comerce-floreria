'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Product } from '@/types/Product';

// Productos mock que funcionan correctamente
const mockProducts: Product[] = [
  {
    id: 1,
    nombre: "Ramo de 12 Rosas Rojas",
    slug: "ramo-12-rosas-rojas",
    descripcion: "Hermoso ramo de 12 rosas rojas frescas, perfectas para expresar amor y pasión. Incluye papel decorativo elegante.",
    descripcion_corta: "Ramo de 12 rosas rojas",
    categoria: { nombre: "Ramos", slug: "ramos", descripcion: "Ramos florales", imagen: null },
    precio: "45.99",
    precio_descuento: null,
    precio_final: "45.99",
    porcentaje_descuento: null,
    stock: 15,
    is_featured: true,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 1, nombre: "Rosas", descripcion: "Flores tipo rosas", is_active: true },
    ocasiones: [
      { id: 1, nombre: "Amor", descripcion: "", is_active: true },
      { id: 4, nombre: "Aniversario", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 2,
    nombre: "Arreglo Floral Mixto Premium",
    slug: "arreglo-floral-mixto-premium",
    descripcion: "Elegante arreglo con flores variadas de temporada en base de cerámica. Incluye rosas, lilium, gerberas y follaje decorativo.",
    descripcion_corta: "Arreglo floral mixto premium",
    categoria: { nombre: "Arreglos", slug: "arreglos", descripcion: "Arreglos florales", imagen: null },
    precio: "75.00",
    precio_descuento: "65.00",
    precio_final: "65.00",
    porcentaje_descuento: 13,
    stock: 8,
    is_featured: true,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 2, nombre: "Mixto", descripcion: "Flores mixtas", is_active: true },
    ocasiones: [
      { id: 2, nombre: "Cumpleaños", descripcion: "", is_active: true },
      { id: 5, nombre: "Agradecimiento", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 3,
    nombre: "Bouquet de Girasoles Alegres",
    slug: "bouquet-girasoles-alegres",
    descripcion: "Radiante bouquet de girasoles que transmite alegría y energía positiva. Ideal para regalar a personas especiales.",
    descripcion_corta: "Bouquet de girasoles alegres",
    categoria: { nombre: "Bouquets", slug: "bouquets", descripcion: "Bouquets especiales", imagen: null },
    precio: "42.50",
    precio_descuento: null,
    precio_final: "42.50",
    porcentaje_descuento: null,
    stock: 12,
    is_featured: false,
    is_active: true,
    envio_gratis: false,
    tipo_flor: { id: 3, nombre: "Girasoles", descripcion: "Flores girasoles", is_active: true },
    ocasiones: [
      { id: 3, nombre: "Amistad", descripcion: "", is_active: true },
      { id: 2, nombre: "Cumpleaños", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 4,
    nombre: "Ramo de Tulipanes Primavera",
    slug: "ramo-tulipanes-primavera",
    descripcion: "Delicado ramo de tulipanes en colores pastel que anuncia la llegada de la primavera con su frescura única.",
    descripcion_corta: "Ramo de tulipanes primavera",
    categoria: { nombre: "Ramos", slug: "ramos", descripcion: "Ramos florales", imagen: null },
    precio: "38.75",
    precio_descuento: null,
    precio_final: "38.75",
    porcentaje_descuento: null,
    stock: 10,
    is_featured: false,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 4, nombre: "Tulipanes", descripcion: "Flores tulipanes", is_active: true },
    ocasiones: [
      { id: 6, nombre: "Primavera", descripcion: "", is_active: true },
      { id: 2, nombre: "Cumpleaños", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 5,
    nombre: "Centro de Mesa Elegante",
    slug: "centro-mesa-elegante",
    descripcion: "Sofisticado centro de mesa con flores blancas y verdes, perfecto para eventos especiales y celebraciones.",
    descripcion_corta: "Centro de mesa elegante",
    categoria: { nombre: "Centros de Mesa", slug: "centros-mesa", descripcion: "Centros de mesa", imagen: null },
    precio: "89.99",
    precio_descuento: "79.99",
    precio_final: "79.99",
    porcentaje_descuento: 11,
    stock: 5,
    is_featured: true,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 2, nombre: "Mixto", descripcion: "Flores mixtas", is_active: true },
    ocasiones: [
      { id: 7, nombre: "Eventos", descripcion: "", is_active: true },
      { id: 8, nombre: "Bodas", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 6,
    nombre: "Orquídea Phalaenopsis Blanca",
    slug: "orquidea-phalaenopsis-blanca",
    descripcion: "Exquisita orquídea blanca en maceta de cerámica. Símbolo de elegancia y sofisticación para decorar cualquier espacio.",
    descripcion_corta: "Orquídea phalaenopsis blanca",
    categoria: { nombre: "Plantas", slug: "plantas", descripcion: "Plantas ornamentales", imagen: null },
    precio: "125.00",
    precio_descuento: null,
    precio_final: "125.00",
    porcentaje_descuento: null,
    stock: 3,
    is_featured: true,
    is_active: true,
    envio_gratis: true,
    tipo_flor: { id: 5, nombre: "Orquídeas", descripcion: "Flores orquídeas", is_active: true },
    ocasiones: [
      { id: 9, nombre: "Lujo", descripcion: "", is_active: true },
      { id: 10, nombre: "Decoración", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 7,
    nombre: "Bouquet de Gerberas Multicolor",
    slug: "bouquet-gerberas-multicolor",
    descripcion: "Vibrante bouquet de gerberas en múltiples colores que irradia alegría y vitalidad. Perfecto para levantar el ánimo.",
    descripcion_corta: "Bouquet de gerberas multicolor",
    categoria: { nombre: "Bouquets", slug: "bouquets", descripcion: "Bouquets especiales", imagen: null },
    precio: "52.25",
    precio_descuento: null,
    precio_final: "52.25",
    porcentaje_descuento: null,
    stock: 18,
    is_featured: false,
    is_active: true,
    envio_gratis: false,
    tipo_flor: { id: 6, nombre: "Gerberas", descripcion: "Flores gerberas", is_active: true },
    ocasiones: [
      { id: 3, nombre: "Amistad", descripcion: "", is_active: true },
      { id: 11, nombre: "Alegría", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  },
  {
    id: 8,
    nombre: "Arreglo de Gerberas Rosadas",
    slug: "arreglo-gerberas-rosadas",
    descripcion: "Tierno arreglo de gerberas rosadas en base elegante, ideal para expresar cariño y ternura hacia personas queridas.",
    descripcion_corta: "Arreglo de gerberas rosadas",
    categoria: { nombre: "Arreglos", slug: "arreglos", descripcion: "Arreglos florales", imagen: null },
    precio: "48.50",
    precio_descuento: null,
    precio_final: "48.50",
    porcentaje_descuento: null,
    stock: 12,
    is_featured: false,
    is_active: true,
    envio_gratis: false,
    tipo_flor: { id: 6, nombre: "Gerberas", descripcion: "Flores gerberas", is_active: true },
    ocasiones: [
      { id: 1, nombre: "Amor", descripcion: "", is_active: true },
      { id: 12, nombre: "Ternura", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/no-image.jpg",
    imagenes: []
  }
];

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
  showFilters?: boolean;
}

export default function ProductListClient({ showRecommended = false, showAdditionals = false, showFilters: showFiltersProp }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showFilters = showFiltersProp !== undefined ? showFiltersProp : (!showRecommended && !showAdditionals);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  
  // Hook para detectar cambios en URL
  const searchParams = useSearchParams();

  // Cargar productos desde la API - Se recarga cuando cambian los filtros
  useEffect(() => {
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar backend de Railway en producción
        const timestamp = Date.now();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';
        
        // Construir URL con parámetros de filtro desde la URL actual
        const urlParams = new URLSearchParams(window.location.search);
        const queryParams = new URLSearchParams();
        queryParams.set('t', timestamp.toString());
        
        // Agregar filtros si existen
        const tipoFlor = urlParams.get('tipo_flor');
        const ocasion = urlParams.get('ocasion');
        if (tipoFlor) queryParams.set('tipo_flor', tipoFlor);
        if (ocasion) queryParams.set('ocasion', ocasion);
        
        const apiUrl = `${backendUrl}/api/catalogo/productos/?${queryParams.toString()}`;
          
        console.log('🔍 Iniciando solicitud a:', apiUrl);
        console.log('🎯 Filtros aplicados:', { tipo_flor: tipoFlor, ocasion });
        const response = await fetch(apiUrl, {
          credentials: 'omit',  // Omitir credenciales para evitar CORS sin Nginx
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        console.log('📊 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
          // Crear una copia de la respuesta para poder leerla como texto
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          console.error('❌ Error en la respuesta:', response.status, errorText);
          throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Datos recibidos de la API:', data);
        console.log('📊 Cantidad de productos:', Array.isArray(data) ? data.length : 'No es array');
        console.log('🔢 IDs de productos:', Array.isArray(data) ? data.map(p => p.id) : 'N/A');
        
        if (!Array.isArray(data)) {
          console.error('❌ La respuesta no es un array:', data);
          throw new Error('Formato de respuesta inesperado: se esperaba un array de productos');
        }
        
        console.log(`✅ ${data.length} productos cargados correctamente`);
        console.log('📸 Primera imagen:', data[0]?.imagen_principal);
        
        setProducts(data);
        setFilteredProducts(data);
        setDisplayProducts(data);
      } catch (error: any) {
        console.error('❌ Error cargando productos:', error.message);
        console.error('Error completo:', error);
        
        // NO usar productos mock - mostrar error real
        setError(`Error al cargar productos: ${error.message}. Por favor, verifica que el servidor esté funcionando.`);
        setProducts([]);
        setFilteredProducts([]);
        setDisplayProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]); // Recargar cuando cambien los parámetros de búsqueda

  // Procesar parámetros de URL (filtros desde navbar)
  useEffect(() => {
    if (products.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const tipoFlorParam = urlParams.get('tipo_flor');
    const ocasionParam = urlParams.get('ocasion');
    
    console.log('🎯 ProductListClient con', products.length, 'productos');
    console.log('🔍 Params URL - tipo_flor:', tipoFlorParam, 'ocasion:', ocasionParam);
    console.log('📦 Primer producto estructura:', products[0]);

    let filtered = [...products];

    // Filtrar por tipo de flor (ID)
    if (tipoFlorParam) {
      const tipoFlorId = parseInt(tipoFlorParam);
      console.log('🔍 Buscando tipo_flor ID:', tipoFlorId);
      
      filtered = filtered.filter(product => {
        const match = product.tipo_flor?.id === tipoFlorId;
        console.log(`  - ${product.nombre}: tipo_flor=${JSON.stringify(product.tipo_flor)}, match=${match}`);
        return match;
      });
      
      console.log(`🌸 Filtrado por tipo_flor ID ${tipoFlorId}:`, filtered.length, 'de', products.length, 'productos');
    }

    // Filtrar por ocasión (ID)
    if (ocasionParam) {
      const ocasionId = parseInt(ocasionParam);
      console.log('🔍 Buscando ocasión ID:', ocasionId);
      
      filtered = filtered.filter(product => {
        const match = Array.isArray(product.ocasiones) && 
                      product.ocasiones.some((o: any) => o.id === ocasionId);
        console.log(`  - ${product.nombre}: ocasiones=${JSON.stringify(product.ocasiones)}, match=${match}`);
        return match;
      });
      
      console.log(`🎉 Filtrado por ocasión ID ${ocasionId}:`, filtered.length, 'de', products.length, 'productos');
    }
    
    console.log('💾 ACTUALIZANDO displayProducts a:', filtered.length, 'productos');
    setDisplayProducts(filtered);
    setFilteredProducts(filtered);
  // Agregar searchParams como dependencia para detectar cambios en URL
  }, [products]);

  // Detectar cambios en URL y re-filtrar (ESTE USEEFFECT YA NO ES NECESARIO - EL FILTRADO LO HACE EL BACKEND)
  useEffect(() => {
    console.log('🌐 URL completa:', window.location.href);
    console.log('📋 SearchParams toString:', searchParams.toString());
    
    if (products.length === 0) {
      console.log('⏸️ No hay productos aún, esperando...');
      return;
    }
    
    const tipoFlorParam = searchParams.get('tipo_flor');
    const ocasionParam = searchParams.get('ocasion');
    
    console.log('🔄 URL CAMBIÓ - Re-filtrando...');
    console.log('🔍 Nuevos params - tipo_flor:', tipoFlorParam, 'ocasion:', ocasionParam);

    let filtered = [...products];

    // Filtrar por tipo de flor (ID)
    if (tipoFlorParam) {
      const tipoFlorId = parseInt(tipoFlorParam);
      console.log('🔍 Buscando tipo_flor ID:', tipoFlorId);
      
      filtered = filtered.filter(product => {
        const match = product.tipo_flor?.id === tipoFlorId;
        return match;
      });
      
      console.log(`🌸 Filtrado por tipo_flor ID ${tipoFlorId}:`, filtered.length, 'de', products.length, 'productos');
    }

    // Filtrar por ocasión (ID)
    if (ocasionParam) {
      const ocasionId = parseInt(ocasionParam);
      console.log('🔍 Buscando ocasión ID:', ocasionId);
      
      filtered = filtered.filter(product => {
        const match = Array.isArray(product.ocasiones) && 
                      product.ocasiones.some((o: any) => o.id === ocasionId);
        return match;
      });
      
      console.log(`🎉 Filtrado por ocasión ID ${ocasionId}:`, filtered.length, 'de', products.length, 'productos');
    }
    
    console.log('💾 ACTUALIZANDO displayProducts a:', filtered.length, 'productos');
    setDisplayProducts(filtered);
    setFilteredProducts(filtered);
  }, [searchParams, products]);

  const handleFiltersChange = (filters: any) => {
    console.log('🔄 Aplicando filtros:', filters);
    
    let filtered = [...products];
    
    // Mapear IDs a nombres para tipos de flor
    const tiposFlor = [
      { id: 1, nombre: 'Rosas' },
      { id: 2, nombre: 'Tulipanes' },
      { id: 3, nombre: 'Girasoles' },
      { id: 4, nombre: 'Gerberas' },
      { id: 5, nombre: 'Mixto' },
      { id: 6, nombre: 'Orquídeas' }
    ];

    // Mapear IDs a nombres para ocasiones
    const ocasiones = [
      { id: 1, nombre: 'Amor' },
      { id: 2, nombre: 'Cumpleaños' },
      { id: 3, nombre: 'Amistad' },
      { id: 4, nombre: 'Aniversario' },
      { id: 5, nombre: 'Agradecimiento' }
    ];

    // Filtrar por tipo de flor
    if (filters.tipo_flor && filters.tipo_flor.length > 0) {
      const tiposSeleccionados = filters.tipo_flor.map((id: number) => {
        const tipo = tiposFlor.find(t => t.id === id);
        return tipo ? tipo.nombre : '';
      }).filter(Boolean);
      
      console.log('🌸 Filtrando por tipos de flor:', tiposSeleccionados);
      filtered = filtered.filter(product => 
        tiposSeleccionados.includes(product.tipo_flor?.nombre)
      );
    }

    // Filtrar por ocasión
    if (filters.ocasion && filters.ocasion.length > 0) {
      const ocasionesSeleccionadas = filters.ocasion.map((id: number) => {
        const ocasion = ocasiones.find(o => o.id === id);
        return ocasion ? ocasion.nombre : '';
      }).filter(Boolean);
      
      console.log('🎉 Filtrando por ocasiones:', ocasionesSeleccionadas);
      filtered = filtered.filter(product => 
        product.ocasiones?.some(ocasion => ocasionesSeleccionadas.includes(ocasion.nombre))
      );
    }

    // Filtrar por rango de precio
    if (filters.precio_min !== undefined && filters.precio_min !== null) {
      console.log('💰 Filtrando precio mínimo:', filters.precio_min);
      filtered = filtered.filter(product => {
        const precio = parseFloat(product.precio_descuento || product.precio);
        return precio >= filters.precio_min;
      });
    }

    if (filters.precio_max !== undefined && filters.precio_max !== null) {
      console.log('💰 Filtrando precio máximo:', filters.precio_max);
      filtered = filtered.filter(product => {
        const precio = parseFloat(product.precio_descuento || product.precio);
        return precio <= filters.precio_max;
      });
    }

    // Filtrar por destacados
    if (filters.destacados) {
      console.log('⭐ Filtrando solo destacados');
      filtered = filtered.filter(product => product.is_featured);
    }

    // Ordenar
    if (filters.ordering) {
      console.log('📊 Ordenando por:', filters.ordering);
      switch (filters.ordering) {
        case 'precio_asc':
          filtered.sort((a, b) => {
            const precioA = parseFloat(a.precio_descuento || a.precio);
            const precioB = parseFloat(b.precio_descuento || b.precio);
            return precioA - precioB;
          });
          break;
        case 'precio_desc':
          filtered.sort((a, b) => {
            const precioA = parseFloat(a.precio_descuento || a.precio);
            const precioB = parseFloat(b.precio_descuento || b.precio);
            return precioB - precioA;
          });
          break;
        case 'nombre_asc':
          filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
          break;
        case 'nombre_desc':
          filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
          break;
      }
    }

    console.log('✅ Productos después de filtros:', filtered.length);
    setFilteredProducts(filtered);
    setDisplayProducts(filtered);
  };

  // Indicador de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    // Verificar si es un mensaje de modo sin conexión
    const isOfflineMode = error.includes('MODO SIN CONEXIÓN');
    
    return (
      <div className="text-center py-6 mb-4">
        <div className={`${isOfflineMode ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 max-w-2xl mx-auto shadow-sm`}>
          {isOfflineMode ? (
            <>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">⚠️</span>
                <h3 className="text-amber-800 font-semibold">Modo Sin Conexión</h3>
              </div>
              <p className="text-amber-700 mb-2">No se pudo establecer conexión con el servidor.</p>
              <p className="text-amber-600">Mostrando productos de demostración sin precios ni imágenes reales.</p>
            </>
          ) : (
            <>
              <h3 className="text-red-800 font-semibold mb-2">Error al cargar productos</h3>
              <p className="text-red-600">{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🌸</span>
          <h1 className="text-2xl font-bold text-gray-800">
            {showRecommended ? 'Productos Recomendados' : 
             showAdditionals ? 'Productos Adicionales' : 
             'Productos'}
          </h1>
        </div>
        <p className="text-gray-600">
          Mostrando {displayProducts.length} de {products.length} productos disponibles
        </p>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-8">
          <ProductFilters onFiltersChange={handleFiltersChange} />
        </div>
      )}

      {/* Grid de productos mejorado */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-8 px-2">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mensaje cuando no hay productos */}
      {displayProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-gray-800 font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar los filtros para ver más resultados
            </p>
            <button 
              onClick={() => handleFiltersChange({})}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
