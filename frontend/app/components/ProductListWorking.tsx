'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/Product';

// Productos mock simplificados
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
    stock: 25,
    is_active: true,
    is_featured: true,
    envio_gratis: true,
    tipo_flor: { id: 1, nombre: "Rosas", descripcion: "Flores tipo rosas", is_active: true },
    ocasiones: [
      { id: 1, nombre: "Amor", descripcion: "", is_active: true },
      { id: 4, nombre: "San Valentín", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/rosas-rojas.jpg",
    imagenes: []
  },
  {
    id: 2,
    nombre: "Arreglo Floral Mixto",
    slug: "arreglo-floral-mixto",
    descripcion: "Hermoso arreglo con flores variadas de temporada",
    descripcion_corta: "Arreglo floral mixto",
    categoria: { nombre: "Arreglos", slug: "arreglos", descripcion: "Arreglos florales", imagen: null },
    precio: "65.00",
    precio_descuento: null,
    porcentaje_descuento: null,
    precio_final: "65.00",
    stock: 15,
    is_active: true,
    is_featured: false,
    envio_gratis: false,
    tipo_flor: { id: 2, nombre: "Mixto", descripcion: "Flores mixtas", is_active: true },
    ocasiones: [
      { id: 2, nombre: "Cumpleaños", descripcion: "", is_active: true },
      { id: 5, nombre: "Felicitaciones", descripcion: "", is_active: true }
    ],
    imagen_principal: "/images/arreglo-mixto.jpg",
    imagenes: []
  },
  {
    id: 3,
    nombre: "Bouquet de Girasoles",
    slug: "bouquet-girasoles",
    descripcion: "Alegre bouquet de girasoles frescos",
    descripcion_corta: "Bouquet de girasoles",
    categoria: { nombre: "Bouquets", slug: "bouquets", descripcion: "Bouquets especiales", imagen: null },
    precio: "35.50",
    precio_descuento: "29.99",
    porcentaje_descuento: 15,
    precio_final: "29.99",
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

export default function ProductListWorking() {
  console.log('🎯 ProductListWorking - INICIANDO con', mockProducts.length, 'productos');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ✅ PRODUCTOS FUNCIONANDO
        </h1>
        <p className="text-gray-600">
          Mostrando {mockProducts.length} productos mock
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockProducts.map((product) => {
          console.log('🌸 Renderizando producto:', product.nombre);
          return (
            <ProductCard
              key={product.id}
              product={product}
            />
          );
        })}
      </div>

      {mockProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay productos disponibles</p>
        </div>
      )}
    </div>
  );
}
