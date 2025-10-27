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
  tipo_flor?: number[];
  ocasion?: number[];
  precio_min?: number;
  precio_max?: number;
  destacados?: boolean;
  adicionales?: boolean;
  ordering?: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
  productsCount?: number;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange, className = '', productsCount = 0 }) => {
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  const [filters, setFilters] = useState<FilterState>({ tipo_flor: [], ocasion: [] });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  console.log('🔥 ProductFilters RENDERIZADO!', { 
    loading, 
    tiposFlor: tiposFlor.length, 
    ocasiones: ocasiones.length 
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
        
        const mockOcasiones: Ocasion[] = [
          { id: 1, nombre: 'Amor' },
          { id: 2, nombre: 'San Valentín' },
          { id: 3, nombre: 'Aniversario' },
          { id: 4, nombre: 'Cumpleaños' },
          { id: 5, nombre: 'Felicitaciones' },
          { id: 6, nombre: 'Graduación' },
          { id: 7, nombre: 'Amistad' },
          { id: 8, nombre: 'Alegría' },
          { id: 9, nombre: 'Boda' },
          { id: 10, nombre: 'Elegancia' },
          { id: 11, nombre: 'Pureza' },
          { id: 12, nombre: 'Decoración' },
          { id: 13, nombre: 'Lujo' }
        ];

        console.log('🌸 Mock tipos de flor loaded:', mockTiposFlor.length);
        console.log('🎉 Mock ocasiones loaded:', mockOcasiones.length);
        
        setTiposFlor(mockTiposFlor);
        setOcasiones(mockOcasiones);

      } catch (error) {
        console.error('💥 Error loading filter data:', error);
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

  const handleCheckboxChange = (key: 'tipo_flor' | 'ocasion', id: number) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id];
      return {
        ...prev,
        [key]: updated.length > 0 ? updated : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({ tipo_flor: [], ocasion: [] });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterState];
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  });

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof FilterState];
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

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
          {/* Ordenamiento - Primero */}
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

          {/* Tipo de Flor - Checkboxes */}
          <div className="filter-group filter-group-checkboxes">
            <label className="filter-label">🌸 Tipo de Flor</label>
            <div className="checkbox-list">
              {tiposFlor.map(tipo => (
                <label key={tipo.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(filters.tipo_flor || []).includes(tipo.id)}
                    onChange={() => handleCheckboxChange('tipo_flor', tipo.id)}
                  />
                  <span>{tipo.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ocasión - Checkboxes */}
          <div className="filter-group filter-group-checkboxes">
            <label className="filter-label">🎉 Ocasión</label>
            <div className="checkbox-list">
              {ocasiones.slice(0, 6).map(ocasion => (
                <label key={ocasion.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(filters.ocasion || []).includes(ocasion.id)}
                    onChange={() => handleCheckboxChange('ocasion', ocasion.id)}
                  />
                  <span>{ocasion.nombre}</span>
                </label>
              ))}
            </div>
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
          <div className="filter-group filter-group-special">
            <label className="filter-label">✨ Especiales</label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.destacados || false}
                onChange={(e) => handleFilterChange('destacados', e.target.checked || undefined)}
              />
              <span>⭐ Solo destacados</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.adicionales || false}
                onChange={(e) => handleFilterChange('adicionales', e.target.checked || undefined)}
              />
              <span>🎁 Solo adicionales</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
