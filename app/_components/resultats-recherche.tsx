"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  LogIn,
  MapPin,
  RefreshCw,
  Search,
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
  searchService,
  type SearchCriteria,
  type SearchResultItem,
} from "@/lib/search-service"

type ViewState = "loading" | "results" | "empty" | "error" | "auth"

function Criterion({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  )
}

/** Formulaire de recherche utilisé directement sur la page de résultats. */
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(
      searchService.normalizeCriteria({
        brand: brand || undefined,
        format,
        zone: zone || undefined,
      })
    )
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
              }}
              placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
              className="h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 gap-2"
              onClick={() => {
                setZone("Douala")
                setLocationLabel("Ma position actuelle")
              }}
            >
              <LocateFixed className="size-4" aria-hidden />
              Utiliser ma position
            </Button>
          </div>
          {locationLabel && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden />
              Position détectée&nbsp;: {locationLabel}
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
 * Page de résultats native de l'espace client. Elle consomme le même moteur
 * (`searchService` → `/api/recherche`) que le formulaire de la landing, mais
 * le formulaire est intégré ici : une nouvelle recherche met à jour l'URL et
 * les résultats sans quitter cette page.
 */
export function ResultatsRecherche() {
  const params = useSearchParams()
  const router = useRouter()
  const brand = params.get("brand")?.trim() ?? ""
  const format = params.get("format")?.trim() ?? ""
  const zone = params.get("zone")?.trim() ?? ""

  const criteria = useMemo(
    () =>
      searchService.normalizeCriteria({
        brand: brand || undefined,
        format,
        zone: zone || undefined,
      }),
    [brand, format, zone]
  )

  const { data: session, isPending } = useSafeSession()
  const userId = session?.user?.id ?? null

  const [results, setResults] = useState<SearchResultItem[]>([])
  const [fetchState, setFetchState] = useState<ViewState>("loading")
  const [settledRequestKey, setSettledRequestKey] = useState<string | null>(
    null
  )
  const [reservationPoint, setReservationPoint] =
    useState<SearchResultItem | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [, startTransition] = useTransition()

  const requestKey = useMemo(
    () => JSON.stringify([brand, format, zone, attempt]),
    [brand, format, zone, attempt]
  )

  // L'état d'authentification est dérivé de la session. L'état de chargement
  // est lui aussi dérivé : tant que la réponse ne correspond pas à la requête
  // courante, aucune mutation d'état synchrone n'est nécessaire dans l'effet.
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
        setResults(response.results)
        setFetchState(response.results.length > 0 ? "results" : "empty")
        setSettledRequestKey(requestKey)
        trackEvent({
          eventType: "search_results_viewed",
          path: "/resultats-recherche",
          metadata: { resultCount: response.count, brand, format, zone },
        })
      })
      .catch(() => {
        if (cancelled) return
        setResults([])
        setFetchState("error")
        setSettledRequestKey(requestKey)
      })

    return () => {
      cancelled = true
    }
  }, [criteria, brand, format, zone, isPending, userId, attempt, requestKey])

  const handleSearch = useCallback(
    (nextCriteria: SearchCriteria) => {
      trackEvent({
        eventType: "search_performed",
        path: "/resultats-recherche",
        metadata: {
          brand: nextCriteria.brand ?? "",
          format: nextCriteria.format ?? "",
          zone: nextCriteria.zone ?? "",
        },
      })
      setFetchState("loading")

      const nextUrl = searchService.buildResultsUrl(nextCriteria)
      // Critères identiques : l'URL ne change pas, on relance donc la requête.
      if (nextUrl === searchService.buildResultsUrl(criteria)) {
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

      const res = await fetch("/api/reservation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disponibiliteId,
          brand: reservationPoint.brand,
          format: reservationPoint.format,
          quantity: 1,
          amountType: "reservation",
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erreur lors de la réservation")
      }

      const reservation = data.reservation
      return {
        code: reservation.code,
        expiresAt: reservation.expiresAt,
        amount: reservation.amount,
        brand: reservation.brand,
        format: reservation.format,
        quantity: reservation.quantity,
        pointName: reservation.pointName,
        pointDistrict: reservation.pointDistrict,
        reservedAt: reservation.reservedAt,
      }
    },
    [reservationPoint]
  )

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Search className="size-3.5" aria-hidden />
            Recherche de gaz
          </p>
          <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Résultats de votre recherche
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez vos critères ci-dessous pour actualiser les points de vente
            sans quitter cette page.
          </p>
        </div>

        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <Criterion label="Marque" value={brand || "Toutes les marques"} />
          <Criterion label="Format de bouteille" value={format || "Tous les formats"} />
          {zone && <Criterion label="Zone" value={zone} />}
        </div>
      </Card>

      <SearchForm
        key={`${brand}|${format}|${zone}`}
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
              Vérifiez votre connexion, puis réessayez ou modifiez vos critères.
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
              Aucun gaz disponible pour ces critères
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Essayez une autre marque, un autre format ou une autre zone, ou
              réessayez un peu plus tard.
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

        {state === "results" && (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              {results.length} point{results.length > 1 ? "s" : ""} trouvé
              {results.length > 1 ? "s" : ""}
            </p>
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
