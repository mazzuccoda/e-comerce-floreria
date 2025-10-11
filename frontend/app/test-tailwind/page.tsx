'use client';

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extralight text-gray-900 mb-8 text-center">
          Test Tailwind CSS
        </h1>
        
        {/* Test glassmorphism */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl shadow-gray-900/5 border border-white/20 mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4">Glassmorphism Test</h2>
          <p className="text-gray-600">Si ves este card con fondo translúcido y blur, Tailwind funciona.</p>
        </div>

        {/* Test gradients */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white p-6 rounded-2xl mb-8">
          <h3 className="text-xl font-light">Gradient Test</h3>
          <p>Si ves gradiente verde, los gradientes funcionan.</p>
        </div>

        {/* Test animations */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Animation Test</h3>
          <p className="text-gray-600">Pasa el mouse por encima para ver animaciones.</p>
        </div>

        {/* Test backdrop blur */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl"></div>
          <div className="relative bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Backdrop Blur Test</h3>
            <p className="text-gray-700">Si ves blur sobre el fondo colorido, backdrop-blur funciona.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
