"use client"

import { useRouter } from "next/navigation"
import { Heart, MapPin, Phone, Signal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { disponibilite } from "@/db/schema"
import { toggleFavori } from "@/app/mes-favoris/actions"
import {
  availabilityBadgeClass,
  availabilityLabel,
  effectiveStatus,
  formatDateTime,
  isStale,
  sourceLabel,
} from "@/lib/gaz"
import { PointDeVenteCard } from "@/app/_components/cards"
import type { AvailabilityStatus } from "@/db/schema"

type ReportRow = typeof disponibilite.$inferSelect

export type PointFavori = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  isFavorite: boolean
  report: ReportRow | null
}

export function MesFavoris({
  points,
  pro = false,
}: {
  points: PointFavori[]
  pro?: boolean
}) {
  const router = useRouter()
  const favorites = points.filter((point) => point.isFavorite)
  const others = points.filter((point) => !point.isFavorite)

  const getStatus = (report: ReportRow | null): AvailabilityStatus | null => {
    if (!report) return null
    return effectiveStatus(report.status, report.createdAt) as AvailabilityStatus | null
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Points de vente favoris
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tes dépôts préférés, avec la disponibilité datée du gaz.
        </p>
      </header>

      <section aria-labelledby="favoris-title">
        <h2 id="favoris-title" className="text-xl font-semibold tracking-tight">
          Mes favoris{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({favorites.length})
          </span>
        </h2>

        {favorites.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="size-6 text-primary" aria-hidden />
              </span>
              <p className="font-medium">Aucun favori pour l’instant</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ajoute des dépôts depuis la liste ci-dessous pour les retrouver
                d’un coup d’œil.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((point) => (
              <PointDeVenteCard
                key={point.id}
                variant="client"
                id={point.id}
                name={point.name}
                district={point.district}
                address={point.address}
                phone={point.phone}
                isFavorite={point.isFavorite}
                onToggleFavorite={async () => {
                  await toggleFavori(point.id)
                  router.refresh()
                }}
                disposCount={point.report ? 1 : 0}
                status={getStatus(point.report)}
              />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <section aria-labelledby="tout-title" className="mt-12">
            <h2 id="tout-title" className="text-xl font-semibold tracking-tight">
              Tous les points de vente
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((point) => (
                <PointDeVenteCard
                  key={point.id}
                  variant="client"
                  id={point.id}
                  name={point.name}
                  district={point.district}
                  address={point.address}
                  phone={point.phone}
                  isFavorite={point.isFavorite}
                  onToggleFavorite={async () => {
                    await toggleFavori(point.id)
                    router.refresh()
                  }}
                  disposCount={point.report ? 1 : 0}
                  status={getStatus(point.report)}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </>
  )
}
