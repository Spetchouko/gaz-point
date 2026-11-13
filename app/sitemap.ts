import { MetadataRoute } from 'next'

const baseUrl = 'https://www.gazpoints.com'

const publicPages = [
  '',
  '/a-propos',
  '/contact',
  '/services',
  '/devenir-vendeur',
  '/cgu',
  '/cgv',
  '/mentions-legales',
  '/politique-confidentialite',
  '/politique-cookies',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '' ? 'daily' : 'weekly',
    priority: page === '' ? 1 : 0.7,
  }))
}
