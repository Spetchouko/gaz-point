"use client"

import { MapPin, Phone, Shield } from "lucide-react"
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

export type ResultatRechercheCardProps = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brand: string | null
  format: string | null
  status: AvailabilityStatus | null | string
  disponibiliteId: string
  onConsigner?: () => void
  className?: string
}

export function ResultatRechercheCard({
  id,
  name,
  district,
  address,
  phone,
  brand,
  format,
  status,
  disponibiliteId,
  onConsigner,
  className,
}: ResultatRechercheCardProps) {
  const statusKey = status as AvailabilityStatus
  const isDisponible = status === "disponible"

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
            {name}
          </CardTitle>
          <CardDescription className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="size-2.5 shrink-0" aria-hidden />
            {district} — {address}
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
        <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
          {brand && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Marque
              </p>
              <p className="font-medium text-foreground">{brand}</p>
            </div>
          )}
          {format && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Format
              </p>
              <p className="font-medium text-foreground">{format}</p>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-2.5 shrink-0" aria-hidden />
              {phone}
            </span>
          )}
        </div>

        <div className="mt-3">
          {onConsigner && isDisponible ? (
            <Button
              variant="default"
              size="sm"
              onClick={onConsigner}
              className="w-full gap-1.5 flex-1 sm:flex-none rounded-sm py-1.5 text-sm font-medium transition-colors"
            >
              <Shield className="size-3 mr-1.5" />
              Consigner cette bouteille
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={!isDisponible}
              className="w-full gap-1.5 flex-1 sm:flex-none rounded-sm py-1.5 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              <Shield className="size-3 mr-1.5" />
              {isDisponible ? "Consigner cette bouteille" : "Indisponible"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
