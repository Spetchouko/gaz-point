"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Heart, MapPin, Phone, Signal, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { disponibilite } from "@/db/schema"
import { toggleFavori, type ToggleFavoriResult } from "@/app/mes-favoris/actions"
import {
  availabilityBadgeClass,
  availabilityLabel,
  effectiveStatus,
  formatDateTime,
  isStale,
} from "@/lib/gaz"
import { PointDeVenteCard } from "@/app/_components/cards"
import type { AvailabilityStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

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

type ViewState = "idle" | "loading" | "error"

export function MesFavoris({
  points,
  pro = false,
}: {
  points: PointFavori[]
  pro?: boolean
}) {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  const favorites = points.filter((point) => point.isFavorite)
  const others = points.filter((point) => !point.isFavorite)

  const getStatus = (report: ReportRow | null): AvailabilityStatus | null => {
    if (!report) return null
    return effectiveStatus(report.status, report.createdAt) as AvailabilityStatus | null
  }

  // Recharger les données après une action toggle
  useEffect(() => {
    // L'effet est déclenché quand router.refresh() est appelé par l'action
  }, [router])

  const clearFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 3000)
  }, [])

  const handleToggleFavorite = async (pointId: string) => {
    setErrorMessage(null)
    setFeedback(null)
    setToggling((prev) => new Set(prev).add(pointId))

    try {
      const result: ToggleFavoriResult = await toggleFavori(pointId)

      if (!result.ok) {
        setErrorMessage(result.error || "Impossible de mettre à jour les favoris.")
        setViewState("error")
        setToggling((prev) => {
          const next = new Set(prev)
          next.delete(pointId)
          return next
        })
        return
      }

      // Recharger la page pour refléter le nouvel état
      setToggling((prev) => {
        const next = new Set(prev)
        next.delete(pointId)
        return next
      })
      await router.refresh()

      setFeedback({
        ok: true,
        message: result.isFavorite
          ? "Ajouté aux favoris."
          : "Retiré des favoris.",
      })
      clearFeedback()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inconnue."
      )
      setViewState("error")
      setToggling((prev) => {
        const next = new Set(prev)
        next.delete(pointId)
        return next
      })
    }
  }

  const handleRetry = () => {
    setErrorMessage(null)
    setViewState("idle")
    router.refresh()
  }

  if (viewState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="size-8 text-primary animate-spin mb-3" />
        <p className="text-muted-foreground">Chargement de vos favoris…</p>
      </div>
    )
  }

  if (viewState === "error") {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="size-8 text-destructive mb-3" />
          <h3 className="font-medium text-destructive mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage || "Une erreur est survenue."}
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={handleRetry}
            className="flex-1 sm:flex-none"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {feedback && (
        <div
          role="status"
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium",
            feedback.ok
              ? "bg-success/10 border-success/20 text-success"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          {feedback.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

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
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="size-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                Aucun favori pour l’instant
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Découvre les points de vente depuis la recherche et ajoute-les à
                tes favoris pour les retrouver d’un coup d’œil.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  router.push("/")
                }}
              >
                Découvrir les points de vente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  await handleToggleFavorite(point.id)
                }}
                isPending={toggling.has(point.id)}
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
                    await handleToggleFavorite(point.id)
                  }}
                  isPending={toggling.has(point.id)}
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
