'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Product } from '@/types/Product';
import styles from './ProductList.module.css';

// Mock data outside component to avoid re-creation
const mockProducts: Product[] = [
    {
      id: 1,
      nombre: "Ramo de 12 Rosas Rojas",
      slug: "ramo-12-rosas-rojas",
      descripcion: "Hermoso ramo de 12 rosas rojas frescas",
      descripcion_corta: "Ramo de 12 rosas rojas",
      categoria: { nombre: "Ramos", slug: "ramos", descripcion: "Ramos florales", imagen: null },
      precio: "45.99",
      precio_descuento: "39.99",
      porcentaje_descuento: 13,
      precio_final: "39.99",
      stock: 15,
      is_active: true,
      is_featured: true,
      envio_gratis: true,
      tipo_flor: { id: 1, nombre: "Rosas", descripcion: "Flores tipo rosas", is_active: true },
      ocasiones: [
        { id: 1, nombre: "Amor", descripcion: "", is_active: true }
      ],
      imagen_principal: "/images/rosas-rojas.jpg",
      imagenes: []
    },
    {
      id: 2,
      nombre: "Arreglo de Tulipanes Amarillos",
      slug: "arreglo-tulipanes-amarillos",
      descripcion: "Hermoso arreglo de tulipanes amarillos",
      descripcion_corta: "Arreglo de tulipanes",
      categoria: { nombre: "Arreglos", slug: "arreglos", descripcion: "Arreglos florales", imagen: null },
      precio: "32.99",
      precio_descuento: null,
      porcentaje_descuento: 0,
      precio_final: "32.99",
      stock: 8,
      is_active: true,
      is_featured: false,
      envio_gratis: true,
      tipo_flor: { id: 4, nombre: "Tulipanes", descripcion: "Flores tulipanes", is_active: true },
      ocasiones: [
        { id: 2, nombre: "Cumpleaños", descripcion: "", is_active: true }
      ],
      imagen_principal: "/images/tulipanes-amarillos.jpg",
      imagenes: []
    },
    {
      id: 3,
      nombre: "Bouquet de Girasoles",
      slug: "bouquet-girasoles",
      descripcion: "Alegre bouquet de girasoles frescos",
      descripcion_corta: "Bouquet de girasoles",
      categoria: { nombre: "Bouquets", slug: "bouquets", descripcion: "Bouquets especiales", imagen: null },
      precio: "28.99",
      precio_descuento: "24.99",
      porcentaje_descuento: 14,
      precio_final: "24.99",
      stock: 12,
      is_active: true,
      is_featured: true,
      envio_gratis: false,
      tipo_flor: { id: 3, nombre: "Girasoles", descripcion: "Flores girasoles", is_active: true },
      ocasiones: [
        { id: 3, nombre: "Amistad", descripcion: "", is_active: true }
      ],
      imagen_principal: "/images/girasoles.jpg",
      imagenes: []
    }
  ];

interface ProductListProps {
  showRecommended?: boolean;
  showAdditionals?: boolean;
}

export default function ProductListFixed({ showRecommended = false, showAdditionals = false }: ProductListProps) {
  // Inicializar directamente con los productos mock
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(!showRecommended && !showAdditionals);

  console.log('🚀 ProductListFixed initialized with products:', products.length);

  const handleFiltersChange = (newFilters: any) => {
    console.log('🔄 Filters changed:', newFilters);
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
      </div>
    );
  }

  console.log('🎯 Rendering products:', products.length);

  return (
    <div className={styles.productList}>
      {showFilters && (
        <div className={styles.filters}>
          <ProductFilters onFiltersChange={handleFiltersChange} />
        </div>
      )}
      
      <div className={styles.productsGrid}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className={styles.noProducts}>
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
