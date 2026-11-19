"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  LogIn,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ResultatRechercheCard } from "@/app/_components/cards/resultat-recherche-card"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"
import { useSafeSession } from "@/lib/auth-session"
import { trackEvent } from "@/lib/analytics"
import {
  searchService,
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

/**
 * Page de résultats indépendante : elle consomme exactement le même moteur
 * (`searchService` → `/api/recherche`) que le formulaire de la landing.
 * Les critères sont lus dans l'URL, ce qui rend la page partageable et
 * rechargeable sans perte.
 */
export function ResultatsRecherche() {
  const params = useSearchParams()
  const brand = params.get("brand")?.trim() ?? ""
  const format = params.get("format")?.trim() ?? ""
  const zone = params.get("zone")?.trim() ?? ""

  const criteria = searchService.normalizeCriteria({
    brand: brand || undefined,
    format,
    zone: zone || undefined,
  })
  const resultsHref = searchService.buildResultsUrl(criteria)
  const editHref = searchService.buildEditSearchUrl(criteria)
  const loginHref = `/connexion?redirect=${encodeURIComponent(resultsHref)}`

  const { data: session, isPending } = useSafeSession()
  const userId = session?.user?.id ?? null

  const [results, setResults] = useState<SearchResultItem[]>([])
  const [fetchState, setFetchState] = useState<
    Exclude<ViewState, "auth">
  >("loading")
  const [reservationPoint, setReservationPoint] =
    useState<SearchResultItem | null>(null)
  const [attempt, setAttempt] = useState(0)

  // L'état d'authentification est dérivé de la session : aucun setState
  // synchrone dans un effet, conformément aux règles React 19.
  const state: ViewState = !isPending && !userId ? "auth" : fetchState

  useEffect(() => {
    if (isPending || !userId) return

    let cancelled = false

    searchService
      .search(
        searchService.normalizeCriteria({
          brand: brand || undefined,
          format,
          zone: zone || undefined,
        })
      )
      .then((response) => {
        if (cancelled) return
        setResults(response.results)
        setFetchState(response.results.length > 0 ? "results" : "empty")
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
      })

    return () => {
      cancelled = true
    }
  }, [brand, format, zone, isPending, userId, attempt])

  const openReservationModal = (point: SearchResultItem) => {
    setReservationPoint(point)
  }

  const handleReserve = useCallback(
    async (
      disponibiliteId: string
    ): Promise<ReservationResult> => {
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
    <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
      {/* En-tête + résumé des critères */}
      <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              <Search className="size-3.5" aria-hidden />
              Recherche de gaz
            </p>
            <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Résultats de votre recherche
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Voici les points de vente correspondant à vos critères.
            </p>
          </div>

          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={editHref} />}
            className="h-10 w-full shrink-0 gap-2 rounded-xl sm:w-auto"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Modifier ma recherche
          </Button>
        </div>

        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <Criterion label="Marque" value={brand || "Toutes les marques"} />
          <Criterion label="Format de bouteille" value={format || "Tous les formats"} />
          {zone && <Criterion label="Zone" value={zone} />}
        </div>
      </Card>

      {/* Résultats */}
      <section className="mt-6 sm:mt-8" aria-live="polite">
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-14 text-center shadow-sm">
            <Search className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Recherche des disponibilités en cours…
            </p>
          </div>
        )}

        {state === "auth" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center shadow-sm">
            <LogIn className="size-10 text-primary" aria-hidden />
            <p className="mt-4 text-base font-semibold text-foreground">
              Connectez-vous pour consulter vos résultats
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              La recherche de disponibilités est réservée aux comptes GazPoints.
            </p>
            <Button
              nativeButton={false}
              render={<Link href={loginHref} />}
              className="mt-6 h-11 w-full rounded-xl sm:w-auto"
            >
              Se connecter
            </Button>
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
            <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                setFetchState("loading")
                setAttempt((value) => value + 1)
              }}
                className="h-11 w-full gap-2 rounded-xl sm:w-auto"
              >
                <RefreshCw className="size-4" aria-hidden />
                Réessayer
              </Button>
              <Button
                nativeButton={false}
                render={<Link href={editHref} />}
                className="h-11 w-full gap-2 rounded-xl sm:w-auto"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Modifier ma recherche
              </Button>
            </div>
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
            <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                setFetchState("loading")
                setAttempt((value) => value + 1)
              }}
                className="h-11 w-full gap-2 rounded-xl sm:w-auto"
              >
                <RefreshCw className="size-4" aria-hidden />
                Relancer la recherche
              </Button>
              <Button
                nativeButton={false}
                render={<Link href={editHref} />}
                className="h-11 w-full gap-2 rounded-xl sm:w-auto"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Modifier ma recherche
              </Button>
            </div>
          </div>
        )}

        {state === "results" && (
          <>
            <p className="mb-4 text-sm font-medium text-muted-foreground">
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
