"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  MapPin,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formats } from "@/app/_components/donnees-demo"
import { authClient } from "@/lib/auth-client"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"
import { ResultatRechercheCard } from "@/app/_components/cards/resultat-recherche-card"
import { trackEvent } from "@/lib/analytics"
import { searchService } from "@/lib/search-service"
import type { SearchResponse } from "@/lib/search-service"

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
  // Services
  hasDelivery: boolean
  hasExchange: boolean
  hasGasSale: boolean
  deliveryFee: number | null
}

/**
 * Bloc de recherche de gaz : formulaire (marque / format / zone),
 * résultats en direct et réservation. Partagé entre la page
 * d'accueil (hero) et le dashboard client.
 *
 * Chaque recherche interroge réellement l'API (et donc la base de données).
 * Aucun résultat mis en cache n'est affiché sans avoir été actualisé.
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
      pointName: data.reservation.pointName,
      pointDistrict: data.reservation.pointDistrict,
      reservedAt: data.reservation.reservedAt,
    }
  }

  const openReservationModal = (point: SearchResult, defaultType?: "reservation" | "consigne") => {
    setReservationPoint(point)
    setDefaultAmountType(defaultType ?? "reservation")
  }

  const closeReservationModal = () => {
    setReservationPoint(null)
  }

  /**
   * Effectue réellement la recherche auprès de l'API (base de données).
   * Utilisé par le formulaire et par les boutons "Relancer / Réessayer".
   */
  const runSearch = useCallback(async () => {
    if (!session?.user) {
      router.push("/inscription")
      return
    }

    const criteria = searchService.normalizeCriteria({
      brand: brand || undefined,
      format: format || undefined,
      zone: zone || undefined,
    })

    setLoading(true)
    setError(null)
    setResults(null)

    // Événement analytics : recherche effectuée
    trackEvent({
      eventType: "search_performed",
      path: "/api/recherche",
      metadata: { brand, format, zone },
    })

    try {
      const response: SearchResponse = await searchService.search(criteria)

      setResults(response.results as SearchResult[])

      // Événement analytics : résultats de recherche consultés
      trackEvent({
        eventType: "search_results_viewed",
        path: "/api/recherche",
        metadata: { resultCount: response.count, brand, format, zone },
      })
    } catch {
      setError(
        "La recherche n'a pas pu aboutir. Vérifiez votre connexion et réessayez."
      )
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [brand, format, zone, session, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runSearch()
  }

  const handleRetry = () => {
    runSearch()
  }

  const handleResetAndSearch = () => {
    setBrand("")
    setFormat("")
    setZone("")
    setLocationLabel(null)
    setError(null)
    setResults(null)
    runSearch()
  }

  return (
    <>
      <div id="recherche-gaz" />
      <Card className="p-4 sm:p-6 rounded-xl border border-border bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-heading text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            Quelle bouteille cherchez-vous&nbsp;?
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
                className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
                className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm text-foreground appearance-none pr-12 select-none outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Tous les formats</option>
                {formats.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 bottom-3.5 size-4 text-muted-foreground"
              />
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
                className="mt-1.5 h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <MapPin className="size-3.5 text-primary" /> Position détectée&nbsp;: {locationLabel}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl border border-input bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Search className="size-4 mr-2" />
            {loading ? "Recherche…" : "Trouver du gaz"}
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
          <Search className="size-4 animate-spin text-white" aria-hidden />
          <span className="text-white">Recherche des disponibilités en cours…</span>
        </div>
      )}

      {error && (
        <div className="mt-5 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="size-6 text-destructive" aria-hidden />
          </div>
          <p className="mt-3 text-sm text-destructive text-center">{error}</p>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="default"
              onClick={handleRetry}
            >
              <RefreshCw className="size-4 mr-2" />
              Réessayer la recherche
            </Button>
          </div>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div className="mt-5">
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {results.length} point{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((point) => (
              <ResultatRechercheCard
                key={point.id}
                id={point.id}
                name={point.name}
                district={point.district}
                address={point.address}
                phone={point.phone}
                brand={point.brand}
                format={point.format}
                status={point.status}
                disponibiliteId={point.disponibiliteId}
                hasDelivery={point.hasDelivery}
                hasExchange={point.hasExchange}
                hasGasSale={point.hasGasSale}
                deliveryFee={point.deliveryFee}
                onConsigner={() => openReservationModal(point)}
              />
            ))}
          </div>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div className="mt-5 flex flex-col items-center justify-center text-center bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-center mb-2">
            <Search className="size-10 text-primary" aria-hidden />
          </div>
          <p className="font-bold text-foreground whitespace-nowrap text-base sm:text-sm mb-2">
            Aucun gaz disponible pour le moment.
          </p>
          <p className="text-sm text-muted-foreground whitespace-nowrap mb-6">
            Nous vous invitons à réessayer un peu plus tard.
          </p>
          <Button
            type="button"
            variant="default"
            className="w-full sm:w-auto h-11 mt-3 sm:mt-0"
            onClick={handleRetry}
          >
            <RefreshCw className="size-4 mr-2" />
            Relancer la recherche
          </Button>
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
