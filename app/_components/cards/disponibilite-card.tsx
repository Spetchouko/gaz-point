"use client"

import { MapPin, Phone, PencilLine, RotateCcw, Trash2 } from "lucide-react"
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
import { formatDate } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

export type DisponibiliteCardProps = {
  id: string
  pointId: string
  pointName: string
  pointDistrict?: string | null
  format: string | null
  brand: string | null
  status: AvailabilityStatus | null | string
  phone: string | null
  quantity: number | null
  note: string | null
  createdAt: string | Date
  onEdit?: () => void
  onToggleStatus?: () => void
  onDelete?: () => void
  className?: string
  variant?: "vendor" | "search"
}

export function DisponibiliteCard({
  id,
  pointId,
  pointName,
  pointDistrict,
  format,
  brand,
  status,
  phone,
  quantity,
  note,
  createdAt,
  onEdit,
  onToggleStatus,
  onDelete,
  className,
  variant = "vendor",
}: DisponibiliteCardProps) {
  const statusKey = status as AvailabilityStatus

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
            {format ?? "—"}
            {brand && <span className="text-xs font-medium text-muted-foreground">· {brand}</span>}
          </CardTitle>
          <CardDescription className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {pointName}
            {pointDistrict && <span className="text-xs">— {pointDistrict}</span>}
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className={cn(
            availabilityBadgeClass[statusKey],
            "shrink-0 whitespace-nowrap"
          )}
        >
          {availabilityLabel[statusKey]}
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Point de vente
            </p>
            <p className="font-medium text-foreground truncate">{pointName}</p>
          </div>
          {brand && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Marque
              </p>
              <p className="font-medium text-foreground">{brand}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Format
            </p>
            <p className="font-medium text-foreground">{format ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Publiée le
            </p>
            <p className="font-medium text-foreground">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
          {note && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {note}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1 ml-2">
              <Phone className="size-3 shrink-0" aria-hidden />
              {phone}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 sm:flex-none gap-2"
            >
              <PencilLine className="size-3.5" /> Modifier
            </Button>
          )}
          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              className="flex-1 sm:flex-none gap-2"
            >
              <RotateCcw className="size-3.5" />
              {status === "disponible" ? "Indisponible" : "Disponible"}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1 sm:flex-none gap-2"
            >
              <Trash2 className="size-3.5" /> Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
