/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },
  // Optimizaciones SEO y Performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        // Permite al optimizador de Next.js obtener las imágenes directamente
        // desde el servicio de backend de Django a través de la red interna de Docker.
        protocol: 'http',
        hostname: 'web',
        port: '8000',
        pathname: '/media/**',
      },
      {
        // Permite al navegador del cliente solicitar imágenes a través de localhost,
        // que es como accede al backend expuesto por Docker.
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        // Permite imágenes de localhost sin puerto (a través de Nginx)
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/media/**',
      },
      {
        // Permite imágenes de placeholder
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        // Permite cualquier imagen externa para desarrollo
        protocol: 'https',
        hostname: '**',
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
