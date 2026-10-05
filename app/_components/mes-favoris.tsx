"use client"

import { useTransition } from "react"
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
import { DashboardNav } from "@/app/_components/dashboard-nav"
import {
  availabilityBadgeClass,
  availabilityLabel,
  effectiveStatus,
  formatDateTime,
  isStale,
  sourceLabel,
} from "@/lib/gaz"

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
  const favorites = points.filter((point) => point.isFavorite)
  const others = points.filter((point) => !point.isFavorite)

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro={pro} />

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
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {favorites.map((point) => (
                <CartePoint key={point.id} point={point} />
              ))}
            </div>
          )}
        </section>

        {others.length > 0 && (
          <section aria-labelledby="tout-title" className="mt-12">
            <h2 id="tout-title" className="text-xl font-semibold tracking-tight">
              Tous les points de vente
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {others.map((point) => (
                <CartePoint key={point.id} point={point} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function CartePoint({ point }: { point: PointFavori }) {
  const [pending, startTransition] = useTransition()

  const status = point.report
    ? effectiveStatus(point.report.status, point.report.createdAt)
    : null
  const stale = point.report ? isStale(point.report.createdAt) : false

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{point.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {point.address} — {point.district}
            </CardDescription>
          </div>
          {status && (
            <Badge
              variant="outline"
              className={availabilityBadgeClass[status]}
            >
              {availabilityLabel[status]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {point.report ? (
            <>
              <p className="flex items-start gap-1.5">
                <Signal className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Mise à jour le {formatDateTime(point.report.createdAt)} par{" "}
                  {point.report.reportedByName} (
                  {sourceLabel[point.report.source as keyof typeof sourceLabel]})
                </span>
              </p>
              {stale && (
                <p className="text-xs text-amber-600">
                  Non actualisé depuis plus de 24 h : statut affiché « à
                  confirmer ».
                </p>
              )}
            </>
          ) : (
            <p>Aucun signalement de disponibilité pour ce dépôt.</p>
          )}

          {point.phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              <a
                href={`tel:${point.phone.replace(/\s/g, "")}`}
                className="transition-colors hover:text-foreground"
              >
                {point.phone}
              </a>
            </p>
          )}
        </div>

        <div className="mt-auto pt-1">
          <Button
            variant={point.isFavorite ? "outline" : "default"}
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => toggleFavori(point.id))}
            className="w-full gap-2"
          >
            <Heart
              className={point.isFavorite ? "size-4 fill-current" : "size-4"}
              aria-hidden
            />
            {point.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
