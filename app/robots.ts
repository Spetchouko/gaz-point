import { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/a-propos",
        "/contact",
        "/services",
        "/devenir-vendeur",
        "/cgu",
        "/cgv",
        "/politique-confidentialite",
        "/politique-cookies",
        "/mentions-legales",
      ],
      disallow: [
        "/admin",
        "/dashboard",
        "/api",
        "/_next",
        "/connexion",
        "/inscription",
        "/mot-de-passe-oublie",
        "/mot-de-passe-temporaire",
        "/paiement",
        "/validation-email",
        "/profil",
        "/mes-commandes",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
