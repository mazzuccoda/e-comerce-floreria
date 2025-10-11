'use client';

export default function ProductosTestPage() {
  console.log('🎯 ProductosTestPage - RENDERIZANDO');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🌸 PRODUCTOS TEST - FUNCIONANDO
        </h1>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
          <strong>✅ Éxito!</strong> Esta página se está renderizando correctamente sin bucles de recarga.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-48 bg-red-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-red-800 font-semibold">🌹 Imagen</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ramo de 12 Rosas Rojas</h3>
            <p className="text-gray-600 mb-4">Hermoso ramo de 12 rosas rojas frescas</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">$39.99</span>
                <span className="text-sm text-gray-500 line-through ml-2">$45.99</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-48 bg-yellow-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-yellow-800 font-semibold">🌻 Imagen</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bouquet de Girasoles</h3>
            <p className="text-gray-600 mb-4">Alegre bouquet de girasoles frescos</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">$29.99</span>
                <span className="text-sm text-gray-500 line-through ml-2">$35.50</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-48 bg-purple-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-purple-800 font-semibold">🌺 Imagen</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Arreglo Floral Mixto</h3>
            <p className="text-gray-600 mb-4">Hermoso arreglo con flores variadas</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">$65.00</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">🎯 Estado del Diagnóstico</h2>
          <ul className="space-y-2 text-blue-800">
            <li>✅ Página se renderiza sin bucles de recarga</li>
            <li>✅ Componentes React funcionando correctamente</li>
            <li>✅ Tailwind CSS aplicándose correctamente</li>
            <li>✅ Productos mock mostrándose visualmente</li>
            <li>🔄 Siguiente: Integrar con ProductCard y ProductFilters</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
