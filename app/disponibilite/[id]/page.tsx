import { Suspense } from "react"
import type { Metadata } from "next"
import DisponibiliteDetail from "./components/disponibilite-detail"

export const metadata: Metadata = {
  title: "Détail de la disponibilité | GazPoints",
  description:
    "Consultez les détails d'une disponibilité de gaz et réservez une bouteille.",
}

export const dynamic = "force-dynamic"

export default async function DisponibiliteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Chargement des détails…
        </div>
      }
    >
      <DisponibiliteDetail id={id} />
    </Suspense>
  )
}
