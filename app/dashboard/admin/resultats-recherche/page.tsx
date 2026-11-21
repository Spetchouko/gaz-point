import { Suspense } from "react"
import { ResultatsRecherche } from "@/app/_components/resultats-recherche"

export default function AdminResultatsRecherchePage() {
  return (
    <Suspense fallback={null}>
      <ResultatsRecherche />
    </Suspense>
  )
}