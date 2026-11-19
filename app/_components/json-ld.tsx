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
            "https://www.gazpoints.com/services",
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "ISTAMA Sable",
            "addressLocality": "Bonamoussadi",
            "addressRegion": "Douala",
            "postalCode": "",
            "addressCountry": "CM",
          },
          "founder": "GazPoints SARL",
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
          "description": "Plateforme de recherche et de réservation de bouteilles de gaz domestique au Cameroun",
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
  datePublished,
  dateModified,
}: {
  name: string
  description: string
  url: string
  datePublished?: string
  dateModified?: string
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
          "author": {
            "@type": "Organization",
            "name": "GazPoints",
          },
          "datePublished": datePublished ?? new Date().toISOString(),
          "dateModified": dateModified ?? new Date().toISOString(),
        }),
      }}
    />
  )
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url,
          })),
        }),
      }}
    />
  )
}

export function FAQPageJsonLd({
  name,
  description,
  questions,
}: {
  name: string
  description: string
  questions: Array<{ question: string; answer: string }>
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "name": name,
          "description": description,
          "mainEntity": questions.map((q) => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer,
            },
          })),
        }),
      }}
    />
  )
}

export function LocalBusinessJsonLd({
  name,
  description,
  address,
  phone,
  areaServed,
  url,
}: {
  name: string
  description: string
  address: string
  phone: string
  areaServed: string
  url: string
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": name,
          "description": description,
          "url": url,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": address,
            "addressLocality": areaServed.split("/")[0],
            "addressRegion": areaServed.split("/")[1],
            "addressCountry": "CM",
          },
          "telephone": phone,
          "openingHoursSpecification": [],
        }),
      }}
    />
  )
}