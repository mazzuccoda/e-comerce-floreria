'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
}

export default function TestProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = 'https://e-comerce-floreria-production.up.railway.app/api/catalogo/productos/';
        console.log('🔍 Fetching from:', apiUrl);
        
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ Products loaded:', data);
        
        setProducts(data);
      } catch (err: any) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando productos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Test de Productos Disponibles</h1>
      
      <div className="mb-4 p-4 bg-blue-100 rounded">
        <p className="font-bold">Total de productos: {products.length}</p>
        <p>IDs disponibles: {products.map(p => p.id).join(', ')}</p>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg bg-white shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-bold">ID: {product.id}</h2>
                <p className="text-lg">{product.nombre}</p>
                <p className="text-gray-600">Precio: ${product.precio}</p>
                <p className="text-gray-600">Stock: {product.stock}</p>
              </div>
              <Link 
                href={`/productos/${product.id}`}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Ver detalle
              </Link>
            </div>
            
            <div className="mt-2 text-sm">
              <a 
                href={`https://e-comerce-floreria-production.up.railway.app/api/catalogo/productos/${product.id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🔗 Ver JSON del backend
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/productos" className="text-blue-600 hover:underline">
          ← Volver a productos
        </Link>
      </div>
    </div>
  );
}
