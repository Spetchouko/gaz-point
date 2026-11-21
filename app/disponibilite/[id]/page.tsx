"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Truck,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { formatDistanceKm } from "@/lib/distance"
import { ReservationModal } from "@/app/_components/reservation-modal"
import type { AvailabilityStatus } from "@/db/schema"
import { createClientReservation } from "@/lib/client-reservation"

type DisponibiliteDetail = {
  id: string
  pointId: string
  status: AvailabilityStatus | null
  note: string | null
  quantity: number | null
  reservedQuantity: number | null
  availableQuantity: number | null
  price: number | null
  format: string | null
  brand: string | null
  weightKg: string | null
  expiresAt: string | null
  phone: string | null
  reportedByName: string | null
  source: string | null
  delivery: boolean
  exchange: boolean
  gasSale: boolean
  stale: boolean
  expired: boolean
  disponibiliteId: string
  createdAt: string
  updatedAt: string
}

type PointDeVenteDetail = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[] | null
  formats: string[] | null
  deliveryEnabled: boolean
  deliveryFee: number | null
  exchangeEnabled: boolean
  gasSaleEnabled: boolean
  isActive: boolean
  latitude: string | null
  longitude: string | null
}

type DetailData = {
  disponibilite: DisponibiliteDetail
  pointDeVente: PointDeVenteDetail
}

export default function DisponibiliteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservationOpen, setReservationOpen] = useState(false)

  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    params.then((p) => {
      if (!cancelled) setId(p.id)
    })
    return () => {
      cancelled = true
    }
  }, [params])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/disponibilite/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })

        if (!res.ok) {
          if (res.status === 404) throw new Error("Disponibilité introuvable")
          throw new Error("Impossible de charger la disponibilité")
        }

        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger la disponibilité",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Chargement de la disponibilité…
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
        <AlertCircle className="size-10 text-destructive" aria-hidden />
        <p className="mt-4 text-base font-semibold text-destructive">
          {error}
        </p>
        <Link href="/resultats-recherche">
          <Button variant="outline" mt-6 className="h-11 w-full gap-2 rounded-xl sm:w-auto">
            <ArrowLeft className="size-4 mr-2" />
            Retour aux résultats
          </Button>
        </Link>
      </div>
    )
  }

  const { disponibilite: dispo, pointDeVente: point } = data
  const isDisponible = dispo.status === "disponible" && !dispo.expired
  const availableQty = dispo.availableQuantity ?? 0
  const phoneHref = point.phone
    ? `tel:${point.phone.replace(/[^\d+]/g, "")}`
    : null
  const distanceText = dispo.distanceKm != null
    ? `à ${formatDistanceKm(dispo.distanceKm)}`
    : ""

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/resultats-recherche"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Retour aux résultats
        </Link>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          {point.name}
        </h1>
      </div>

      {/* Carte principale : disponibilité */}
      <Card className="border border-border rounded-xl bg-card shadow-sm">
        <CardHeader className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {dispo.brand ?? "—"} {dispo.format ?? "—"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "whitespace-nowrap",
                    availabilityBadgeClass[dispo.status as AvailabilityStatus],
                  )}
                >
                  {availabilityLabel[dispo.status as AvailabilityStatus]}
                </Badge>
              </div>
              {dispo.distanceKm != null && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {formatDistanceKm(dispo.distanceKm)} de chez vous
                </p>
              )}
              <CardDescription className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="size-2.5 shrink-0" aria-hidden />
                {point.district} — {point.address}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isDisponible ? "default" : "secondary"}>
              {isDisponible ? "Disponible à la réservation" : "Indisponible"}
            </Badge>
            {availableQty != null && availableQty > 0 && (
              <Badge variant="outline" className="text-xs">
                {availableQty} bouteille{availableQty > 1 ? "s" : ""} disponible{availableQty > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Informations détaillées */}
          <div className="grid gap-3 sm:grid-cols-2">
            {dispo.brand && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Marque
                </p>
                <p className="font-medium text-foreground">{dispo.brand}</p>
              </div>
            )}
            {dispo.format && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Format
                </p>
                <p className="font-medium text-foreground">{dispo.format}</p>
              </div>
            )}
            {dispo.price != null && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Prix
                </p>
                <p className="font-medium text-foreground">
                  {dispo.price.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "XAF",
                  })}
                </p>
              </div>
            )}
            {dispo.expiresAt && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Valable jusqu&apos;à
                </p>
                <p className="font-medium text-foreground">
                  {new Date(dispo.expiresAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {dispo.note && (
              <div className="space-y-1 sm:col-span-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Note
                </p>
                <p className="text-sm text-foreground">{dispo.note}</p>
              </div>
            )}
          </div>

          {/* Services du dépôt */}
          {(
            point.deliveryEnabled ||
            point.exchangeEnabled ||
            point.gasSaleEnabled
          ) && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Services disponibles au dépôt
              </p>
              <div className="flex items-center gap-2">
                {point.gasSaleEnabled && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1.5">
                    <Package className="size-3" /> Vente de gaz
                  </Badge>
                )}
                {point.deliveryEnabled && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1.5">
                    <Truck className="size-3" />
                    Livraison
                    {point.deliveryFee != null && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({point.deliveryFee.toLocaleString()} FCFA)
                      </span>
                    )}
                  </Badge>
                )}
                {point.exchangeEnabled && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1.5">
                    <RotateCcw className="size-3" />
                    Échange
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Contact et localisation */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {phoneHref && (
              <a
                href={phoneHref}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                <span>Appeler le dépôt</span>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const mapsDestination = [
                  point.name,
                  point.district,
                  point.address,
                ]
                  .filter(Boolean)
                  .join(", ")
                const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDestination)}`
                window.open(mapsHref, "_blank")
              }}
            >
              <MapPin className="size-4 mr-2" />
              Itinéraire
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de réservation */}
      {isDisponible && availableQty > 0 && (
        <div className="flex justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => setReservationOpen(true)}
            className="w-full sm:w-auto gap-2 h-14 text-lg font-extrabold tracking-tight shadow-xl shadow-primary/20 transition hover:shadow-2xl hover:scale-[1.01]"
          >
            <Package className="size-5 mr-2" />
            Réserver cette bouteille
          </Button>
        </div>
      )}

      {!isDisponible && (
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Cette disponibilité n&apos;est plus actuellement réservable.
          </p>
        </div>
      )}

      {reservationOpen && (
        <ReservationModal
          open={reservationOpen}
          onClose={() => setReservationOpen(false)}
          point={{
            id: point.id,
            name: point.name,
            district: point.district,
            address: point.address,
            phone: point.phone,
            brand: dispo.brand,
            format: dispo.format,
            disponibiliteId: dispo.disponibiliteId,
            hasDelivery: point.deliveryEnabled,
            hasExchange: point.exchangeEnabled,
            hasGasSale: point.gasSaleEnabled,
          }}
          onConfirm={(disponibiliteId) =>
            createClientReservation({
              disponibiliteId,
              brand: dispo.brand,
              format: dispo.format,
              quantity: 1,
              amountType: "reservation",
            })
          }
        />
      )}
    </div>
  )
}
