"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GasBrandAutocomplete } from "@/app/_components/gas-brand-autocomplete"
import { formats } from "@/app/_components/donnees-demo"
import { useSafeSession } from "@/lib/auth-session"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"
import { ResultatRechercheCard } from "@/app/_components/cards/resultat-recherche-card"
import { trackEvent } from "@/lib/analytics"
import { SearchError, searchService } from "@/lib/search-service"
import type { SearchResponse } from "@/lib/search-service"
import { getResultsPathForRole } from "@/lib/auth-routing"
import { createClientReservation } from "@/lib/client-reservation"

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
  distanceKm: number | null
}

type GeolocationState = "idle" | "requesting" | "granted" | "denied" | "unavailable"

/**
 * Bloc de recherche de gaz : formulaire (marque / format / zone), résultats en direct et réservation.
 * Partagé entre la page d'accueil (hero) et le dashboard client.
 *
 * Chaque recherche interroge réellement l'API (et donc la base de données).
 * Aucun résultat mis en cache n'est affiché sans avoir été actualisé.
 *
 * Géolocalisation : lorsque l'utilisateur lance une recherche sans critère,
 * l'API de géolocalisation du navigateur est demandée. Les coordonnées GPS
 * sont transmises à l'API pour trier les résultats par distance.
 */
type RechercheGazProps = {
  /**
   * Sur la landing : redirige vers la page dédiée aux résultats au lieu
   * d'afficher les résultats inline. Le dashboard client conserve le
   * comportement historique (valeur par défaut `false`).
   */
  redirectToResults?: boolean
  /** Surcharge facultative de la route de résultats (par défaut : selon le rôle). */
  resultsPath?: string
  initialBrand?: string
  initialFormat?: string
  initialZone?: string
}

