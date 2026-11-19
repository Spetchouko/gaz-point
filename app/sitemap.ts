import type { SitemapUrl, SitemapParams } from "next"
import { Locale } from "next-i18next"

const baseUrl = "https://www.gazpoints.com"

const staticUrls: SitemapUrl[] = [
  {
    url: baseUrl,
    changeFrequency: "daily" as const,
    priority: 1.0,
  },
  {
    url: `${baseUrl}/a-propos`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    url: `${baseUrl}/services`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    url: `${baseUrl}/contact`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: `${baseUrl}/cgu`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: `${baseUrl}/cgv`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: `${baseUrl}/mentions-legales`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: `${baseUrl}/devenir-vendeur`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  },
  {
    url: `${baseUrl}/politique-confidentialite`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: `${baseUrl}/politique-cookies`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
]

// Generate URLs for public pages
function generatePublicUrls(): SitemapUrl[] {
  const pages = [
    "/a-propos",
    "/services",
    "/contact",
    "/cgu",
    "/cgv",
    "/mentions-legales",
    "/devenir-vendeur",
    "/politique-confidentialite",
    "/politique-cookies",
  ]

  return pages.map((url) => ({
    url: `${baseUrl}${url}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))
}

// Generate sitemap with both static and generated URLs
export default function sitemap(): SitemapUrl[] {
  return [...staticUrls, ...generatePublicUrls()]
}