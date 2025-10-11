'use client';

export default function ProductListMinimal() {
  console.log('🔥 ProductListMinimal - RENDERIZANDO');

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">🎯 COMPONENTE MINIMAL FUNCIONANDO</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Ramo de Rosas</h3>
          <p className="text-gray-600">$45.99</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            Agregar al Carrito
          </button>
        </div>
        
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Arreglo Floral</h3>
          <p className="text-gray-600">$65.00</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            Agregar al Carrito
          </button>
        </div>
        
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Bouquet de Girasoles</h3>
          <p className="text-gray-600">$35.50</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            Agregar al Carrito
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-green-100 rounded">
        <p className="text-green-800 font-semibold">
          ✅ Si ves este mensaje, el componente se está renderizando correctamente
        </p>
      </div>
    </div>
  );
}
