'use client';

import React, { useState, useEffect } from 'react';
import './ProductFilters.css';

interface TipoFlor {
  id: number;
  nombre: string;
  count?: number;
}

interface Ocasion {
  id: number;
  nombre: string;
  count?: number;
}

interface FilterState {
  tipo_flor?: number;
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

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange, className = '', productsCount = 0 }) => {
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  console.log('🔥 ProductFilters RENDERIZADO!', { 
    loading, 
    tiposFlor: tiposFlor.length
  });

  // Cargar tipos de flor y ocasiones
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        console.log('🔍 Loading filter data...');
        
        // Usar datos mock temporalmente mientras se resuelve la conectividad
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockTiposFlor: TipoFlor[] = [
          { id: 1, nombre: 'Rosas' },
          { id: 2, nombre: 'Tulipanes' },
          { id: 3, nombre: 'Girasoles' },
          { id: 4, nombre: 'Orquídeas' },
          { id: 5, nombre: 'Mixto' },
          { id: 6, nombre: 'Lilium' },
          { id: 7, nombre: 'Gerberas' }
        ];
        
        console.log('🌸 Mock tipos de flor loaded:', mockTiposFlor.length);
        
        setTiposFlor(mockTiposFlor);
        setLoading(false);

      } catch (error) {
        console.error('💥 Error loading filter data:', error);
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };


  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof FilterState] !== undefined && filters[key as keyof FilterState] !== ''
  );

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof FilterState] !== undefined && filters[key as keyof FilterState] !== ''
  ).length;

  return (
    <div className={`product-filters ${className}`}>
      {/* Header con toggle móvil */}
      <button 
        className="filters-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>🔍 Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
        <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      <div className="filters-header">
        <div className="filters-title">
          <h3>🔍 Filtros</h3>
          {productsCount > 0 && (
            <span className="products-count">{productsCount} productos</span>
          )}
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar todo
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Cargando filtros...</p>
        </div>
      ) : (
        <div className={`filters-content ${isOpen ? 'open' : ''}`}>
          {/* Búsqueda por nombre */}
          <div className="filter-group">
            <label className="filter-label">🔍 Buscar</label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className="filter-select"
            />
          </div>

          {/* Ordenamiento */}
          <div className="filter-group">
            <label className="filter-label">📊 Ordenar por</label>
            <select
              value={filters.ordering || ''}
              onChange={(e) => handleFilterChange('ordering', e.target.value || undefined)}
              className="filter-select"
              aria-label="Seleccionar orden de productos"
            >
              <option value="">Destacados</option>
              <option value="precio">Precio: Menor a Mayor</option>
              <option value="-precio">Precio: Mayor a Menor</option>
              <option value="nombre">Nombre: A-Z</option>
              <option value="-nombre">Nombre: Z-A</option>
              <option value="-created_at">Más recientes</option>
            </select>
          </div>

          {/* Tipo de Flor - Select */}
          <div className="filter-group">
            <label className="filter-label">🌸 Tipo de Flor</label>
            <select
              value={filters.tipo_flor || ''}
              onChange={(e) => handleFilterChange('tipo_flor', e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select"
              aria-label="Seleccionar tipo de flor"
            >
              <option value="">Todos los tipos</option>
              {tiposFlor.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Precio */}
          <div className="filter-group">
            <label className="filter-label">💰 Precio</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Mín"
                value={filters.precio_min || ''}
                onChange={(e) => handleFilterChange('precio_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Máx"
                value={filters.precio_max || ''}
                onChange={(e) => handleFilterChange('precio_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="price-input"
              />
            </div>
          </div>

          {/* Filtros especiales */}
          <div className="filter-group">
            <label className="filter-label">✨ Especiales</label>
            <select
              value={filters.destacados ? 'destacados' : filters.adicionales ? 'adicionales' : ''}
              onChange={(e) => {
                if (e.target.value === 'destacados') {
                  handleFilterChange('destacados', true);
                  handleFilterChange('adicionales', undefined);
                } else if (e.target.value === 'adicionales') {
                  handleFilterChange('adicionales', true);
                  handleFilterChange('destacados', undefined);
                } else {
                  handleFilterChange('destacados', undefined);
                  handleFilterChange('adicionales', undefined);
                }
              }}
              className="filter-select"
            >
              <option value="">Todos</option>
              <option value="destacados">⭐ Solo destacados</option>
              <option value="adicionales">🎁 Solo adicionales</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
