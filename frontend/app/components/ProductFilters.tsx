'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, Flower2, Gift, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import './ProductFilters.css';

interface TipoFlor {
  id: number;
  nombre: string;
}

interface Ocasion {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  is_active: boolean;
}

interface FilterState {
  precio_min?: number;
  precio_max?: number;
  destacados?: boolean;
  adicionales?: boolean;
  ordering?: string;
  search?: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
  productsCount?: number;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange, className = '', productsCount = 0 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const categoriaParam = searchParams.get('categoria') ?? '';
  const tipoFlorParam = searchParams.get('tipo_flor') ?? '';
  const ocasionParam = searchParams.get('ocasion') ?? '';
  const searchParamValue = searchParams.get('search') ?? '';

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [tipos, ocasionesData, categoriasData] = await Promise.all([
          fetch(`${BACKEND_URL}/api/catalogo/tipos-flor/`, { credentials: 'omit' }).then((r) => (r.ok ? r.json() : [])),
          fetch(`${BACKEND_URL}/api/catalogo/ocasiones/`, { credentials: 'omit' }).then((r) => (r.ok ? r.json() : [])),
          fetch(`${BACKEND_URL}/api/catalogo/categorias/`, { credentials: 'omit' }).then((r) => (r.ok ? r.json() : [])),
        ]);

