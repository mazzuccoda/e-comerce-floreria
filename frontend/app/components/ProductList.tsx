'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/Product';
import ProductCard from './ProductCard';
import styles from './ProductList.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined' ? 'http://web:8000' : 'http://localhost:8000');

interface TipoFlor {
  id: number;
  nombre: string;
  slug: string;
}

interface Ocasion {
  id: number;
  nombre: string;
  slug: string;
}

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
}

export default function ProductList({ showRecommended = false, showAdditionals = false }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (showRecommended) {
      return `${API_URL}/api/catalogo/productos/recomendados/`;
    } else if (showAdditionals) {
      return `${API_URL}/api/catalogo/productos/adicionales/`;
    }
    return `${API_URL}/api/catalogo/productos/`;
  });
  
  // Opciones para filtros
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  
  // Filtros
  const [tipoFlorFilter, setTipoFlorFilter] = useState<string>('');
  const [ocasionFilter, setOcasionFilter] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState<'precio' | '-precio' | 'nombre' | '-nombre'>('nombre');
  const [showFeatured, setShowFeatured] = useState<boolean>(false);
  const [showAdicionales, setShowAdicionales] = useState<boolean>(false);

  // Cargar opciones de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [tiposResponse, ocasionesResponse] = await Promise.all([
          fetch(`${API_URL}/api/catalogo/tipos-flor/`),
          fetch(`${API_URL}/api/catalogo/ocasiones/`)
        ]);
        
        if (tiposResponse.ok) {
          const tiposData = await tiposResponse.json();
          setTiposFlor(tiposData.results || tiposData);
        }
        
        if (ocasionesResponse.ok) {
          const ocasionesData = await ocasionesResponse.json();
          setOcasiones(ocasionesData.results || ocasionesData);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Construir URL con filtros
  const buildFilteredUrl = () => {
    const params = new URLSearchParams();
    
    if (tipoFlorFilter) params.append('tipo_flor__slug', tipoFlorFilter);
    if (ocasionFilter) params.append('ocasiones__slug', ocasionFilter);
    if (priceMin) params.append('precio__gte', priceMin);
    if (priceMax) params.append('precio__lte', priceMax);
    if (showFeatured) params.append('is_featured', 'true');
    if (showAdicionales) params.append('es_adicional', 'true');
    if (sort) params.append('ordering', sort);
    
    const queryString = params.toString();
    return `${API_URL}/api/catalogo/productos/${queryString ? `?${queryString}` : ''}`;
  };

  // Aplicar filtros
  const applyFilters = () => {
    const newUrl = buildFilteredUrl();
    setCurrentUrl(newUrl);
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(currentUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const items: Product[] = data.results || data;
        setProducts(items);
        // Paginación DRF
        setNextUrl(data.next || null);
        setPrevUrl(data.previous || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchProducts();
  }, [currentUrl]);

  if (loading) {
    // skeletons
    return (
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonPrice} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">Error al cargar los productos: {error}</p>;
  }

  const handleReset = () => {
    setTipoFlorFilter('');
    setOcasionFilter('');
    setPriceMin('');
    setPriceMax('');
    setSort('nombre');
    setShowFeatured(false);
    setShowAdicionales(false);
    setCurrentUrl(`${API_URL}/api/catalogo/productos/`);
  };

  return (
    <>
      <div className="product-list-toolbar">
        <div className="product-list-filters">
          {/* Filtro por tipo de flor */}
          <select
            className="filter-select"
            value={tipoFlorFilter}
            onChange={(e) => setTipoFlorFilter(e.target.value)}
            aria-label="Filtrar por tipo de flor"
          >
            <option value="">Todos los tipos</option>
            {tiposFlor.map((tipo) => (
              <option key={tipo.id} value={tipo.slug}>
                {tipo.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por ocasión */}
          <select
            className="filter-select"
            value={ocasionFilter}
            onChange={(e) => setOcasionFilter(e.target.value)}
            aria-label="Filtrar por ocasión"
          >
            <option value="">Todas las ocasiones</option>
            {ocasiones.map((ocasion) => (
              <option key={ocasion.id} value={ocasion.slug}>
                {ocasion.nombre}
              </option>
            ))}
          </select>

          {/* Filtros de precio */}
          <input
            className="filter-input"
            type="number"
            placeholder="Precio mín"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className="filter-input"
            type="number"
            placeholder="Precio máx"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />

          {/* Ordenamiento */}
          <select
            className="filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            aria-label="Ordenar por"
          >
            <option value="nombre">Nombre (A-Z)</option>
            <option value="-nombre">Nombre (Z-A)</option>
            <option value="precio">Precio (menor a mayor)</option>
            <option value="-precio">Precio (mayor a menor)</option>
            <option value="-created_at">Más recientes</option>
          </select>

          {/* Checkboxes para destacados y adicionales */}
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showFeatured}
              onChange={(e) => setShowFeatured(e.target.checked)}
            />
            Solo recomendados
          </label>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showAdicionales}
              onChange={(e) => setShowAdicionales(e.target.checked)}
            />
            Solo adicionales
          </label>

          <button className="filter-button" onClick={applyFilters}>
            Aplicar Filtros
          </button>
          <button className="filter-button secondary" onClick={handleReset}>
            Limpiar
          </button>
        </div>
        <div className="product-list-pagination">
          <button
            className="pagination-button"
            disabled={!prevUrl}
            onClick={() => prevUrl && setCurrentUrl(prevUrl)}
          >Anterior</button>
          <button
            className="pagination-button"
            disabled={!nextUrl}
            onClick={() => nextUrl && setCurrentUrl(nextUrl)}
          >Siguiente</button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">No hay productos que coincidan con los filtros aplicados.</div>
      ) : (
        <div className="product-grid">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="product-list-pagination">
        <button
          className="pagination-button"
          disabled={!prevUrl}
          onClick={() => prevUrl && setCurrentUrl(prevUrl)}
        >Anterior</button>
        <button
          className="pagination-button"
          disabled={!nextUrl}
          onClick={() => nextUrl && setCurrentUrl(nextUrl)}
        >Siguiente</button>
      </div>
    </>
  );
}
