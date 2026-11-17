import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/a-propos',
        '/contact',
        '/services',
        '/devenir-vendeur',
        '/cgu',
        '/cgv',
        '/mentions-legales',
        '/politique-confidentialite',
        '/politique-cookies',
        '/inscription',
        '/connexion',
      ],
      disallow: [
        '/dashboard/',
        '/api/',
        '/auth/',
        '/_next/',
        '/inscription/vendeur/configuration',
        '/paiement/',
        '/mot-de-passe/',
        '/validation-email',
      ],
    },
    sitemap: 'https://www.gazpoints.com/sitemap.xml',
  }
}
