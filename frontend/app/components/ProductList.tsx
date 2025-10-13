'use client';

import React, { useState, useEffect } from 'react';
import ProductCardSimple from './ProductCardSimple';
import ProductFilters from './ProductFilters';
import { Product } from '@/types/Product';
import styles from './ProductList.module.css';

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
}

export default function ProductList({ showRecommended = false, showAdditionals = false }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(!showRecommended && !showAdditionals);

  console.log('🔥 ProductList initialized:', { showRecommended, showAdditionals, showFilters });

  const getApiUrl = () => {
    // Usar rutas relativas para que funcione con el proxy
    let url = '/api/catalogo/productos/';
    
    // Aplicar filtros
    const params = new URLSearchParams();
    
    if (filters.tipo_flor) params.append('tipo_flor', filters.tipo_flor);
    if (filters.ocasion) params.append('ocasion', filters.ocasion);
    if (filters.precio_min) params.append('precio_min', filters.precio_min);
    if (filters.precio_max) params.append('precio_max', filters.precio_max);
    if (filters.destacados) params.append('destacados', 'true');
    if (filters.adicionales) params.append('adicionales', 'true');
    if (filters.ordering) params.append('ordering', filters.ordering);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    return url;
  };

  const testBackendConnection = async () => {
    const testUrl = '/api/catalogo/productos/';
    console.log('🔍 Probando conexión con el backend en:', testUrl);
    
    try {
      // Hacer una petición simple al backend
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('🔍 Estado de la prueba de conexión:', testResponse.status);
      console.log('🔍 Headers de la respuesta:', Array.from(testResponse.headers.entries()));
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Prueba de conexión exitosa. Datos recibidos:', testData);
        return true;
      } else {
        const errorText = await testResponse.text();
        console.error('❌ Error en la prueba de conexión:', testResponse.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error en la prueba de conexión:', error);
      return false;
    }
  };

  const loadProducts = async () => {
    console.log('🔍 Iniciando carga de productos...');
    setLoading(true);
    setError(null);
    
    try {
      // Primero probamos la conexión con el backend
      const connectionOk = await testBackendConnection();
      if (!connectionOk) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión y recarga la página.');
        return;
      }

      // Si la conexión es exitosa, proceder con la carga de productos
      const backendUrl = getApiUrl() || '/api/catalogo/productos/';
      console.log('🔗 Solicitando productos a:', backendUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('📝 Estado de la respuesta:', response.status);
        console.log('📦 Cabeceras de la respuesta:', Array.from(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error en la respuesta:', response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos del servidor:', data);
        
        if (!data || (!data.results && !Array.isArray(data))) {
          console.error('❌ Formato de respuesta inesperado:', data);
          throw new Error('Formato de respuesta inesperado del servidor');
        }
        
        const productos = data.results || data;
        
        if (!productos || !Array.isArray(productos)) {
          console.error('❌ Formato de respuesta inesperado:', data);
          setError('Error al cargar los productos: formato de respuesta inesperado');
          return;
        }

        console.log('📊 Productos recibidos del servidor:', productos);
        
        // Mostrar el estado de is_active de los primeros productos para depuración
        if (productos.length > 0) {
          console.log('🔍 Estado is_active de los primeros productos:');
          productos.slice(0, 3).forEach((p: Product, i: number) => {
            console.log(`  Producto ${i + 1}: ${p.nombre} - is_active: ${p.is_active}, stock: ${p.stock}`);
          });
        }

        // Filtrar productos con stock y activos
        const productosFiltrados = productos.filter((p: Product) => {
          const isActive = p.is_active !== false; // Asegurarse de que is_active no sea false
          const hasStock = p.stock > 0;
          console.log(`🔍 Filtrado - ${p.nombre}: is_active=${p.is_active}, stock=${p.stock} => ${isActive && hasStock ? 'INCLUIDO' : 'EXCLUIDO'}`);
          return isActive && hasStock;
        });
        
        if (productosFiltrados.length === 0) {
          console.log('ℹ️ No hay productos activos con stock disponible');
          console.log('ℹ️ Productos recibidos:', productos);
          setError('No hay productos disponibles en este momento');
          return;
        }

        console.log(`✅ ${productosFiltrados.length} de ${productos.length} productos cargados correctamente`);
        setProducts(productosFiltrados);
        
      } catch (error: any) {
        console.error('❌ Error al cargar productos:', error);
        setError(`Error al cargar productos: ${error.message || 'Error desconocido'}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      setError(`Error inesperado: ${error.message || 'Por favor, intente nuevamente más tarde'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useEffect triggered, loading mock data...');
    loadProducts();
  }, []);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>❌ {error}</p>
        <button onClick={loadProducts} className={styles.retryBtn}>
          🔄 Reintentar
        </button>
      </div>
    );
  }

  console.log('Rendering ProductList, showFilters:', showFilters);
  
  return (
    <div className={styles.productList}>
      {showFilters && (
        <div className={styles.debugFilters}>
          <h3>FILTROS DEBUG</h3>
          <div style={{ background: '#ffeb3b', padding: '10px', margin: '10px 0' }}>
            <p>🔥 COMPONENTE PRODUCTFILTERS DEBERÍA APARECER AQUÍ:</p>
            <ProductFilters 
              onFiltersChange={handleFiltersChange}
              className={styles.filters}
            />
          </div>
        </div>
      )}
      
      <div className={styles.productsGrid}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCardSimple key={product.id} product={product} />
          ))
        ) : (
          <div className={styles.noProducts}>
            <p>🌸 No se encontraron productos</p>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
