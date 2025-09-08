import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Florería Cristina - Flores a Domicilio',
    short_name: 'Florería Cristina',
    description: 'Florería y vivero especializado en ramos de flores frescas, plantas y arreglos florales. Entrega a domicilio.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbf0',
    theme_color: '#e91e63',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    lang: 'es-AR',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