export function RechercheGaz({
  redirectToResults = false,
  resultsPath,
  initialBrand = "",
  initialFormat = "12,5 kg",
  initialZone = "",
}: RechercheGazProps) {
  const router = useRouter()
  const { data: session } = useSafeSession()
  const [brand, setBrand] = useState(initialBrand)
  const [format, setFormat] = useState(initialFormat)
  const [zone, setZone] = useState(initialZone)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservationPoint, setReservationPoint] = useState<SearchResult | null>(null)
  const [geoState, setGeoState] = useState<GeolocationState>("idle")
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  const handleReserve = async (
    disponibiliteId: string,
    quantity: number
  ): Promise<ReservationResult> => {
    if (!reservationPoint) {
      throw new Error("Aucun point sélectionné")
    }

    return createClientReservation({
      disponibiliteId,
      brand: reservationPoint.brand,
      format: reservationPoint.format,
      quantity,
      amountType: "reservation",
    })
  }

  const openReservationModal = (point: SearchResult) => {
    setReservationPoint(point)
  }

  const closeReservationModal = () => {
    setReservationPoint(null)
  }

  /**
   * Demande la géolocalisation du navigateur.
   * Retourne les coordonnées si l'autorisation est accordée, null sinon.
   */
  const requestGeolocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGeoState("unavailable")
        resolve(null)
        return
      }

      setGeoState("requesting")

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setGeoState("granted")
          setUserLat(latitude)
          setUserLng(longitude)
          setLocationLabel("Ma position actuelle")
          resolve({ lat: latitude, lng: longitude })
        },
        (error) => {
          setGeoState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")
          setUserLat(null)
          setUserLng(null)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    })
  }, [])

  /**
   * Effectue réellement la recherche auprès de l'API (base de données).
   */
  const runSearch = useCallback(async () => {
    if (!session?.user) {
      router.push("/inscription")
      return
    }

    // Si aucun critère n'est renseigné, demander la géolocalisation
    const hasCriteria = brand || format || zone
    let geoCoords: { lat: number; lng: number } | null = null

    if (!hasCriteria) {
      geoCoords = await requestGeolocation()
    }

    const criteria = searchService.normalizeCriteria({
      brand: brand || undefined,
      format,
      zone: zone || undefined,
      lat: geoCoords?.lat ?? null,
      lng: geoCoords?.lng ?? null,
    })

    // Sur la landing, la recherche est lancée puis l'utilisateur est
    // redirigé vers la page dédiée : aucun résultat n'est rendu ici.
    if (redirectToResults) {
      const targetPath = resultsPath ?? getResultsPathForRole(session.user.role)
      trackEvent({
        eventType: "search_performed",
        path: targetPath,
        metadata: { brand, format, zone, lat: criteria.lat, lng: criteria.lng },
      })
      setLoading(true)
      setError(null)
      router.push(searchService.buildResultsUrl(criteria, targetPath))
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    trackEvent({
      eventType: "search_performed",
      path: "/api/recherche",
      metadata: { brand, format, zone, lat: criteria.lat, lng: criteria.lng },
    })

    try {
      const response: SearchResponse = await searchService.search(criteria)

      setResults(response.results as SearchResult[])

      trackEvent({
        eventType: "search_results_viewed",
        path: "/api/recherche",
        metadata: { resultCount: response.count, brand, format, zone },
      })
    } catch (error) {
      setError(
        error instanceof SearchError
          ? error.message
          : "La recherche n'a pas pu aboutir. Réessayez."
      )
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [brand, format, zone, session, router, redirectToResults, resultsPath, requestGeolocation])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runSearch()
  }

  const handleRetry = () => {
    runSearch()
  }

  const isGeoPending = geoState === "requesting"

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
              <GasBrandAutocomplete
                id="recherche-marque"
                value={brand}
                onValueChange={setBrand}
                className="mt-1.5 rounded-xl border border-input bg-background px-3 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
                {formats.map((item) => {
                  const badge =
                    item === "12,5 kg"
                      ? " ★ Le plus recherché"
                      : item === "6 kg"
                        ? " ★ Très recherché"
                        : ""
                  return (
                    <option key={item} value={item}>
                      {item}{badge}
                    </option>
                  )
                })}
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
                disabled={isGeoPending}
                onClick={() => {
                  void requestGeolocation()
                }}
              >
                {isGeoPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Détection…
                  </>
                ) : (
                  <>
                    <LocateFixed className="size-4" />
                    Utiliser ma position
                  </>
                )}
              </Button>
            </div>
            {locationLabel && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary" /> Position détectée&nbsp;: {locationLabel}
              </p>
            )}
            {geoState === "denied" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="size-3.5 text-muted-foreground" aria-hidden />
                Géolocalisation refusée — recherche dans tous les dépôts.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl border border-input bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Search className="size-4 mr-2" />
            {loading ? "Recherche…" : redirectToResults ? "Rechercher le gaz" : "Trouver du gaz"}
          </Button>
        </form>
      </Card>

      {!redirectToResults && loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
          <Search className="size-4 animate-spin text-white" aria-hidden />
          <span className="text-white">Recherche des disponibilités en cours…</span>
        </div>
      )}

      {!redirectToResults && error && (
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

      {!redirectToResults && results !== null && results.length > 0 && (
        <div className="mt-5">
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {results.length} disponibilit{results.length > 1 ? "és" : "é"} trouvée{results.length > 1 ? "s" : ""}
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((point) => (
              <ResultatRechercheCard
                key={point.id}
                id={point.id}
                name={point.name}
                district={point.district}
                address={point.address}
                brand={point.brand}
                format={point.format}
                status={point.status}
                disponibiliteId={point.disponibiliteId}
                onReserver={() => openReservationModal(point)}
              />
            ))}
          </div>
        </div>
      )}

      {!redirectToResults && results !== null && results.length === 0 && (
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

      {!redirectToResults && reservationPoint && (
        <ReservationModal
          open={!!reservationPoint}
          onClose={closeReservationModal}
          point={{ ...reservationPoint, maxQuantity: reservationPoint.quantity }}
          onConfirm={handleReserve}
        />
      )}
    </>
  )
}
