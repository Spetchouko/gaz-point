"use client"

import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { availabilityBadgeClass } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

export type ResultatRechercheCardProps = {
  id: string
  name: string
  district: string
  address: string
  brand: string | null
  format: string | null
  status: AvailabilityStatus | null | string
  disponibiliteId: string
  onReserver?: () => void
  onVoirDisponibilite?: () => void
  className?: string
}

export function ResultatRechercheCard({
  id,
  name,
  district,
  address,
  brand,
  format,
  status,
  disponibiliteId,
  onReserver,
  onVoirDisponibilite,
  className,
}: ResultatRechercheCardProps) {
  const router = useRouter()

  // Seuls deux libellés sont autorisés sur la carte : la donnée vendeur
  // "disponible" donne "Disponible", tout le reste reste "À confirmer".
  const statusKey: AvailabilityStatus =
    status === "disponible" ? "disponible" : "a_confirmer"
  const statusLabel = statusKey === "disponible" ? "Disponible" : "À confirmer"

  const localisation = [district, address]
    .filter((part) => Boolean(part && part.trim()))
    .join(" — ")

  const handleCardClick = () => {
    if (onVoirDisponibilite) {
      onVoirDisponibilite()
    } else {
      // Comportement historique sur la page d'accueil, sans fenêtre superposée.
      router.push(`/disponibilite/${disponibiliteId}`)
    }
  }

  const handleReserverClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (onReserver) {
      onReserver()
    } else {
      router.push(`/disponibilite/${disponibiliteId}`)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleCardClick()
    }
  }

  return (
    <Card
      key={id}
      role="button"
      tabIndex={0}
      aria-label={`Voir la disponibilité de ${name}`}
      className={cn(
        "border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="flex flex-col gap-2.5 p-4">
        {/* LIGNE 1 — nom du dépôt à gauche, statut à droite */}
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">
            {name}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 whitespace-nowrap",
              availabilityBadgeClass[statusKey],
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        {/* LIGNE 2 — marque à gauche, grammage à droite, uniquement si renseignés */}
        {(brand || format) && (
          <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium text-foreground">
              {brand ?? ""}
            </span>
            <span className="shrink-0 text-right text-muted-foreground">
              {format ?? ""}
            </span>
          </div>
        )}

        {/* LIGNE 3 — localisation avec icône de position */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            {localisation || "Localisation non renseignée"}
          </span>
        </div>

        <Separator className="my-0.5" />

        {/* Deux boutons horizontaux, de largeur égale, contenus dans la carte */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-full min-w-0 px-2 text-center text-xs leading-tight"
            onClick={(event) => {
              event.stopPropagation()
              handleCardClick()
            }}
          >
            Voir disponibilité
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-10 w-full min-w-0 px-2 text-center text-xs leading-tight"
            onClick={handleReserverClick}
          >
            Réserver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
