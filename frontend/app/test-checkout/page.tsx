'use client';

export default function TestCheckout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100/50 rounded-3xl p-8 shadow-xl">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            🌸 Página de Prueba - Checkout Rediseñado
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Esta es una página de prueba para verificar que los estilos se aplican correctamente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-light text-gray-900 mb-4">Card con Glassmorphism</h2>
              <p className="text-gray-600">Esta card tiene efectos de glassmorphism con backdrop-blur-sm</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <h2 className="text-2xl font-light mb-4">Gradiente Premium</h2>
              <p>Este es el gradiente que debería aparecer en el botón del checkout</p>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="group w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-6 px-8 rounded-2xl hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 font-light text-xl tracking-wide transform hover:scale-[1.02]">
              <div className="flex items-center justify-center space-x-3">
                <span>Botón de Prueba con Gradiente</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
