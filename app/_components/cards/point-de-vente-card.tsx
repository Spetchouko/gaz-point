"use client"

import Link from "next/link"
import { MapPin, Store, Phone, Plus, PencilLine, Trash2 } from "lucide-react"
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
        "border border-border rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 group",
        className
      )}
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            <Store className="size-3.5 text-primary" aria-hidden />
            {name}
          </CardTitle>
          <CardDescription className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="size-2.5 shrink-0" aria-hidden />
            {district} — {address}
          </CardDescription>
          {vendorName && (
            <p className="text-xs text-muted-foreground">
              {vendorName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {status && (
            <Badge
              variant="outline"
              className={cn(
                "mt-0.5 shrink-0 whitespace-nowrap",
                availabilityBadgeClass[status]
              )}>
              {availabilityLabel[status]}
            </Badge>
          )}

          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <Plus className="size-3" /> Consulter
            </Button>
          )}

          {onManageDispos && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageDispos}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <Plus className="size-3" /> Gérer les disponibilités
            </Button>
          )}

          {variant === "vendor" && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 sm:flex-none rounded-sm gap-1.5"
            >
              <PencilLine className="size-3" /> Modifier
            </Button>
          )}

          {variant === "vendor" && onDelete && (
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
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quartier
            </p>
            <p className="font-medium text-foreground truncate">{district}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Adresse
            </p>
            <p className="font-medium text-foreground truncate">{address}</p>
          </div>
          {phone && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Téléphone
              </p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Phone className="size-3 shrink-0" aria-hidden />
                {phone}
              </p>
            </div>
          )}
          {disposCount !== undefined && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Disponibilités
              </p>
              <p className="font-medium text-foreground">{disposCount}</p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {onView && (
              <Button variant="outline" size="sm" onClick={onView} className="flex-1 sm:flex-none rounded-sm gap-1.5">
                <Plus className="size-3" /> Consulter
              </Button>
            )}
            {onManageDispos && (
              <Button variant="outline" size="sm" onClick={onManageDispos} className="flex-1 sm:flex-none rounded-sm gap-1.5">
                <Plus className="size-3" /> Gérer les disponibilités
              </Button>
            )}
            {variant === "vendor" && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none rounded-sm gap-1.5">
                <PencilLine className="size-3" /> Modifier
              </Button>
            )}
            {variant === "vendor" && onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1 sm:flex-none rounded-sm gap-1.5">
                <Trash2 className="size-3" /> Supprimer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}