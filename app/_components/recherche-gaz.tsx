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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formats } from "@/app/_components/donnees-demo"
import { availabilityLabel } from "@/lib/gaz"
import { authClient } from "@/lib/auth-client"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"
import { getCachedSearch, setCachedSearch } from "@/lib/cache-service"

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

    const queryKey = [brand, format, zone].filter(Boolean).join("|")
    let hasCache = false

    try {
      const cached = await getCachedSearch(queryKey)
      if (cached && cached.length > 0) {
        setResults(cached as SearchResult[])
        hasCache = true
      }
    } catch {
      // cache indisponible -> aller au backend
    }

    setLoading(true)
    setError(null)
    if (!hasCache) setResults(null)

    try {
      const params = new URLSearchParams()
      if (brand) params.set("brand", brand)
      if (format) params.set("format", format)
      if (zone) params.set("zone", zone)

      const res = await fetch(`/api/recherche?${params.toString()}`)
      if (!res.ok) throw new Error("Recherche impossible")
      const data = await res.json()
      const results: SearchResult[] = data.results ?? []

      // Une réponse valide contenant zéro résultat est une recherche réussie,
      // et non une erreur : on l'affiche comme telle (pas de message d'erreur).
      setResults(results)
      await setCachedSearch(queryKey, results)
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
          <p className="font-heading text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
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
                placeholder="Exemple : Total, Bocom, Tradex"
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

      {results !== null && results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {results.length} point{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((point) => (
                <Card key={point.id} className="shadow-sm border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardHeader className="pb-1 pt-2 px-3">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base font-semibold leading-snug text-foreground">
                              {point.name}
                            </CardTitle>
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
                              {point.status ? availabilityLabel[point.status] : "—"}
                            </Badge>
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              {point.brand && <span className="font-medium">{point.brand}</span>}
                              {point.format && <span className="font-medium">{point.format}</span>}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="flex flex-col gap-y-1 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <MapPin className="size-3 shrink-0" />
                            {point.district} — {point.address}
                          </p>
                          {point.phone && (
                            <p className="flex items-center gap-1 text-destructive">
                              <Phone className="size-3 shrink-0" />
                              {point.phone}
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <div className="px-3 pb-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-10 w-full text-base font-bold shadow-sm border-primary/25 bg-primary text-white justify-center items-center hover:text-white active:text-white disabled:text-white/70"
                          onClick={() => openReservationModal(point)}
                          disabled={point.status !== "disponible"}
                        >
                          <Shield className="size-3 mr-2" />
                          Faire une réservation
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div className="mt-8 text-center py-8">
          <p className="text-sm text-muted-foreground">
            Aucune information trouvée. Essayez de modifier vos critères de recherche.
          </p>
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
