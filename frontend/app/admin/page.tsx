'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddProductForm from './components/AddProductForm';

interface Product {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  categoria: {
    id: number;
    nombre: string;
  };
  is_active: boolean;
  is_featured: boolean;
  sku: string;
}

interface Category {
  id: number;
  nombre: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Configuración dinámica de API URL
  const getApiUrl = () => {
    if (typeof window === 'undefined') {
      return 'http://web:8000';
    }
    return 'http://localhost:8000';
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/catalogo/productos/`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error cargando productos');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/catalogo/categorias/`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Error cargando categorías');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/catalogo/productos/${productId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        setError('Error actualizando producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error actualizando producto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🌸 Admin - Florería Cristina
              </h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
            >
              Ver Tienda
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Productos ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categorías ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('add-product')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-product'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ➕ Agregar Producto
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Gestión de Productos
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Lista de todos los productos en el catálogo
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-medium">
                            {product.nombre.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {product.nombre}
                          </p>
                          {product.is_featured && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Destacado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku} | Categoría: {product.categoria?.nombre} | Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-semibold text-green-600">
                        ${parseFloat(product.precio).toLocaleString()}
                      </span>
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Gestión de Categorías
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Lista de todas las categorías disponibles
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {categories.map((category) => (
                <li key={category.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {category.nombre.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {category.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {category.id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add Product Tab */}
        {activeTab === 'add-product' && (
          <AddProductForm onProductAdded={fetchProducts} />
        )}
      </main>
    </div>
  );
}
