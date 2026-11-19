"use client"

import { useSearchParams } from "next/navigation"
import { RechercheGaz } from "@/app/_components/recherche-gaz"

/**
 * Adaptateur utilisé uniquement par la landing page : il lit les critères
 * éventuellement renvoyés par la page de résultats (« Modifier ma recherche »)
 * pour pré-remplir le formulaire, puis active le mode redirection.
 */
export function RechercheGazLanding() {
  const params = useSearchParams()
  const rawFormat = params.get("format")

  return (
    <RechercheGaz
      key={params.toString()}
      redirectToResults
      initialBrand={params.get("brand") ?? ""}
      initialFormat={rawFormat === null ? "12,5 kg" : rawFormat}
      initialZone={params.get("zone") ?? ""}
    />
  )
}
