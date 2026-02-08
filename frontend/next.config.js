/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Configuración de CORS para desarrollo
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  reactStrictMode: true,
  images: {
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
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'e-comerce-floreria-production.up.railway.app',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dmxc6odsi/**',
      },
    ],
  },
  async rewrites() {
    // Usar la URL del backend desde variable de entorno
    // En Railway: NEXT_PUBLIC_API_URL=https://e-comerce-floreria-production.up.railway.app
    // En Docker local: BACKEND_URL=http://web:8000
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'https://e-comerce-floreria-production.up.railway.app';
    // Remover /api del final si existe para evitar duplicación /api/api/
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
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
        source: '/api/usuarios/solicitar-reset-password',
        destination: `${backendUrl}/api/usuarios/solicitar-reset-password/`,
      },
      {
        source: '/api/usuarios/solicitar-reset-password/',
        destination: `${backendUrl}/api/usuarios/solicitar-reset-password/`,
      },
      {
        source: '/api/usuarios/:path*',
        destination: `${backendUrl}/api/usuarios/:path*`,
      },
      {
        source: '/api/pedidos/:path*',
        destination: `${backendUrl}/api/pedidos/:path*`,
      }
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(jpg|jpeg|png|gif|svg)$/,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = nextConfig;
