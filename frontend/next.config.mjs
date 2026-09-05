/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Select backend target: env BACKEND_URL > web:8000 (Docker default)
    const backendUrl = process.env.BACKEND_URL || 'http://web:8000';
    console.log('🔧 Using backend URL (rewrites):', backendUrl);
    
    return [
      // Rutas específicas con trailing slash
      {
        source: '/api/catalogo/productos/',
        destination: `${backendUrl}/api/catalogo/productos/`,
      },
      {
        source: '/api/carrito/simple/',
        destination: `${backendUrl}/api/carrito/simple/`,
      },
      // Evita que las URLs con ID numérico entren en bucle de redirecciones
      {
        source: '/api/catalogo/productos/:id(\\d+)/',
        destination: `${backendUrl}/api/catalogo/productos/:id/`,
      },
      // Rutas generales
      {
        source: '/api/carrito/:path*',
        destination: `${backendUrl}/api/carrito/:path*`,
      },
      {
        source: '/api/catalogo/:path*',
        destination: `${backendUrl}/api/catalogo/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
      {
        source: '/api/usuarios/:path*',
        destination: `${backendUrl}/api/usuarios/:path*`,
      },
      {
        source: '/api/pedidos/:path*',
        destination: `${backendUrl}/api/pedidos/:path*`,
      },
    ];
  },
  compiler: {
    // En producción sólo sobreviven console.error y console.warn
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Optimizaciones SEO y Performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,
  images: {
    unoptimized: false, // ✅ Activar optimización de imágenes
    formats: ['image/webp', 'image/avif'], // Formatos modernos para mejor compresión
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tamaños responsive
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tamaños de thumbnails
    minimumCacheTTL: 60, // Cache de 60 segundos
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'web',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dmxc6odsi/**', // ✅ Cloudinary para producción
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  // Configuración para hacer que el hot-reloading funcione de manera estable en Docker
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // Revisa cambios cada segundo
      aggregateTimeout: 300, // Espera 300ms para reconstruir después de un cambio
    };
    return config;
  },
};

export default nextConfig;
