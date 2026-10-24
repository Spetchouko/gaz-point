"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  LocateFixed,
  MapPin,
  Phone,
  Search,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formats } from "@/app/_components/donnees-demo"
import { availabilityLabel } from "@/lib/gaz"
import { authClient } from "@/lib/auth-client"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"

const selectClass =
  "mt-1.5 h-12 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"

export type SearchResult = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  status: AvailabilityStatus | null
  note: string | null
  quantity: number | null
  price: number | null
  format: string | null
  brand: string | null
  expiresAt: string | null
  updatedAt: string | null
  updatedBy: string | null
  source: string | null
  stale: boolean
  expired: boolean
  disponibiliteId: string
}

/**
 * Bloc de recherche de gaz : formulaire (marque / format / zone),
 * résultats en direct et réservation. Partagé entre la page
 * d'accueil (hero) et le dashboard client.
 */
export function RechercheGaz() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [brand, setBrand] = useState("")
  const [format, setFormat] = useState("")
  const [zone, setZone] = useState("")
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservationPoint, setReservationPoint] = useState<SearchResult | null>(null)
  const [defaultAmountType, setDefaultAmountType] = useState<"reservation" | "consigne">("reservation")

  const handleReserve = async (
    amountType: "reservation" | "consigne"
  ): Promise<ReservationResult> => {
    if (!reservationPoint) {
      throw new Error("Aucun point sélectionné")
    }

    const res = await fetch("/api/reservation/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disponibiliteId: reservationPoint.disponibiliteId,
        brand: reservationPoint.brand,
        format: reservationPoint.format,
        quantity: 1,
        amountType,
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      throw new Error(data.error || "Erreur lors de la réservation")
    }

    return {
      code: data.reservation.code,
      expiresAt: data.reservation.expiresAt,
      amount: data.reservation.amount,
      amountType: data.reservation.amountType,
      brand: data.reservation.brand,
      format: data.reservation.format,
      quantity: data.reservation.quantity,
    }
  }

  const openReservationModal = (point: SearchResult, defaultType?: "reservation" | "consigne") => {
    setReservationPoint(point)
    setDefaultAmountType(defaultType ?? "reservation")
  }

  const closeReservationModal = () => {
    setReservationPoint(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // La recherche est réservée aux comptes : un visiteur non connecté
    // est redirigé vers le parcours d'inscription existant.
    if (!session?.user) {
      router.push("/inscription")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const params = new URLSearchParams()
      if (brand) params.set("brand", brand)
      if (format) params.set("format", format)
      if (zone) params.set("zone", zone)

      const res = await fetch(`/api/recherche?${params.toString()}`)
      if (!res.ok) throw new Error("Recherche impossible")
      const data = await res.json()
      const results: SearchResult[] = data.results ?? []

      // Message spécifique lorsqu'aucune marque correspondante n'est trouvée
      if (brand && results.length === 0) {
        setError(`Aucun point trouvé pour la marque « ${brand} ». Vérifie l'orthographe ou laisse le champ vide pour voir tous les points.`)
      } else {
        setResults(results)
      }
    } catch {
      setError("Une erreur est survenue lors de la recherche.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="p-5 shadow-sm shadow-primary/5 ring-1 ring-border sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-heading text-sm font-semibold text-foreground">
            Quelle bouteille tu cherches&nbsp;?
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-w-0">
              <label
                htmlFor="recherche-marque"
                className="text-xs font-medium text-muted-foreground"
              >
                Marque
              </label>
              <Input
                id="recherche-marque"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Nom de la marque (ex: Total, Payo, Gazex...)"
                className={selectClass}
              />
            </div>

            <div className="relative min-w-0">
              <label
                htmlFor="recherche-format"
                className="text-xs font-medium text-muted-foreground"
              >
                Format
              </label>
              <select
                id="recherche-format"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className={selectClass}
              >
                <option value="">Tous les formats</option>
                {formats.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 bottom-3.5 size-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label
              htmlFor="recherche-zone"
              className="text-xs font-medium text-muted-foreground"
            >
              Zone ou localisation
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
              <input
                id="recherche-zone"
                type="text"
                value={zone}
                onChange={(event) => {
                  setZone(event.target.value)
                  setLocationLabel(null)
                }}
                placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
                className="h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 gap-2 cursor-pointer"
                onClick={() => {
                  setZone("Douala")
                  setLocationLabel("Ma position actuelle")
                }}
              >
                <LocateFixed className="size-4" />
                Utiliser ma position
              </Button>
            </div>
            {locationLabel && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                Position détectée&nbsp;: {locationLabel}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full gap-2 text-base cursor-pointer"
            disabled={loading}
          >
            <Search className="size-4" />
            {loading ? "Recherche..." : "Trouver du gaz"}
          </Button>
        </form>
      </Card>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}

      {results !== null && (
        <div className="mt-8">
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {results.length > 0
              ? `${results.length} point${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`
              : "Aucun point trouvé"}
          </h3>

          {results.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {results.map((point) => (
                <Card key={point.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{point.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">
                          {point.district} — {point.address}
                        </span>
                      </p>
                    </div>
                    {point.status && (
                      <Badge
                        variant="outline"
                        className={
                          point.status === "disponible"
                            ? "border-primary/30 bg-mint text-primary-strong"
                            : point.status === "a_confirmer"
                              ? "border-warning/20 bg-warning/10 text-warning"
                              : "border-destructive/20 bg-destructive/10 text-destructive"
                        }
                      >
                        {availabilityLabel[point.status]}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {point.expired && point.expiresAt && (
                      <p className="flex items-center gap-1 text-destructive">
                        <MapPin className="size-3" />
                        Signalement expiré depuis le{" "}
                        {new Date(point.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {point.brand && <p>Marque&nbsp;: {point.brand}</p>}
                    <p>
                      Quantité&nbsp;:{" "}
                      {point.quantity !== null
                        ? `${point.quantity} bouteille${point.quantity > 1 ? "s" : ""}`
                        : "—"}
                    </p>
                    {point.format && <p>Format&nbsp;: {point.format}</p>}
                    {point.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {point.phone}
                      </p>
                    )}
                    {point.updatedAt && (
                      <p>
                        Mis à jour&nbsp;:{" "}
                        {new Date(point.updatedAt).toLocaleDateString("fr-FR")}
                        {point.updatedBy ? ` par ${point.updatedBy}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      className="h-9 flex-1 gap-1 text-xs cursor-pointer"
                      onClick={() => openReservationModal(point)}
                      disabled={
                        point.status !== "disponible" ||
                        !point.quantity ||
                        point.quantity <= 0
                      }
                    >
                      <Shield className="size-3.5" />
                      Réserver
                    </Button>
                    {point.status === "disponible" && (
                      <Button
                        variant="default"
                        className="h-9 flex-1 gap-1 text-xs cursor-pointer"
                        onClick={() => openReservationModal(point, "consigne")}
                      >
                        Consigner cette bouteille
                      </Button>
                    )}
                    {point.phone && (
                      <Button
                        variant="ghost"
                        className="h-9 shrink-0 gap-1 text-xs cursor-pointer"
                        render={
                          <a href={`tel:${point.phone.replace(/\s/g, "")}`}>
                            <Phone className="size-3.5" />
                            Appeler
                          </a>
                        }
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {reservationPoint && (
        <ReservationModal
          open={!!reservationPoint}
          onClose={closeReservationModal}
          point={reservationPoint}
          onConfirm={handleReserve}
          defaultAmountType={defaultAmountType}
        />
      )}
    </>
  )
}
