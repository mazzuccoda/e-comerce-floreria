export default function TestMinimal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-3xl p-8 shadow-xl">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            🌸 Prueba Mínima - Estilos Funcionando
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Esta página no tiene dependencias externas ni Context.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-light text-gray-900 mb-4">Glassmorphism</h2>
              <p className="text-gray-600">Card con backdrop-blur-sm</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <h2 className="text-2xl font-light mb-4">Gradiente</h2>
              <p>Gradiente verde funcionando</p>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-4 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300 font-light text-lg">
              Botón con Gradiente y Hover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
