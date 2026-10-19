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
import { brands, formats } from "@/app/_components/donnees-demo"
import { availabilityLabel } from "@/lib/gaz"
import { authClient } from "@/lib/auth-client"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"

const selectClass =
  "mt-1.5 h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"

type SearchResult = {
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

export function TrouverMonGaz() {
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

  const openReservationModal = (point: SearchResult) => {
    setReservationPoint(point)
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
      setResults(data.results ?? [])
    } catch {
      setError("Une erreur est survenue lors de la recherche.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="trouver-du-gaz"
      className="w-full scroll-mt-16 border-y bg-muted/50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Trouver mon gaz
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Tu cherches le gaz où ?
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Renseigne ta bouteille et ta zone pour trouver les points de vente disponibles en direct.
          </p>
        </div>

        <Card className="mx-auto mt-12 max-w-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-7">
            <p className="text-sm font-semibold text-foreground">
              Quelle bouteille tu cherches ?
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="recherche-marque"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Marque
                </label>
                <select
                  id="recherche-marque"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Toutes les marques</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 bottom-3.5 size-4 text-muted-foreground" />
              </div>

              <div className="relative">
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
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="recherche-zone"
                  type="text"
                  value={zone}
                  onChange={(event) => {
                    setZone(event.target.value)
                    setLocationLabel(null)
                  }}
                  placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 gap-2 cursor-pointer"
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Position détectée : {locationLabel}
                </p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full gap-2 text-base cursor-pointer" disabled={loading}>
              <Search className="size-4" />
              {loading ? "Recherche..." : "Voir où il y en a"}
            </Button>
          </form>
        </Card>

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}

        {results !== null && (
          <div className="mt-8">
            <h3 className="text-center text-lg font-semibold text-foreground">
              {results.length > 0
                ? `${results.length} point${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`
                : "Aucun point trouvé"}
            </h3>

            {results.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {results.map((point) => (
                  <Card key={point.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{point.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {point.district} — {point.address}
                        </p>
                      </div>
                      {point.status && (
                        <Badge
                          variant="outline"
                          className={
                            point.status === "disponible"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : point.status === "a_confirmer"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-red-500/10 text-red-600 border-red-500/30"
                          }
                        >
                          {availabilityLabel[point.status]}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {point.expired && point.expiresAt && (
                        <p className="flex items-center gap-1 text-red-600">
                          <MapPin className="size-3" />
                          Signalement expiré depuis le{" "}
                          {new Date(point.expiresAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {point.brand && <p>Marque : {point.brand}</p>}
                      <p>Quantité : {point.quantity !== null ? `${point.quantity} bouteille${point.quantity > 1 ? "s" : ""}` : "—"}</p>
                      
                      {point.format && <p>Format : {point.format}</p>}
                      {point.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {point.phone}
                        </p>
                      )}
                      {point.updatedAt && (
                        <p>
                          Mis à jour : {new Date(point.updatedAt).toLocaleDateString("fr-FR")}
                          {point.updatedBy ? ` par ${point.updatedBy}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => openReservationModal(point)}
                        disabled={point.status !== "disponible" || !point.quantity || point.quantity <= 0}
                      >
                        <Shield className="size-3.5" />
                        Réserver
                      </Button>
                      {point.phone && (
                        <Button
                          variant="ghost"
                          className="flex-1 gap-1"
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
      </div>

    {reservationPoint && (
      <ReservationModal
        open={!!reservationPoint}
        onClose={closeReservationModal}
        point={reservationPoint}
        onConfirm={handleReserve}
      />
    )}
  </section>
  )
}
