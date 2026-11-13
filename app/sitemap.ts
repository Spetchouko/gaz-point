import { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

const publicPages = [
  "",
  "/a-propos",
  "/contact",
  "/services",
  "/devenir-vendeur",
  "/cgu",
  "/cgv",
  "/politique-confidentialite",
  "/politique-cookies",
  "/mentions-legales",
]

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }))
}
