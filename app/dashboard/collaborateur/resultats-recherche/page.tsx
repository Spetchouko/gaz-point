import { Suspense } from "react"
import { ResultatsRecherche } from "@/app/_components/resultats-recherche"

export default function CollaborateurResultatsRecherchePage() {
  return (
    <Suspense fallback={null}>
      <ResultatsRecherche />
    </Suspense>
  )
}