        if (Array.isArray(tipos)) setTiposFlor(tipos);
        if (Array.isArray(ocasionesData)) setOcasiones(ocasionesData);
        if (Array.isArray(categoriasData)) {
          setCategorias(categoriasData.filter((cat: Categoria) => cat.is_active));
        }
      } catch (error) {
        console.error('Error cargando los filtros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: string | number | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  // Categoría, tipo de flor y ocasión viven en la URL: los resuelve el backend
  // y así el filtro se puede compartir y volver atrás.
  const updateUrlParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const query = params.toString();
      router.push(query ? `/productos?${query}` : '/productos');
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    setFilters({});
    router.push('/productos');
  };

  const activeChips = useMemo<Chip[]>(() => {
    const chips: Chip[] = [];

    if (categoriaParam) {
      const categoria = categorias.find((cat) => cat.slug === categoriaParam);
      chips.push({
        key: 'categoria',
        label: categoria?.nombre ?? categoriaParam.replace(/-/g, ' '),
        onRemove: () => updateUrlParam('categoria', ''),
      });
    }

    if (tipoFlorParam) {
      const tipo = tiposFlor.find((t) => String(t.id) === tipoFlorParam);
      chips.push({
        key: 'tipo_flor',
        label: tipo?.nombre ?? 'Tipo de flor',
        onRemove: () => updateUrlParam('tipo_flor', ''),
      });
    }

    if (ocasionParam) {
      const ocasion = ocasiones.find((o) => String(o.id) === ocasionParam);
      chips.push({
        key: 'ocasion',
        label: ocasion?.nombre ?? 'Ocasión',
        onRemove: () => updateUrlParam('ocasion', ''),
      });
    }

    if (searchParamValue) {
      chips.push({
        key: 'search-url',
        label: `"${searchParamValue}"`,
        onRemove: () => updateUrlParam('search', ''),
      });
    }

    if (filters.search) {
      chips.push({
        key: 'search',
        label: `"${filters.search}"`,
        onRemove: () => handleFilterChange('search', undefined),
      });
    }

    if (filters.precio_min !== undefined) {
      chips.push({
        key: 'precio_min',
        label: `Desde $ ${filters.precio_min.toLocaleString('es-AR')}`,
        onRemove: () => handleFilterChange('precio_min', undefined),
      });
    }

    if (filters.precio_max !== undefined) {
      chips.push({
        key: 'precio_max',
        label: `Hasta $ ${filters.precio_max.toLocaleString('es-AR')}`,
        onRemove: () => handleFilterChange('precio_max', undefined),
      });
    }

    if (filters.destacados) {
      chips.push({
        key: 'destacados',
        label: 'Destacados',
        onRemove: () => handleFilterChange('destacados', undefined),
      });
    }

    if (filters.adicionales) {
      chips.push({
        key: 'adicionales',
        label: 'Adicionales',
        onRemove: () => handleFilterChange('adicionales', undefined),
      });
    }

    return chips;
  }, [
    categoriaParam,
    categorias,
    filters.adicionales,
    filters.destacados,
    filters.precio_max,
    filters.precio_min,
    filters.search,
    ocasionParam,
    ocasiones,
    searchParamValue,
    tipoFlorParam,
    tiposFlor,
    updateUrlParam,
  ]);

  return (
    <div className={`product-filters ${className}`}>
      {/* Header con toggle móvil */}
      <button className="filters-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="filters-toggle-label">
          <SlidersHorizontal className="filter-icon" aria-hidden="true" />
          Filtros {activeChips.length > 0 && `(${activeChips.length})`}
        </span>
        <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      <div className="filters-header">
        <div className="filters-title">
          <h2>
            <SlidersHorizontal className="filter-icon" aria-hidden="true" />
            Filtros
          </h2>
          {productsCount > 0 && <span className="products-count">{productsCount} productos</span>}
        </div>
        {activeChips.length > 0 && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar todo
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="active-chips">
          {activeChips.map((chip) => (
            <button key={chip.key} onClick={chip.onRemove} className="active-chip" aria-label={`Quitar filtro ${chip.label}`}>
              <span>{chip.label}</span>
              <X className="chip-icon" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Cargando filtros...</p>
        </div>
      ) : (
        <div className={`filters-content ${isOpen ? 'open' : ''}`}>
          {/* Búsqueda por nombre */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-busqueda">
              <Search className="filter-icon" aria-hidden="true" />
              Buscar
            </label>
            <input
              id="filtro-busqueda"
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className="filter-select"
            />
          </div>

          {/* Categoría */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-categoria">
              <Tag className="filter-icon" aria-hidden="true" />
              Categoría
            </label>
            <select
              id="filtro-categoria"
              value={categoriaParam}
              onChange={(e) => updateUrlParam('categoria', e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.slug}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ocasión */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-ocasion">
              <Gift className="filter-icon" aria-hidden="true" />
              Ocasión
            </label>
            <select
              id="filtro-ocasion"
              value={ocasionParam}
              onChange={(e) => updateUrlParam('ocasion', e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las ocasiones</option>
              {ocasiones.map((ocasion) => (
                <option key={ocasion.id} value={ocasion.id}>
                  {ocasion.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de flor */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-tipo-flor">
              <Flower2 className="filter-icon" aria-hidden="true" />
              Tipo de flor
            </label>
            <select
              id="filtro-tipo-flor"
              value={tipoFlorParam}
              onChange={(e) => updateUrlParam('tipo_flor', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los tipos</option>
              {tiposFlor.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-orden">
              <ArrowUpDown className="filter-icon" aria-hidden="true" />
              Ordenar por
            </label>
            <select
              id="filtro-orden"
              value={filters.ordering || ''}
              onChange={(e) => handleFilterChange('ordering', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Destacados</option>
              <option value="precio">Precio: menor a mayor</option>
              <option value="-precio">Precio: mayor a menor</option>
              <option value="nombre">Nombre: A-Z</option>
              <option value="-nombre">Nombre: Z-A</option>
              <option value="-created_at">Más recientes</option>
            </select>
          </div>

          {/* Rango de Precio */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filtro-precio-min">
              <Wallet className="filter-icon" aria-hidden="true" />
              Precio
            </label>
            <div className="price-range">
              <input
                id="filtro-precio-min"
                type="number"
                inputMode="numeric"
                placeholder="Mín"
                value={filters.precio_min ?? ''}
                onChange={(e) => handleFilterChange('precio_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Máx"
                aria-label="Precio máximo"
                value={filters.precio_max ?? ''}
                onChange={(e) => handleFilterChange('precio_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="price-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
