"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Download,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/app/_components/spinner";
import { cn } from "@/lib/utils";
import { requestJson } from "@/lib/client-request";
import {
  buildReservationHistoryHref,
  buildSearchHistoryHref,
  getReservationStatusLabel,
  isInHistoryDateRange,
  type HistoryDateFilter,
} from "@/lib/client-dashboard";
import { buildCsv, downloadCsv } from "@/lib/csv-export";
import { toast } from "sonner";

interface SearchHistoryItem {
  id: string;
  brand: string | null;
  format: string | null;
  zone: string | null;
  resultsCount: number;
  searchedAt: string;
}

interface ReservationHistoryItem {
  id: string;
  reservationCode: string;
  brand: string;
  format: string;
  quantity: number;
  amount: number;
  amountType: string;
  pointName: string;
  pointDistrict: string;
  status: string;
  reservedAt: string;
  collectedAt: string | null;
  cancelledAt: string | null;
}

type HistoryPagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type SearchHistoryResponse = {
  searches?: SearchHistoryItem[];
  pagination?: HistoryPagination;
};
type ReservationHistoryResponse = {
  reservations?: ReservationHistoryItem[];
  pagination?: HistoryPagination;
};

export default function HistoriquePage() {
  const [activeTab, setActiveTab] = useState<"searches" | "reservations">("searches");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<HistoryDateFilter>("all");

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistoryItem[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [reservationPage, setReservationPage] = useState(1);
  const [searchPagination, setSearchPagination] = useState<HistoryPagination>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [reservationPagination, setReservationPagination] = useState<HistoryPagination>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const [searchData, reservationData] = await Promise.all([
          requestJson<SearchHistoryResponse>(
            `/api/historique/searches?page=${searchPage}&pageSize=20`,
            {
              headers: { Accept: "application/json" },
              cache: "no-store",
              signal: controller.signal,
            }
          ),
          requestJson<ReservationHistoryResponse>(
            `/api/historique/reservations?page=${reservationPage}&pageSize=20`,
            {
              headers: { Accept: "application/json" },
              cache: "no-store",
              signal: controller.signal,
            }
          ),
        ]);

        if (cancelled) return;

        setSearchHistory(
          Array.isArray(searchData.searches) ? searchData.searches : []
        );
        setReservationHistory(
          Array.isArray(reservationData.reservations)
            ? reservationData.reservations
            : []
        );
        if (searchData.pagination) setSearchPagination(searchData.pagination);
        if (reservationData.pagination) {
          setReservationPagination(reservationData.pagination);
        }
      } catch (requestError) {
        if (cancelled) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Impossible de charger l'historique. Réessayez."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadAttempt, searchPage, reservationPage]);

  const filteredSearches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return searchHistory.filter((item) => {
      const matchesQuery =
        !query ||
        item.brand?.toLowerCase().includes(query) ||
        item.format?.toLowerCase().includes(query) ||
        item.zone?.toLowerCase().includes(query);

      return (
        matchesQuery &&
        isInHistoryDateRange(item.searchedAt, dateFilter)
      );
    });
  }, [dateFilter, searchHistory, searchQuery]);

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reservationHistory.filter((item) => {
      const matchesQuery =
        !query ||
        item.reservationCode.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.format.toLowerCase().includes(query) ||
        item.pointName.toLowerCase().includes(query) ||
        item.pointDistrict.toLowerCase().includes(query);

      return (
        matchesQuery &&
        isInHistoryDateRange(item.reservedAt, dateFilter)
      );
    });
  }, [dateFilter, reservationHistory, searchQuery]);

  const hasActiveFilters = searchQuery.trim().length > 0 || dateFilter !== "all";

  const fetchAllHistory = async () => {
    const exportPageSize = 100;
    const searchItems: SearchHistoryItem[] = [];
    const reservationItems: ReservationHistoryItem[] = [];

    let searchPageNumber = 1;
    let reservationPageNumber = 1;
    let searchDone = false;
    let reservationDone = false;

    while (!searchDone || !reservationDone) {
      const requests: Array<Promise<SearchHistoryResponse | ReservationHistoryResponse>> = [];

      if (!searchDone) {
        requests.push(
          requestJson<SearchHistoryResponse>(
            `/api/historique/searches?page=${searchPageNumber}&pageSize=${exportPageSize}`,
            { headers: { Accept: "application/json" }, cache: "no-store" }
          )
        );
      }
      if (!reservationDone) {
        requests.push(
          requestJson<ReservationHistoryResponse>(
            `/api/historique/reservations?page=${reservationPageNumber}&pageSize=${exportPageSize}`,
            { headers: { Accept: "application/json" }, cache: "no-store" }
          )
        );
      }

      const responses = await Promise.all(requests);
      let responseIndex = 0;
      if (!searchDone) {
        const response = responses[responseIndex++] as SearchHistoryResponse;
        const rows = Array.isArray(response.searches) ? response.searches : [];
        searchItems.push(...rows);
        searchDone =
          rows.length === 0 ||
          searchPageNumber >= (response.pagination?.totalPages ?? 0);
        if (!searchDone) searchPageNumber += 1;
      }
      if (!reservationDone) {
        const response = responses[responseIndex] as ReservationHistoryResponse;
        const rows = Array.isArray(response.reservations) ? response.reservations : [];
        reservationItems.push(...rows);
        reservationDone =
          rows.length === 0 ||
          reservationPageNumber >= (response.pagination?.totalPages ?? 0);
        if (!reservationDone) reservationPageNumber += 1;
      }
    }

    return { searchItems, reservationItems };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { searchItems, reservationItems } = await fetchAllHistory();
      const query = searchQuery.trim().toLowerCase();

      if (activeTab === "searches") {
        const rows = searchItems.filter((item) => {
          const matchesQuery =
            !query ||
            item.brand?.toLowerCase().includes(query) ||
            item.format?.toLowerCase().includes(query) ||
            item.zone?.toLowerCase().includes(query);
          return matchesQuery && isInHistoryDateRange(item.searchedAt, dateFilter);
        });
        const csv = buildCsv(
          ["Marque", "Format", "Zone", "Résultats", "Recherche le"],
          rows.map((item) => [
            item.brand,
            item.format,
            item.zone,
            item.resultsCount,
            item.searchedAt,
          ])
        );
        const date = new Date().toISOString().slice(0, 10);
        downloadCsv(`historique-recherches-${date}.csv`, csv);
        return;
      }

      const rows = reservationItems.filter((item) => {
        const matchesQuery =
          !query ||
          item.reservationCode.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.format.toLowerCase().includes(query) ||
          item.pointName.toLowerCase().includes(query) ||
          item.pointDistrict.toLowerCase().includes(query);
        return matchesQuery && isInHistoryDateRange(item.reservedAt, dateFilter);
      });
      const csv = buildCsv(
        [
          "Code",
          "Marque",
          "Format",
          "Quantité",
          "Montant",
          "Type de montant",
          "Point de vente",
          "District",
          "Statut",
          "Réservée le",
          "Collectée le",
          "Annulée le",
        ],
        rows.map((item) => [
          item.reservationCode,
          item.brand,
          item.format,
          item.quantity,
          item.amount,
          item.amountType,
          item.pointName,
          item.pointDistrict,
          getReservationStatusLabel(item.status),
          item.reservedAt,
          item.collectedAt,
          item.cancelledAt,
        ])
      );
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`historique-reservations-${date}.csv`, csv);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de l'export de l'historique"
      );
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
          <p className="text-muted-foreground">
            Consultez l&apos;historique de vos recherches et réservations
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav
          className="flex gap-1 px-1"
          aria-label="Sections de l'historique"
          role="tablist"
        >
          {[
            {
              id: "searches" as const,
              label: "Recherches",
              icon: <Search className="size-4" />,
            },
            {
              id: "reservations" as const,
              label: "Réservations",
              icon: <Calendar className="size-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:border-transparent"
              )}
            >
              <span className="flex size-5 items-center justify-center">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card className="border border-border shadow-sm rounded-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value as HistoryDateFilter)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toute la période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={
                exporting ||
                (activeTab === "searches"
                  ? filteredSearches.length === 0
                  : filteredReservations.length === 0)
              }
            >
              <Download className="size-4 mr-2" />
              {exporting ? "Export…" : "Exporter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card className="border border-border shadow-sm rounded-lg" aria-live="polite">
          <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner size="md" />
            Chargement de l&apos;historique…
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border border-destructive/30 shadow-sm rounded-lg" role="alert">
          <CardContent className="p-4 bg-destructive/5">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setLoadAttempt((value) => value + 1)}
            >
              <RefreshCw className="mr-2 size-3" aria-hidden />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && activeTab === "searches" && (
        <section aria-labelledby="search-history-heading">
          <h2 id="search-history-heading" className="sr-only">
            Historique des recherches
          </h2>
          {filteredSearches.length === 0 ? (
            <Card className="border border-border shadow-sm rounded-lg">
              <CardContent className="py-12 text-center">
                <Search className="mx-auto size-12 text-muted-foreground/50" aria-hidden />
                <h3 className="mt-4 font-semibold">
                  {hasActiveFilters
                    ? "Aucune recherche ne correspond aux filtres"
                    : "Aucune recherche pour le moment"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Modifiez la recherche ou la période sélectionnée."
                    : "Vos recherches de gaz apparaîtront ici."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <ol className="space-y-3">
              {filteredSearches.map((item) => (
                <li key={item.id} className="relative pl-5">
                  <span
                    className="absolute left-0 top-6 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/10"
                    aria-hidden
                  />
                  <Link
                    href={buildSearchHistoryHref(item)}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  >
                    <Card className="border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Search className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground truncate">
                                  {item.brand || "Toutes marques"}{" "}
                                  {item.format ? `— ${item.format}` : ""}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                                <MapPin className="size-3.5 shrink-0" />{" "}
                                {item.zone || "Toutes zones"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.resultsCount} résultat
                                {item.resultsCount > 1 ? "s" : ""} trouvé
                                {item.resultsCount > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {formatDateShort(item.searchedAt)}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-md">
                              <Search className="mr-1 size-3" /> Refaire
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {searchPagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {searchPagination.page} sur {searchPagination.totalPages} · {searchPagination.total} recherche{searchPagination.total > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchPage((current) => Math.max(1, current - 1))}
                  disabled={searchPage <= 1 || loading}
                >
                  <ChevronLeft className="size-4" /> Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchPage((current) => Math.min(searchPagination.totalPages, current + 1))}
                  disabled={searchPage >= searchPagination.totalPages || loading}
                >
                  Suivant <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {!loading && !error && activeTab === "reservations" && (
        <section aria-labelledby="reservation-history-heading">
          <h2 id="reservation-history-heading" className="sr-only">
            Historique des réservations
          </h2>
          {filteredReservations.length === 0 ? (
            <Card className="border border-border shadow-sm rounded-lg">
              <CardContent className="py-12 text-center">
                <Package className="mx-auto size-12 text-muted-foreground/50" aria-hidden />
                <h3 className="mt-4 font-semibold">
                  {hasActiveFilters
                    ? "Aucune réservation ne correspond aux filtres"
                    : "Aucune réservation pour le moment"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Modifiez la recherche ou la période sélectionnée."
                    : "Vos réservations apparaîtront ici."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <ol className="space-y-3">
              {filteredReservations.map((reservation) => (
                <li key={reservation.id} className="relative pl-5">
                  <span
                    className="absolute left-0 top-6 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/10"
                    aria-hidden
                  />
                  <Link
                    href={buildReservationHistoryHref(reservation.id)}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  >
                    <Card className="border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Package className="size-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground truncate">
                                  {reservation.brand} {reservation.format}
                                </p>
                                {reservation.amountType === "consigne" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Consigne
                                  </Badge>
                                )}
                                {reservation.amountType === "mixed" && (
                                  <Badge variant="outline" className="text-xs">
                                    Mixte
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {reservation.pointName} — {reservation.pointDistrict}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Code : {reservation.reservationCode}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge
                              variant={
                                reservation.status === "confirmed"
                                  ? "default"
                                  : reservation.status === "collected"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {getReservationStatusLabel(reservation.status)}
                            </Badge>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>Réservée : {formatDateShort(reservation.reservedAt)}</p>
                              {reservation.collectedAt && (
                                <p className="text-green-600">
                                  Récupérée : {formatDateShort(reservation.collectedAt)}
                                </p>
                              )}
                              {reservation.cancelledAt && (
                                <p className="text-red-600">
                                  Annulée : {formatDateShort(reservation.cancelledAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {reservationPagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {reservationPagination.page} sur {reservationPagination.totalPages} · {reservationPagination.total} réservation{reservationPagination.total > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReservationPage((current) => Math.max(1, current - 1))}
                  disabled={reservationPage <= 1 || loading}
                >
                  <ChevronLeft className="size-4" /> Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReservationPage((current) => Math.min(reservationPagination.totalPages, current + 1))}
                  disabled={reservationPage >= reservationPagination.totalPages || loading}
                >
                  Suivant <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
