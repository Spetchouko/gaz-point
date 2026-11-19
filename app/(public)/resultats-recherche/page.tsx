import { Suspense } from "react"
import type { Metadata } from "next"
import { ResultatsRecherche } from "@/app/_components/resultats-recherche"

export const metadata: Metadata = {
  title: "Résultats de votre recherche | GazPoints",
  description:
    "Consultez les points de vente correspondant à votre recherche de bouteille de gaz et leur disponibilité en direct.",
}

export default function ResultatsRecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 text-sm text-muted-foreground">
          Chargement des résultats…
        </div>
      }
    >
      <ResultatsRecherche />
    </Suspense>
  )
}
