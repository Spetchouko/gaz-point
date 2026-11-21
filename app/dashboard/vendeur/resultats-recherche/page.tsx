import { Suspense } from "react"
import { ResultatsRecherche } from "@/app/_components/resultats-recherche"

export default function VendeurResultatsRecherchePage() {
  return (
    <Suspense fallback={null}>
      <ResultatsRecherche />
    </Suspense>
  )
}