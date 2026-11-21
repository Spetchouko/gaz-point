"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  LogIn,
  MapPin,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GasBrandAutocomplete } from "@/app/_components/gas-brand-autocomplete"
import { Input } from "@/components/ui/input"
import { ResultatRechercheCard } from "@/app/_components/cards/resultat-recherche-card"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"
import { formats } from "@/app/_components/donnees-demo"
import { useSafeSession } from "@/lib/auth-session"
import { trackEvent } from "@/lib/analytics"
import {
  normalizeCoordinate,
  SearchError,
  searchService,
  type SearchCriteria,
  type SearchResultItem,
} from "@/lib/search-service"
import { RESULTS_PATH } from "@/lib/auth-routing"

import { createClientReservation } from "@/lib/client-reservation"

type ViewState =
  | "loading"
  | "results"
  | "empty"
  | "error"
  | "auth"
  | "unauthorized"

type ResultatsRechercheState = {
  view: ViewState
  errorMessage?: string
}

type RequestError = { code: string; status?: number; message: string }

/**
 * Formulaire de recherche utilisé directement sur la page de résultats.
 */
function SearchForm({
  initialBrand,
  initialFormat,
  initialZone,
  isSubmitting,
  onSearch,
}: {
  initialBrand: string
  initialFormat: string
  initialZone: string
  isSubmitting: boolean
  onSearch: (criteria: SearchCriteria) => void
}) {
  const [brand, setBrand] = useState(initialBrand)
  const [format, setFormat] = useState(initialFormat)
  const [zone, setZone] = useState(initialZone)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [geoState, setGeoState] = useState<
    "idle" | "requesting" | "granted" | "denied" | "unavailable"
  >("idle")
  const [coordinates, setCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(
      searchService.normalizeCriteria({
        brand: brand || undefined,
        format,
        zone: zone || undefined,
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
      })
    )
  }

  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
      setGeoState("unavailable")
      return
    }
    setGeoState("requesting")
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation!.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })
      const lat = normalizeCoordinate(position.coords.latitude, 90)
      const lng = normalizeCoordinate(position.coords.longitude, 180)
      if (lat == null || lng == null) {
        setGeoState("unavailable")
        return
      }
      setCoordinates({ lat, lng })
      setGeoState("granted")
      setLocationLabel("Ma position actuelle")
    } catch {
      setGeoState("denied")
    }
  }

  return (
    <Card id="recherche-gaz" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
            Quelle bouteille cherchez-vous&nbsp;?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBrand("")
              setFormat("")
              setZone("")
              setLocationLabel(null)
              setCoordinates(null)
              setGeoState("idle")
              onSearch(searchService.normalizeCriteria({ format: "" }))
            }}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Réinitialiser
          </Button>
        </div>

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
              className="mt-1.5 h-12 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-12 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
              aria-hidden
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
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              id="recherche-zone"
              type="text"
              value={zone}
              onChange={(event) => {
                setZone(event.target.value)
                setLocationLabel(null)
                setCoordinates(null)
                setGeoState("idle")
              }}
              placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
              className="h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 gap-2"
              disabled={geoState === "requesting"}
              onClick={handleGeolocate}
            >
              {geoState === "requesting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Détection…
                </>
              ) : (
                <>
                  <LocateFixed className="size-4" aria-hidden />
                  Utiliser ma position
                </>
              )}
            </Button>
          </div>
          {locationLabel && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden />
              Position détectée&nbsp;: {locationLabel}
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
          className="h-12 w-full rounded-xl border border-input bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        >
          <Search className="mr-2 size-4" aria-hidden />
          {isSubmitting ? "Recherche…" : "Rechercher le gaz"}
        </Button>
      </form>
    </Card>
  )
}

/**
 * Page de résultats native de l'espace client.
 */
