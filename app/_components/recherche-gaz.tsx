"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ChevronDown,
  Cylinder,
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
import {
  SEARCH_BOTTLE_FORMATS,
  SEARCH_BRANDS,
  SearchCriteria,
  SearchError,
  SearchState,
  createSearchError,
  fetchDisponibiliteServices,
  mapSearchResponse,
  searchGas,
  validateSearchCriteria,
  type SearchResult,
} from "@/lib/search"

/**
 * Bloc de recherche de gaz : formulaire (marque / format / zone),
 * résultats en direct et réservation. Partagé entre la page
 * d'accueil (hero) et le dashboard client.
 *
 * Cette version utilise une couche de service dédiée (`lib/search.ts`)
 * qui prépare la connexion future avec un backend. Tant que le backend
 * n'est pas développé, les routes Next.js internes sont utilisées.
 *
 * Chaque recherche interroge réellement l'API (et donc la base de données).
 * Aucun résultat mis en cache n'est affiché sans avoir été actualisé.
 * Aucun résultat fictif n'est jamais affiché.
 */
export function RechercheGaz() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [brand, setBrand] = useState("")
  const [format, setFormat] = useState("")
  const [zone, setZone] = useState("")
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  // État de recherche géré par la couche de service
  const [searchState, setSearchState] = useState<SearchState>({ kind: "idle" })
  const [reservationPoint, setReservationPoint] = useState<SearchResult | null>(null)
  const [defaultAmountType, setDefaultAmountType] = useState<"reservation" | "consigne">("reservation")

  // AbortController pour annuler les requêtes en cours
  const abortControllerRef = useRef<AbortController | null>(null)

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
   * Annule toute recherche en cours avant d'en lancer une nouvelle.
   */
  const cancelPendingSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  /**
   * Effectue la recherche via la couche de service.
   * Gère l'annulation, les timeouts, et transforme la réponse.
   */
  const runSearch = useCallback(async () => {
    if (!session?.user) {
      router.push("/inscription")
      return
    }

    const criteria: SearchCriteria = {}
    if (brand) criteria.brand = brand
    if (format) criteria.format = format
    if (zone) criteria.zone = zone

    // Validation des critères avant envoi
    const validation = validateSearchCriteria(criteria)
    if (!validation.ok) {
      setSearchState({
        kind: "error",
        error: createSearchError(validation.message, {
          code: "VALIDATION_ERROR",
          statusCode: 400,
        }),
      })
      return
    }

    // Annuler toute recherche précédente
    cancelPendingSearch()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setSearchState({ kind: "searching" })

    // Événement analytics : recherche effectuée
    trackEvent({
      eventType: "search_performed",
      path: "/api/recherche",
      metadata: { brand, format, zone },
    })

    try {
      const response = await searchGas(criteria, controller.signal)

      // Récupérer les données de service (livraison, échange, gaz sale, frais)
      const disponibiliteIds = response.results
        .filter((r) => r.disponibiliteId)
        .map((r) => r.disponibiliteId)
      let serviceMap: Map<
        string,
        { delivery: boolean; exchange: boolean; gasSale: boolean; price: number | null }
      > = new Map()

      if (disponibiliteIds.length > 0) {
        serviceMap = await fetchDisponibiliteServices(disponibiliteIds, controller.signal)
      }

      // Vérifier que la requête n'a pas été annulée entre-temps
      if (controller.signal.aborted) return

      // Mapper la réponse vers le format attendu par l'interface
      const mappedResults = mapSearchResponse(response, serviceMap)

      if (mappedResults.length === 0) {
        setSearchState({ kind: "empty" })
      } else {
        setSearchState({ kind: "success", results: mappedResults, total: response.total })
      }

      // Événement analytics : résultats de recherche consultés
      trackEvent({
        eventType: "search_results_viewed",
        path: "/api/recherche",
        metadata: { resultCount: mappedResults.length, brand, format, zone },
      })
    } catch (err) {
      // Vérifier que l'erreur n'est pas due à une annulation
      if (controller.signal.aborted) return

      const searchError =
        err instanceof Error && (err as SearchError).code
          ? (err as SearchError)
          : createSearchError(
              err instanceof Error ? err.message : "Erreur inconnue lors de la recherche",
              { code: "SEARCH_UNKNOWN_ERROR" }
            )

      setSearchState({ kind: "error", error: searchError })
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
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
    setSearchState({ kind: "idle" })
    runSearch()
  }

  // Helper pour extraire les données d'affichage depuis l'état de recherche
  const getResults = (): SearchResult[] => {
    if (searchState.kind === "success") return searchState.results
    return []
  }

  const getTotal = (): number => {
    if (searchState.kind === "success") return searchState.total
    return 0
  }

  const isLoading = searchState.kind === "searching"
  const hasError = searchState.kind === "error"
  const errorMessage = hasError ? searchState.error.message : null
  const hasResults = searchState.kind === "success" && searchState.results.length > 0
  const isEmpty = searchState.kind === "empty"

  return (
    <>
      <Card className="p-4 sm:p-6 rounded-xl border border-border bg-background shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-heading text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
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
                {SEARCH_BOTTLE_FORMATS.map((item) => (
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
            disabled={isLoading}
          >
            <Search className="size-4 mr-2" />
            {isLoading ? "Recherche…" : "Trouver du gaz"}
          </Button>
        </form>
      </Card>

      {isLoading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
          <Search className="size-4 animate-spin text-white" aria-hidden />
          <span className="text-white">Recherche des disponibilités en cours…</span>
        </div>
      )}

      {hasError && (
        <div className="mt-5 bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="size-6 text-destructive" aria-hidden />
          </div>
          <p className="mt-3 text-sm text-destructive text-center">{errorMessage}</p>
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

      {hasResults && (
        <div className="mt-5">
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {getTotal()} point{getTotal() > 1 ? "s" : ""} trouvé{getTotal() > 1 ? "s" : ""}
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {getResults().map((point) => (
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

      {isEmpty && (
        <div className="mt-5 flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Cylinder className="size-10 text-primary" aria-hidden />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3">
            Aucun gaz disponible pour le moment. Nous vous invitons à réessayer un peu plus tard.
          </h2>
          <p className="text-base text-muted-foreground max-w-xs mx-auto leading-relaxed mb-6">
            Nous n'avons actuellement aucune disponibilité correspondant à votre
            recherche.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
            Nous vous invitons à réessayer un peu plus tard ou à relancer votre
            recherche pour vérifier les nouvelles disponibilités.
          </p>
          <Button
            type="button"
            variant="default"
            className="w-full sm:w-auto h-11"
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
