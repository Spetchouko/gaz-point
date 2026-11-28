import { Suspense } from "react"
import type { Metadata } from "next"
import { ResultatsRecherchePublique } from "@/app/_components/resultats-recherche-publique"

export const metadata: Metadata = {
  title: "Résultats de votre recherche | GazPoints",
  description:
    "Consultez les points de vente correspondant à votre recherche de bouteille de gaz et leur disponibilité en direct.",
}

export const dynamic = "force-dynamic"

export default function RecherchePubliquePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Chargement des résultats…
        </div>
      }
    >
      <ResultatsRecherchePublique />
    </Suspense>
  )
}