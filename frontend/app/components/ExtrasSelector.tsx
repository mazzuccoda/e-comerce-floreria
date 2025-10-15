'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app/api';

interface ProductoAdicional {
  id: number;
  nombre: string;
  descripcion: string;
  descripcion_corta: string;
  precio: number;
  imagen_principal: string;
  stock_disponible: number;
}

interface ExtrasSelectorProps {
  selectedExtras: number[];
  onExtrasChange: (extras: number[]) => void;
}

export default function ExtrasSelector({ selectedExtras, onExtrasChange }: ExtrasSelectorProps) {
  const [productos, setProductos] = useState<ProductoAdicional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdicionales = async () => {
      try {
        const response = await fetch(`${API_URL}/catalogo/productos/adicionales/`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Productos adicionales cargados:', data);
          setProductos(data);
        }
      } catch (error) {
        console.error('❌ Error cargando productos adicionales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdicionales();
  }, []);

  const toggleExtra = (productoId: number) => {
    if (selectedExtras.includes(productoId)) {
      onExtrasChange(selectedExtras.filter(id => id !== productoId));
    } else {
      onExtrasChange([...selectedExtras, productoId]);
    }
  };

  const isSelected = (productoId: number) => selectedExtras.includes(productoId);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay productos adicionales disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-light mb-6">🎁 Extras Especiales</h2>
      <p className="text-gray-600 mb-6">Agrega productos adicionales para completar tu regalo</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {productos.map((producto) => (
          <div
            key={producto.id}
            className={`bg-white/30 rounded-xl p-6 transition-all duration-200 cursor-pointer ${
              isSelected(producto.id)
                ? 'ring-2 ring-green-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => toggleExtra(producto.id)}
          >
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected(producto.id)}
                onChange={() => toggleExtra(producto.id)}
                className="mr-4 mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{producto.nombre}</h3>
                    <p className="text-gray-600 text-sm">
                      {producto.descripcion_corta || producto.descripcion}
                    </p>
                  </div>
                  {producto.imagen_principal && (
                    <div className="relative w-20 h-20 ml-4 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={producto.imagen_principal}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-semibold text-lg">
                    +${producto.precio.toLocaleString('es-AR')}
                  </span>
                  {producto.stock_disponible < 5 && producto.stock_disponible > 0 && (
                    <span className="text-orange-600 text-sm">
                      ⚠️ Solo {producto.stock_disponible} disponibles
                    </span>
                  )}
                  {producto.stock_disponible === 0 && (
                    <span className="text-red-600 text-sm">
                      ❌ Sin stock
                    </span>
                  )}
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>

      {selectedExtras.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ {selectedExtras.length} extra{selectedExtras.length > 1 ? 's' : ''} seleccionado{selectedExtras.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
