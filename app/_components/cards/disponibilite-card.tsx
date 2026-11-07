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
        "border border-border rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 group",
        className
      )}
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            {format ?? "—"}
            {brand && <span className="text-[10px] font-medium text-muted-foreground">· {brand}</span>}
          </CardTitle>
          <CardDescription className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="size-2.5 shrink-0" aria-hidden />
            {pointName}
            {pointDistrict && <span className="text-[10px]">— {pointDistrict}</span>}
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "mt-0.5 shrink-0 whitespace-nowrap",
            availabilityBadgeClass[statusKey]
          )}
        >
          {availabilityLabel[statusKey]}
        </Badge>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Point de vente
            </p>
            <p className="font-medium text-foreground truncate">{pointName}</p>
          </div>
          {brand && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Marque
              </p>
              <p className="font-medium text-foreground">{brand}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Format
            </p>
            <p className="font-medium text-foreground">{format ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Publiée le
            </p>
            <p className="font-medium text-foreground">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div className="mt-1.5 flex items-start gap-0.5 text-xs text-muted-foreground">
          {note && (
            <span className="flex items-center gap-1">
              <MapPin className="size-2.5 shrink-0" aria-hidden />
              {note}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1 ml-1">
              <Phone className="size-2.5 shrink-0" aria-hidden />
              {phone}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <PencilLine className="size-3" /> Modifier
            </Button>
          )}
          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <RotateCcw className="size-3" />
              {status === "disponible" ? "Indisponible" : "Disponible"}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <Trash2 className="size-3" /> Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}