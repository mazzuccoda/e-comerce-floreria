import { MetadataRoute } from 'next'
import { getProducts, productPath, SITE_URL } from '@/utils/catalog'
import { landingPath, SEO_LANDINGS } from '@/utils/seoLandings'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `${SITE_URL}/es`

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dia-de-la-madre`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ayuda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/zonas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const productos = await getProducts()

  const productUrls: MetadataRoute.Sitemap = productos.map((producto) => ({
    url: `${baseUrl}${productPath(producto)}`,
    lastModified: producto.updated_at ? new Date(producto.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Las intenciones prioritarias tienen URL propia. Los filtros del catálogo
  // (`/productos?categoria=...`) no se publican: su canonical apunta a la
  // landing equivalente o al catálogo completo.
  const landingUrls: MetadataRoute.Sitemap = SEO_LANDINGS.map((landing) => ({
    url: `${baseUrl}${landingPath(landing)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticUrls, ...landingUrls, ...productUrls]
}
