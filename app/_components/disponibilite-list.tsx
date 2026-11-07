"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DisponibiliteCard } from "@/app/_components/cards"

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {point.disponibilites.map((dispo) => (
        <DisponibiliteCard
          key={dispo.id}
          variant="vendor"
          id={dispo.id}
          pointId={point.id}
          pointName={point.name}
          format={dispo.format}
          brand={null}
          status={dispo.status}
          phone={dispo.phone}
          quantity={dispo.quantity}
          note={dispo.note}
          createdAt={dispo.createdAt}
          onEdit={() =>
            onEdit(dispo, point.id, point.name)
          }
          onToggleStatus={() =>
            onEdit(
              {
                ...dispo,
                status:
                  dispo.status === "disponible" ? "indisponible" : "disponible",
              },
              point.id,
              point.name
            )
          }
          onDelete={() =>
            onEdit(dispo, point.id, point.name)
          }
        />
      ))}
    </div>
  )
}
