"use client"

import Link from "next/link"
import { MapPin, Store, Phone, Plus, Heart, PencilLine, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

export type PointDeVenteCardProps = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  vendorName?: string | null
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onManageDispos?: () => void
  disposCount?: number
  status?: AvailabilityStatus | null
  isActive?: boolean | null
  isPending?: boolean
  className?: string
  variant?: "client" | "vendor"
}

export function PointDeVenteCard({
  id,
  name,
  district,
  address,
  phone,
  vendorName,
  isFavorite = false,
  onToggleFavorite,
  onView,
  onEdit,
  onDelete,
  onManageDispos,
  disposCount,
  status,
  isActive,
  isPending,
  className,
  variant = "client",
}: PointDeVenteCardProps) {
  const isClientVariant = variant === "client"

  return (
    <Card
      key={id}
      className={cn(
        "border border-border bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
        "group",
        className
      )}
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 pb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <Store className="size-4 text-primary" aria-hidden />
            {name}
          </CardTitle>
          <CardDescription className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {district} — {address}
          </CardDescription>
          {vendorName && (
            <p className="text-xs text-muted-foreground">
              {vendorName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status && (
            <Badge
              variant="outline"
              className={cn(
                availabilityBadgeClass[status],
                "shrink-0 whitespace-nowrap"
              )}
            >
              {availabilityLabel[status]}
            </Badge>
          )}

          {isClientVariant && onToggleFavorite && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onToggleFavorite}
              disabled={isPending}
              aria-label={
                isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
              }
            >
              <Heart
                className={cn(
                  "size-4",
                  isFavorite ? "fill-current text-destructive" : "text-muted-foreground"
                )}
                aria-hidden
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quartier
            </p>
            <p className="font-medium text-foreground truncate">{district}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Adresse
            </p>
            <p className="font-medium text-foreground truncate">{address}</p>
          </div>
          {phone && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Téléphone
              </p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {phone}
              </p>
            </div>
          )}
          {disposCount !== undefined && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Disponibilités
              </p>
                <p className="font-medium text-foreground">{disposCount}</p>
              </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} className="flex-1 sm:flex-none gap-2">
              <Plus className="size-3.5" /> Consulter
            </Button>
          )}
          {onManageDispos && (
            <Button variant="outline" size="sm" onClick={onManageDispos} className="flex-1 sm:flex-none gap-2">
              <Plus className="size-3.5" /> Gérer les disponibilités
            </Button>
          )}
          {variant === "vendor" && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none gap-2">
              <PencilLine className="size-3.5" /> Modifier
            </Button>
          )}
          {variant === "vendor" && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1 sm:flex-none gap-2">
              <Trash2 className="size-3.5" /> Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