export function ResultatsRecherche() {
  const params = useSearchParams()
  const router = useRouter()
  const brand = params.get("brand")?.trim() ?? ""
  const format = params.get("format")?.trim() ?? ""
  const zone = params.get("zone")?.trim() ?? ""
  const latParam = params.get("lat")
  const lngParam = params.get("lng")
  const userLat = latParam ? Number(latParam) : null
  const userLng = lngParam ? Number(lngParam) : null

  const criteria = useMemo(
    () =>
      searchService.normalizeCriteria({
        brand: brand || undefined,
        format,
        zone: zone || undefined,
        lat: userLat != null && !Number.isNaN(userLat) ? userLat : null,
        lng: userLng != null && !Number.isNaN(userLng) ? userLng : null,
      }),
    [brand, format, zone, userLat, userLng]
  )

  const { data: session, isPending } = useSafeSession()
  const userId = session?.user?.id ?? null

  const [results, setResults] = useState<SearchResultItem[]>([])
  const [fetchState, setFetchState] = useState<ViewState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [settledRequestKey, setSettledRequestKey] = useState<string | null>(null)
  const [reservationPoint, setReservationPoint] =
    useState<SearchResultItem | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [, startTransition] = useTransition()

  const requestKey = useMemo(
    () => JSON.stringify([brand, format, zone, userLat, userLng, attempt]),
    [brand, format, zone, userLat, userLng, attempt]
  )

  const state: ViewState =
    !isPending && !userId
      ? "auth"
      : settledRequestKey === requestKey
        ? fetchState
        : "loading"

  useEffect(() => {
    if (isPending || !userId) return

    let cancelled = false

    searchService
      .search(criteria)
      .then((response) => {
        if (cancelled) return
        // Enrichir avec distance côté client si nécessaire
        const resultsWithDistance = response.results.map((item) => {
          if (item.distanceKm != null) return item
          return item
        })
        setResults(resultsWithDistance)
        // 200 OK avec un tableau vide → état vide, jamais une erreur technique
        setFetchState(resultsWithDistance.length > 0 ? "results" : "empty")
        setSettledRequestKey(requestKey)
        trackEvent({
          eventType: "search_results_viewed",
          path: "/resultats-recherche",
          metadata: { resultCount: response.count, brand, format, zone },
        })
      })
      .catch((error) => {
        if (cancelled) return
        // Classer l'erreur par code SearchError
        if (error instanceof SearchError) {
          const { code, status } = error
          // NETWORK_ERROR → message connexion Internet (justifié)
          // AUTH_REQUIRED → redirection vers connexion (déjà géré par la garde serveur, mais on l'affiche ici si on y arrive)
          // SERVER_ERROR → erreur serveur, réessayer plus tard
          // SEARCH_FAILED → échec de la recherche, réessayer
          // INVALID_RESPONSE → réponse malformée, message contractuel
          if (code === "NETWORK_ERROR") {
            setFetchState("error")
            setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion Internet, puis réessayez.")
          } else if (code === "AUTH_REQUIRED") {
            setFetchState("auth")
            setErrorMessage(error.message ?? "Votre session a expiré. Reconnectez-vous pour consulter vos résultats.")
          } else if (code === "SERVER_ERROR" || code === "SEARCH_FAILED") {
            setFetchState("error")
            setErrorMessage("La recherche n'a pas pu aboutir. Réessayez plus tard.")
          } else if (code === "INVALID_RESPONSE") {
            setFetchState("error")
            setErrorMessage("La réponse du serveur est invalide. Contactez l'administration.")
          } else {
            setFetchState("error")
            setErrorMessage(error.message ?? "Une erreur inattendue est survenue.")
          }
        } else {
          // Erreur non SearchError (ex: DOMException abort) → réseau
          setFetchState("error")
          setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion Internet, puis réessayez.")
        }
        setSettledRequestKey(requestKey)
      })

    return () => {
      cancelled = true
    }
  }, [criteria, brand, format, zone, userLat, userLng, isPending, userId, attempt, requestKey])

  const handleSearch = useCallback(
    (nextCriteria: SearchCriteria) => {
      trackEvent({
        eventType: "search_performed",
        path: "/resultats-recherche",
        metadata: {
          brand: nextCriteria.brand ?? "",
          format: nextCriteria.format ?? "",
          zone: nextCriteria.zone ?? "",
          lat: nextCriteria.lat ?? null,
          lng: nextCriteria.lng ?? null,
        },
      })
      setFetchState("loading")
      setErrorMessage(undefined)

      const targetPath = RESULTS_PATH
      const nextUrl = searchService.buildResultsUrl(nextCriteria, targetPath)
      if (nextUrl === searchService.buildResultsUrl(criteria, targetPath)) {
        setAttempt((value) => value + 1)
        return
      }

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    },
    [criteria, router]
  )

  const openReservationModal = (point: SearchResultItem) => {
    setReservationPoint(point)
  }

  const handleReserve = useCallback(
    async (disponibiliteId: string): Promise<ReservationResult> => {
      if (!reservationPoint) {
        throw new Error("Aucun point sélectionné")
      }

      return createClientReservation({
        disponibiliteId,
        brand: reservationPoint.brand,
        format: reservationPoint.format,
        quantity: 1,
        amountType: "reservation",
      })
    },
    [reservationPoint]
  )

  return (
    <div className="space-y-6">
      <SearchForm
        key={`${brand}|${format}|${zone}|${userLat}|${userLng}`}
        initialBrand={brand}
        initialFormat={format}
        initialZone={zone}
        isSubmitting={state === "loading"}
        onSearch={handleSearch}
      />

      <section className="space-y-4" aria-live="polite">
        {state === "auth" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
            <LogIn className="size-10 text-primary" aria-hidden />
            <p className="mt-4 text-base font-semibold text-foreground">
              Connectez-vous pour consulter vos résultats
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              La recherche de disponibilités est réservée aux clients GazPoints.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/connexion" />}
              className="mt-6 h-11 w-full rounded-xl sm:w-auto"
            >
              Se connecter
            </Button>
          </div>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-14 text-center shadow-sm">
            <Search className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Recherche des disponibilités en cours…
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
            <AlertCircle className="size-10 text-destructive" aria-hidden />
            <p className="mt-4 text-base font-semibold text-foreground">
              La recherche n&apos;a pas pu aboutir
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {errorMessage ?? "Vérifiez votre connexion, puis réessayez ou modifiez vos critères."}
            </p>
            <Button
              onClick={() => {
                setFetchState("loading")
                setAttempt((value) => value + 1)
              }}
              className="mt-6 h-11 w-full gap-2 rounded-xl sm:w-auto"
            >
              <RefreshCw className="size-4" aria-hidden />
              Réessayer
            </Button>
          </div>
        )}

        {state === "empty" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
            <Search className="size-10 text-primary" aria-hidden />
            <p className="mt-4 text-base font-bold text-foreground">
              Aucune disponibilité trouvée pour le moment.
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Nous n&apos;avons pas encore trouvé de point de vente correspondant à votre recherche. Nous vous invitons à réessayer ultérieurement.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFetchState("loading")
                setAttempt((value) => value + 1)
              }}
              className="mt-6 h-11 w-full gap-2 rounded-xl sm:w-auto"
            >
              <RefreshCw className="size-4" aria-hidden />
              Relancer la recherche
            </Button>
          </div>
        )}

        {state === "auth" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
            <LogIn className="size-10 text-primary" aria-hidden />
            <p className="mt-4 text-base font-semibold text-foreground">
              Connectez-vous pour consulter vos résultats
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              La recherche de disponibilités est réservée aux clients GazPoints.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/connexion" />}
              className="mt-6 h-11 w-full rounded-xl sm:w-auto"
            >
              Se connecter
            </Button>
          </div>
        )}

        {state === "results" && (
          <>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Vos résultats de recherche
            </h1>
            <div className="resultats-grid grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {results.map((point) => (
                <ResultatRechercheCard
                  key={point.id}
                  id={point.id}
                  name={point.name}
                  district={point.district}
                  address={point.address}
                  phone={point.phone}
                  displayPhone={point.phone}
                  brand={point.brand}
                  format={point.format}
                  status={point.status}
                  disponibiliteId={point.disponibiliteId}
                  hasDelivery={point.hasDelivery}
                  hasExchange={point.hasExchange}
                  hasGasSale={point.hasGasSale}
                  deliveryFee={point.deliveryFee}
                  distanceKm={point.distanceKm}
                  onReserver={() => openReservationModal(point)}
                  className="h-full"
                />
              ))}
            </div>
          </>
        )}
      </section>

      {reservationPoint && (
        <ReservationModal
          open
          onClose={() => setReservationPoint(null)}
          point={reservationPoint}
          onConfirm={handleReserve}
        />
      )}
    </div>
  )
}
