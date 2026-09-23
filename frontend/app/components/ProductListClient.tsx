'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Product } from '@/types/Product';
import { useI18n } from '@/context/I18nContext';
import { localeHref } from '@/utils/localeHref';

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
  showFeatured?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  /** Productos ya resueltos en el servidor: el HTML inicial sale con la grilla
   *  completa, que es lo que rastrean Google y los agentes. */
  initialProducts?: Product[];
}

interface FilterState {
  precio_min?: number;
  precio_max?: number;
  destacados?: boolean;
  adicionales?: boolean;
  ordering?: string;
  search?: string;
}

const PAGE_SIZE = 24;

export default function ProductListClient({ showRecommended = false, showAdditionals = false, showFeatured = false, showFilters: showFiltersProp, maxItems, initialProducts }: ProductListProps) {
  const { locale, t } = useI18n();
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [error, setError] = useState<string | null>(null);
  const showFilters = showFiltersProp !== undefined ? showFiltersProp : (!showRecommended && !showAdditionals && !showFeatured);
  const [displayProducts, setDisplayProducts] = useState<Product[]>(initialProducts ?? []);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get('categoria');
  const ocasionParam = searchParams.get('ocasion');
  const tipoFlorParam = searchParams.get('tipo_flor');
  const searchParam = searchParams.get('search');
  const hasActiveFilters = Boolean(categoriaParam || ocasionParam || tipoFlorParam || searchParam);

  // Cargar productos desde la API - Se recarga cuando cambian los filtros
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';

        const queryParams = new URLSearchParams();
        if (tipoFlorParam) queryParams.set('tipo_flor', tipoFlorParam);
        if (ocasionParam) queryParams.set('ocasion', ocasionParam);
        if (categoriaParam) queryParams.set('categoria', categoriaParam);
        if (searchParam) queryParams.set('search', searchParam);
        if (showFeatured) queryParams.set('destacados', 'true');
        if (showAdditionals) queryParams.set('adicionales', 'true');
        queryParams.set('lang', locale);
        queryParams.set('_t', Date.now().toString());

        const response = await fetch(`${backendUrl}/api/catalogo/productos/?${queryParams.toString()}`, {
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorText = await response.clone().text();
          throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Formato de respuesta inesperado: se esperaba un array de productos');
        }

        let filteredData: Product[] = data;

        if (showFeatured) {
          filteredData = data.filter((product: Product) => product.is_featured === true);
        } else if (showAdditionals) {
          filteredData = data.filter((product: Product) => product.es_adicional === true);
        }

        setProducts(filteredData);
        setDisplayProducts(filteredData);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error cargando productos:', message);
        // Con productos del servidor la grilla ya es usable: no se pisa con un error.
        if (!initialProducts?.length) {
          setError(`Error al cargar productos: ${message}. Por favor, verifica que el servidor esté funcionando.`);
          setProducts([]);
          setDisplayProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoriaParam, ocasionParam, tipoFlorParam, searchParam, showAdditionals, showFeatured, locale, initialProducts]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [displayProducts]);

  const handleFiltersChange = useCallback((filters: FilterState) => {
    setDisplayProducts((current) => {
      let filtered = [...products];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((product) => product.nombre.toLowerCase().includes(searchLower));
      }

      if (filters.precio_min !== undefined && filters.precio_min !== null) {
        filtered = filtered.filter((product) => parseFloat(product.precio_descuento || product.precio) >= filters.precio_min!);
      }

      if (filters.precio_max !== undefined && filters.precio_max !== null) {
        filtered = filtered.filter((product) => parseFloat(product.precio_descuento || product.precio) <= filters.precio_max!);
      }

      if (filters.destacados) {
        filtered = filtered.filter((product) => product.is_featured);
      }

      if (filters.adicionales) {
        filtered = filtered.filter((product) => product.es_adicional);
      }

      switch (filters.ordering) {
        case 'precio':
          filtered.sort((a, b) => parseFloat(a.precio_descuento || a.precio) - parseFloat(b.precio_descuento || b.precio));
          break;
        case '-precio':
          filtered.sort((a, b) => parseFloat(b.precio_descuento || b.precio) - parseFloat(a.precio_descuento || a.precio));
          break;
        case 'nombre':
          filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
          break;
        case '-nombre':
          filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
          break;
        case '-created_at':
          filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          break;
      }

      const sameLength = current.length === filtered.length;
      const sameOrder = sameLength && current.every((product, index) => product.id === filtered[index].id);
      return sameOrder ? current : filtered;
    });
  }, [products]);

  // Los adicionales (globos, chocolates, peluches) no compiten con las flores
  // en el listado general: se muestran cuando se los busca explícitamente.
  const gridProducts = useMemo(() => {
    if (hasActiveFilters || showAdditionals) return displayProducts;
    const withoutExtras = displayProducts.filter((product) => !product.es_adicional);
    return withoutExtras.length > 0 ? withoutExtras : displayProducts;
  }, [displayProducts, hasActiveFilters, showAdditionals]);

  const categoryName = useMemo(() => {
    if (!categoriaParam) return null;
    const fromProducts = products.find((product) => product.categoria?.slug === categoriaParam)?.categoria?.nombre;
    return fromProducts ?? categoriaParam.replace(/-/g, ' ');
  }, [categoriaParam, products]);

  const heading = categoryName ?? (searchParam ? `${t('catalog.resultsFor')} "${searchParam}"` : t('catalog.allProducts'));
  const extrasHidden = !hasActiveFilters && !showAdditionals && displayProducts.some((product) => product.es_adicional);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 mb-4">
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
          <h3 className="text-red-800 font-semibold mb-2">Error al cargar productos</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const visibleProducts = maxItems ? gridProducts.slice(0, maxItems) : gridProducts.slice(0, visibleCount);
  const remaining = gridProducts.length - visibleProducts.length;

  return (
    <div className="w-full">
      {showFilters && (
        <div className="mb-6 px-2">
          <nav aria-label="Ruta de navegación" className="flex items-center gap-1 text-sm text-gray-500">
            <Link href={localeHref('/', locale)} className="hover:text-emerald-700 hover:underline">
              {t('catalog.home')}
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            {categoryName ? (
              <>
                <Link href={localeHref('/productos', locale)} className="hover:text-emerald-700 hover:underline">
                  {t('catalog.allProducts')}
                </Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium capitalize text-gray-900">{categoryName}</span>
              </>
            ) : (
              <span className="font-medium text-gray-900">{t('catalog.allProducts')}</span>
            )}
          </nav>

          <h1 className="mt-2 text-2xl font-semibold capitalize text-gray-900 md:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {gridProducts.length === 1
              ? t('catalog.oneProduct')
              : `${gridProducts.length} ${t('catalog.productsAvailable')}`}
          </p>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="mb-8">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            productsCount={gridProducts.length}
          />
        </div>
      )}

      {/* Grid de productos */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mt-8 px-2">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Paginación progresiva */}
      {!maxItems && remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-md border border-green-700 px-6 py-3 font-medium text-green-700 transition-colors hover:bg-green-50"
          >
            {t('catalog.loadMore')} ({remaining})
          </button>
        </div>
      )}

      {/* Los adicionales viven en su propia vista */}
      {showFilters && extrasHidden && (
        <div className="mt-10 px-2 text-center text-sm text-gray-600">
          {t('catalog.extrasHint')}{' '}
          <Link href={localeHref('/productos?categoria=adicionales', locale)} className="font-medium text-emerald-700 hover:underline">
            {t('catalog.extrasLink')}
          </Link>
        </div>
      )}

      {/* Mensaje cuando no hay productos */}
      {gridProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-gray-800 font-semibold mb-2">{t('catalog.emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('catalog.emptyText')}</p>
            <Link
              href={localeHref('/productos', locale)}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t('catalog.emptyCta')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
