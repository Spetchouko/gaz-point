"use client"

import { useTranslation } from "@/lib/i18n"

export function OrganizationJsonLd() {
  const t = useTranslation()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "GazPoints",
          "url": "https://www.gazpoints.com",
          "logo": "https://www.gazpoints.com/brand/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+237672072550",
            "contactType": "customer service",
            "availableLanguage": ["fr", "en"],
            "areaServed": "CM",
          },
          "sameAs": [
            "https://www.gazpoints.com/a-propos",
            "https://www.gazpoints.com/contact",
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "ISTAMA Sable",
            "addressLocality": "Bonamoussadi",
            "addressRegion": "Douala",
            "postalCode": "",
            "addressCountry": "CM",
          },
        }),
      }}
    />
  )
}

export function WebsiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "GazPoints",
          "url": "https://www.gazpoints.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.gazpoints.com/?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  )
}

export function WebPageJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": name,
          "description": description,
          "url": url,
          "inLanguage": "fr-FR",
          "isPartOf": {
            "@type": "WebSite",
            "name": "GazPoints",
            "url": "https://www.gazpoints.com",
          },
        }),
      }}
    />
  )
}
