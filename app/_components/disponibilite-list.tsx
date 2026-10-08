"use client"

import { MapPin, PencilLine, Phone, RotateCcw, Trash2, Plus, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { formatDate } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

type PointWithDispos = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  disponibilites: {
    id: string
    format: string | null
    status: string
    phone: string | null
    quantity: number | null
    note: string | null
    createdAt: string | Date
  }[]
}

export function DisponibiliteList({
  point,
  onEdit,
  onAdd,
}: {
  point: PointWithDispos
  onEdit: (
    dispo: PointWithDispos["disponibilites"][0],
    pointId: string,
    pointName: string
  ) => void
  onAdd: () => void
}) {
  if (point.disponibilites.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune disponibilité enregistrée pour ce dépôt.
        </p>
        <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
          <Plus className="size-4" />
          Ajouter la première disponibilité
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {point.disponibilites.map((dispo) => (
        <div
          key={dispo.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-sm font-medium">{dispo.format ?? "—"}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {dispo.format ?? "Format non défini"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(dispo.createdAt)}
                  {dispo.quantity !== null && (
                    <> · {dispo.quantity} bouteille{dispo.quantity > 1 ? "s" : ""}</>
                  )}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`${availabilityBadgeClass[dispo.status as AvailabilityStatus]} shrink-0`}
            >
              {availabilityLabel[dispo.status as AvailabilityStatus]}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {dispo.note && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 flex-1 sm:flex-none">
                <MapPin className="size-3" />
                {dispo.note}
              </span>
            )}
            {dispo.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />
                {dispo.phone}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onEdit(dispo, point.id, point.name)}
            >
              <PencilLine className="size-3.5" />
              Modifier
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onEdit(
                { ...dispo, status: dispo.status === "disponible" ? "indisponible" : "disponible" },
                point.id,
                point.name
              )}
            >
              <RotateCcw className="size-3.5" />
              {dispo.status === "disponible" ? "Indisponible" : "Disponible"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onEdit(dispo, point.id, point.name)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}