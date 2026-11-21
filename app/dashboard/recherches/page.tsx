"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronDown,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GasBrandAutocomplete } from "@/app/_components/gas-brand-autocomplete";
import { formats } from "@/app/_components/donnees-demo";
import type { AvailabilityStatus } from "@/db/schema";
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal";
import { ResultatRechercheCard } from "@/app/_components/cards/resultat-recherche-card";
import { trackEvent } from "@/lib/analytics";
import { Spinner, ButtonSpinner } from "@/app/_components/spinner";
import {
  ClientRequestError,
  isUnauthenticatedRequest,
  requestJson,
} from "@/lib/client-request";

type SearchCriteria = {
  brand: string;
  format: string;
  zone: string;
};

type SearchApiResponse = {
  results?: SearchResult[];
};

export type SearchResult = {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string | null;
  brands: string[];
  formats: string[];
  status: AvailabilityStatus | null;
  note: string | null;
  quantity: number | null;
  price: number | null;
  format: string | null;
  brand: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  source: string | null;
  stale: boolean;
  expired: boolean;
  disponibiliteId: string;
  hasDelivery: boolean;
  hasExchange: boolean;
  hasGasSale: boolean;
  deliveryFee: number | null;
};

export function RechercheGaz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get("brand")?.trim() ?? "";
  const initialFormat = searchParams.get("format")?.trim() ?? "";
  const initialZone = searchParams.get("zone")?.trim() ?? "";
  const [brand, setBrand] = useState(initialBrand);
  const [format, setFormat] = useState(initialFormat);
  const [zone, setZone] = useState(initialZone);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationPoint, setReservationPoint] = useState<SearchResult | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const initialSearchAppliedRef = useRef(false);

  const handleReserve = async (
    disponibiliteId: string
  ): Promise<ReservationResult> => {
    if (!reservationPoint) {
      throw new Error("Aucun point sélectionné");
    }

    const data = await requestJson<{
      reservation: {
        code: string;
        expiresAt: string;
        amount: number;
        brand: string;
        format: string;
        quantity: number;
        pointName: string;
        pointDistrict: string;
        reservedAt: string;
      };
    }>(
      "/api/reservation/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disponibiliteId,
          brand: reservationPoint.brand,
          format: reservationPoint.format,
          quantity: 1,
          amountType: "reservation",
        }),
      }
    );

    return {
      code: data.reservation.code,
      expiresAt: data.reservation.expiresAt,
      amount: data.reservation.amount,
      brand: data.reservation.brand,
      format: data.reservation.format,
      quantity: data.reservation.quantity,
      pointName: data.reservation.pointName,
      pointDistrict: data.reservation.pointDistrict,
      reservedAt: data.reservation.reservedAt,
    };
  };

  const openReservationModal = (point: SearchResult) => {
    setReservationPoint(point);
  };

  const closeReservationModal = () => {
    setReservationPoint(null);
  };

  const runSearch = useCallback(async (criteria?: SearchCriteria) => {
    const effectiveCriteria = criteria ?? { brand, format, zone };

    // La mise à jour de l'état commence après la phase de synchronisation de
    // l'effet. La requête elle-même reste immédiatement annulable.
    await Promise.resolve()

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    const params = new URLSearchParams();
    if (effectiveCriteria.brand) params.set("brand", effectiveCriteria.brand);
    if (effectiveCriteria.format) params.set("format", effectiveCriteria.format);
    if (effectiveCriteria.zone) params.set("zone", effectiveCriteria.zone);
    params.set("history", "1");

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await requestJson<SearchApiResponse>(
        `/api/recherche?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      const searchedResults: SearchResult[] = (data.results ?? []).map(
        (result) => ({
          ...result,
          hasDelivery: Boolean(result.hasDelivery),
          hasExchange: Boolean(result.hasExchange),
          hasGasSale: Boolean(result.hasGasSale),
          deliveryFee:
            typeof result.deliveryFee === "number" ? result.deliveryFee : null,
        })
      );

      setResults(searchedResults);

      trackEvent({
        eventType: "search_results_viewed",
        path: "/dashboard/recherches",
        metadata: {
          resultCount: searchedResults.length,
          brand: effectiveCriteria.brand,
          format: effectiveCriteria.format,
          zone: effectiveCriteria.zone,
        },
      });
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        (requestError instanceof ClientRequestError &&
          requestError.kind === "aborted")
      ) {
        return;
      }

      if (isUnauthenticatedRequest(requestError)) {
        router.replace(
          `/connexion?redirect=${encodeURIComponent("/dashboard/recherches")}`
        );
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "La recherche n'a pas pu aboutir. Vérifiez votre connexion et réessayez."
      );
      setResults(null);
    } finally {
      if (requestControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [brand, format, zone, router]);

  useEffect(() => {
    if (initialSearchAppliedRef.current) return;

    const initialCriteria: SearchCriteria = {
      brand,
      format,
      zone,
    };

    if (
      !initialCriteria.brand &&
      !initialCriteria.format &&
      !initialCriteria.zone
    ) {
      initialSearchAppliedRef.current = true;
      return;
    }

    const startTimer = window.setTimeout(() => {
      if (initialSearchAppliedRef.current) return;
      initialSearchAppliedRef.current = true;
      void runSearch(initialCriteria);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [brand, format, zone, runSearch]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch();
  }

  const handleRetry = () => {
    void runSearch();
  };

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
                  setZone(event.target.value);
                  setLocationLabel(null);
                }}
                placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
                className="mt-1.5 h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 gap-2 cursor-pointer"
                onClick={() => {
                  setZone("Douala");
                  setLocationLabel("Ma position actuelle");
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
            {loading ? (
              <>
                <ButtonSpinner />
                Recherche…
              </>
            ) : (
              <>
                <Search className="size-4 mr-2" />
                Trouver du gaz
              </>
            )}
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
          <Spinner size="md" />
          <span className="text-white">Recherche des disponibilités en cours…</span>
        </div>
      )}

      {error && (
        <div className="mt-5 bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
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
        />
      )}
    </>
  );
}
export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Chargement de la recherche…
        </div>
      }
    >
      <RechercheGaz />
    </Suspense>
  );
}
