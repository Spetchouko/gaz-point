"use client"

import { MapPin, Navigation, Phone, Truck, RotateCcw, Package } from "lucide-react"
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
  name: string // nom du point de vente
  district: string
  address: string
  phone: string | null
  brand: string | null
  format: string | null
  status: AvailabilityStatus | null | string
  disponibiliteId: string
  hasDelivery: boolean
  hasExchange: boolean
  hasGasSale: boolean
  deliveryFee: number | null
  // Nouveaux props
  displayPhone: string | null // téléphone affiché sur la carte (peut être filtré)
  onReserver?: () => void // callback pour ouverture formulaire réservation
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
  hasDelivery,
  hasExchange,
  hasGasSale,
  deliveryFee,
  displayPhone,
  onReserver,
  className,
}: ResultatRechercheCardProps) {
  const statusKey = status as AvailabilityStatus
  const isDisponible = status === "disponible"

  const phoneHref = displayPhone
    ? `tel:${displayPhone.replace(/[^\d+]/g, "")}`
    : null
  const mapsDestination = [name, district, address].filter(Boolean).join(", ")
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDestination)}`

  // Sélectionne une seule localisation pertinente (préfère le district si disponible,
  // sinon utilise la première partie de l'adresse pour éviter les doublons)
  const localisationPertinente = district
    ? `${district} — ${address}`
    : address
      ? address.split(',')[0]
      : ""

  return (
    <Card
      key={id}
      className={cn(
        "border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group",
        className
      )}
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            {name}
          </CardTitle>
          {/* Numéro de carte discret */}
          <span className="absolute -top-1 -right-2 text-xs opacity-20 capitalize">
            {id.substring(0, 2).toUpperCase()}
          </span>
          <CardDescription className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="size-2.5 shrink-0" aria-hidden />
            {localisationPertinente}
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

        {/* Services badges */}
        {hasDelivery || hasExchange || hasGasSale && (
          <div className="mt-1 flex items-center gap-2">
            {hasGasSale && (
              <Badge variant="secondary" className="text-xs">
                <Package className="size-3 mr-1" /> Gaz chargé
              </Badge>
            )}
            {hasDelivery && (
              <Badge variant="secondary" className="text-xs">
                <Truck className="size-3 mr-1" /> Livraison
              </Badge>
            )}
            {hasExchange && (
              <Badge variant="secondary" className="text-xs">
                <RotateCcw className="size-3 mr-1" /> Échange
              </Badge>
            )}
            {hasDelivery && deliveryFee !== null && (
              <span className="text-xs text-muted-foreground">
                {deliveryFee} FCFA
              </span>
            )}
          </div>
        )}
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

          {/* Numéro de téléphone affiché uniquement si renseigné */}
          {displayPhone && (
            <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
              <a href={phoneHref ?? "#"} className="flex items-center gap-1 hover:text-primary">
                <Phone className="size-2.5 shrink-0" aria-hidden />
                {displayPhone}
              </a>
            </div>
          )}

          {/* Appel et itinéraire : actions disponibles sur chaque point de vente */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {phoneHref && (
              <Button
                nativeButton={false}
                render={<a href={phoneHref} />}
                variant="outline"
                size="sm"
                className="h-9 w-full gap-1.5 rounded-lg px-2 text-xs"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden />
                Appeler
              </Button>
            )}
            <Button
              nativeButton={false}
              render={
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" />
              }
              variant="outline"
              size="sm"
              className="h-9 w-full gap-1.5 rounded-lg px-2 text-xs"
            >
              <Navigation className="size-3.5 shrink-0" aria-hidden />
              Itinéraire
            </Button>
          </div>

          {/* Bouton de réservation - remplace "Consigner cette bouteille" */}
          {onReserver && isDisponible ? (
            <Button
              variant="default"
              size="sm"
              onClick={onReserver}
              className="w-full gap-2 rounded-sm py-1.5 text-sm font-medium transition-colors flex items-center justify-center"
            >
              <MapPin className="size-3 mr-1.5" />
              Réserver cette bouteille
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}