'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  nombre: string;
}

interface TipoFlor {
  id: number;
  nombre: string;
}

interface AddProductFormProps {
  onProductAdded: () => void;
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tiposFlor, setTiposFlor] = useState<TipoFlor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    descripcion_corta: '',
    precio: '',
    stock: '',
    categoria: '',
    tipo: '',
    sku: '',
    is_active: true,
    is_featured: false,
    porcentaje_descuento: '0'
  });

  const getApiUrl = () => {
    if (typeof window === 'undefined') {
      return 'http://web:8000';
    }
    return 'http://localhost:8000';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tiposRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/catalogo/categorias/`),
          fetch(`${getApiUrl()}/api/catalogo/tipos-flor/`)
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.results || categoriesData);
        }

        if (tiposRes.ok) {
          const tiposData = await tiposRes.json();
          setTiposFlor(tiposData.results || tiposData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PROD-${timestamp}-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: parseInt(formData.categoria),
        tipo: parseInt(formData.tipo),
        porcentaje_descuento: parseFloat(formData.porcentaje_descuento),
        sku: formData.sku || generateSKU()
      };

      const response = await fetch(`${getApiUrl()}/api/catalogo/productos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setSuccess('¡Producto agregado exitosamente!');
        setFormData({
          nombre: '',
          descripcion: '',
          descripcion_corta: '',
          precio: '',
          stock: '',
          categoria: '',
          tipo: '',
          sku: '',
          is_active: true,
          is_featured: false,
          porcentaje_descuento: '0'
        });
        onProductAdded();
      } else {
        const errorData = await response.json();
        setError(`Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Error al agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Agregar Nuevo Producto
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                value={formData.nombre}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
                placeholder="Ej: Ramo de Rosas Rojas"
              />
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU (opcional)
              </label>
              <input
                type="text"
                name="sku"
                id="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
                placeholder="Se generará automáticamente si se deja vacío"
              />
            </div>

            {/* Precio */}
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
                Precio *
              </label>
              <input
                type="number"
                name="precio"
                id="precio"
                required
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
                placeholder="25000.00"
              />
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                id="stock"
                required
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
                placeholder="10"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                Categoría *
              </label>
              <select
                name="categoria"
                id="categoria"
                required
                value={formData.categoria}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Flor */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                Tipo de Flor *
              </label>
              <select
                name="tipo"
                id="tipo"
                required
                value={formData.tipo}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
              >
                <option value="">Seleccionar tipo</option>
                {tiposFlor.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Porcentaje de Descuento */}
            <div>
              <label htmlFor="porcentaje_descuento" className="block text-sm font-medium text-gray-700">
                Descuento (%)
              </label>
              <input
                type="number"
                name="porcentaje_descuento"
                id="porcentaje_descuento"
                min="0"
                max="100"
                step="0.01"
                value={formData.porcentaje_descuento}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Descripción Corta */}
          <div>
            <label htmlFor="descripcion_corta" className="block text-sm font-medium text-gray-700">
              Descripción Corta
            </label>
            <input
              type="text"
              name="descripcion_corta"
              id="descripcion_corta"
              value={formData.descripcion_corta}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
              placeholder="Breve descripción del producto"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción Completa
            </label>
            <textarea
              name="descripcion"
              id="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600 sm:text-sm"
              placeholder="Descripción detallada del producto..."
            />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Producto activo
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="is_featured"
                name="is_featured"
                type="checkbox"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                Producto destacado
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Agregando...
                </>
              ) : (
                'Agregar Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
