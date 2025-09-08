import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://floreria-cristina.com'
  
  // URLs estáticas principales
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/carrito`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ayuda`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/zonas`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]

  // TODO: En producción, agregar URLs dinámicas de productos
  // const productUrls = await getProductUrls()
  
  return staticUrls
}

// Función para obtener URLs de productos (implementar cuando sea necesario)
async function getProductUrls() {
  try {
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/catalogo/productos/`)
    // const products = await response.json()
    
    // return products.results?.map((product: any) => ({
    //   url: `https://floreria-cristina.com/productos/${product.slug}`,
    //   lastModified: new Date(product.updated_at || product.created_at),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.8,
    // })) || []
    
    return []
  } catch (error) {
    console.error('Error fetching product URLs for sitemap:', error)
    return []
  }
}
