'use client';

import React, { useState, useEffect } from 'react';
import './ProductFilters.css';

interface TipoFlor {
  id: number;
  nombre: string;
}

interface Ocasion {
  id: number;
  nombre: string;
}

interface FilterState {
  tipo_flor?: number;
  ocasion?: number;
  precio_min?: number;
  precio_max?: number;
  destacados?: boolean;
  adicionales?: boolean;
  ordering?: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange, className = '' }) => {
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [ocasiones, setOcasiones] = useState<Ocasion[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);

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

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof FilterState] !== undefined
  );

  return (
    <div className={`product-filters ${className}`}>
      <div className="filters-header">
        <h3>🔍 Filtros de Productos</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            🗑️ Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Cargando filtros...</p>
        </div>
      ) : (
        <div className="filters-content">
          {/* Tipo de Flor */}
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

          {/* Ocasión */}
          <div className="filter-group">
            <label className="filter-label">🎉 Ocasión</label>
            <select
              value={filters.ocasion || ''}
              onChange={(e) => handleFilterChange('ocasion', e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select"
              aria-label="Seleccionar ocasión"
            >
              <option value="">Todas las ocasiones</option>
              {ocasiones.map(ocasion => (
                <option key={ocasion.id} value={ocasion.id}>
                  {ocasion.nombre}
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

          {/* Ordenamiento */}
          <div className="filter-group">
            <label className="filter-label">📊 Ordenar por</label>
            <select
              value={filters.ordering || ''}
              onChange={(e) => handleFilterChange('ordering', e.target.value || undefined)}
              className="filter-select"
              aria-label="Seleccionar orden de productos"
            >
              <option value="">Más recientes</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="-nombre">Nombre Z-A</option>
              <option value="precio">Precio menor</option>
              <option value="-precio">Precio mayor</option>
            </select>
          </div>

          {/* Filtros especiales */}
          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.destacados || false}
                onChange={(e) => handleFilterChange('destacados', e.target.checked || undefined)}
              />
              ⭐ Solo destacados
            </label>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.adicionales || false}
                onChange={(e) => handleFilterChange('adicionales', e.target.checked || undefined)}
              />
              🎁 Solo adicionales
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
