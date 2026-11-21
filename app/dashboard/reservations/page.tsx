"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Filter, X, Download, Package, Clock, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/app/_components/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { requestJson } from "@/lib/client-request"
import { getReservationStatusLabel } from "@/lib/client-dashboard"
import { buildCsv, downloadCsv } from "@/lib/csv-export"
import { toast } from "sonner"

interface Reservation {
  id: string
  reservationCode: string
  status: "confirmed" | "collected" | "cancelled" | "pending" | "expired"
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: "reservation" | "consigne" | "mixed"
  pointName: string
  pointDistrict: string
  reservedAt: string
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
}

type ReservationApiResponse = {
  reservations?: Array<Partial<Reservation> & { id: string }>
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

const PAGE_SIZE = 20

function normalizeReservation(
  reservation: Partial<Reservation> & { id: string }
): Reservation {
  return {
    id: reservation.id,
    reservationCode: reservation.reservationCode ?? "",
    status: (reservation.status ?? "pending") as Reservation["status"],
    brand: reservation.brand ?? "",
    format: reservation.format ?? "",
    quantity: reservation.quantity ?? 1,
    amount: reservation.amount ?? 0,
    amountType:
      (reservation.amountType ?? "reservation") as Reservation["amountType"],
    pointName: reservation.pointName ?? "—",
    pointDistrict: reservation.pointDistrict ?? "",
    reservedAt: reservation.reservedAt ?? new Date().toISOString(),
    collectedAt: reservation.collectedAt ?? null,
    cancelledAt: reservation.cancelledAt ?? null,
    expiresAt: reservation.expiresAt ?? null,
  }
}

function ReservationsPageContent() {
  const searchParams = useSearchParams()
  const selectedReservationId = searchParams.get("reservation")
  const legacySearch = searchParams.get("search")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState(legacySearch ?? "")
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc">("date_desc")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [filterStatus, selectedReservationId])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function loadReservations() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (selectedReservationId) params.set("reservation", selectedReservationId)
        params.set("page", String(page))
        params.set("pageSize", String(PAGE_SIZE))

        const data = await requestJson<ReservationApiResponse>(
          `/api/reservation/my?${params.toString()}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        )

        if (cancelled) return

        setReservations(
          (data.reservations ?? []).map(normalizeReservation)
        )
        setTotal(data.pagination?.total ?? 0)
        setTotalPages(data.pagination?.totalPages ?? 0)
      } catch (requestError) {
        if (cancelled) return
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erreur lors du chargement des réservations"
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReservations()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [filterStatus, loadAttempt, page, selectedReservationId])

  const filteredReservations = reservations
    .filter((r) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          r.reservationCode.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.pointName.toLowerCase().includes(query) ||
          r.pointDistrict.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.reservedAt).getTime() - new Date(b.reservedAt).getTime()
      return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
    })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: getReservationStatusLabel(status), variant: "default" as const, icon: <CheckCircle2 className="size-3" /> }
      case "collected":
        return { label: getReservationStatusLabel(status), variant: "secondary" as const, icon: <CheckCircle2 className="size-3" /> }
      case "cancelled":
        return { label: getReservationStatusLabel(status), variant: "destructive" as const, icon: <AlertCircle className="size-3" /> }
      case "pending":
        return { label: getReservationStatusLabel(status), variant: "outline" as const, icon: <Clock className="size-3" /> }
      case "expired":
        return { label: getReservationStatusLabel(status), variant: "destructive" as const, icon: <AlertCircle className="size-3" /> }
      default:
        return { label: getReservationStatusLabel(status), variant: "outline" as const, icon: null }
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm("Annuler cette réservation ? Le stock sera libéré.")) return
    try {
      await requestJson<{ ok: boolean; message?: string }>(
        "/api/reservation/cancel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: id }),
        }
      )
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "cancelled", cancelledAt: new Date().toISOString() } : r))
      toast.success("Réservation annulée")
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de l'annulation"
      )
    }
  }

  const fetchAllReservations = async (): Promise<Reservation[]> => {
    const allReservations: Reservation[] = []
    const exportPageSize = 100
    let currentPage = 1

    while (true) {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      params.set("page", String(currentPage))
      params.set("pageSize", String(exportPageSize))

      const data = await requestJson<ReservationApiResponse>(
        `/api/reservation/my?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      )
      const rows = (data.reservations ?? []).map(normalizeReservation)
      allReservations.push(...rows)

      const totalPages = data.pagination?.totalPages ?? 0
      if (rows.length === 0 || currentPage >= totalPages) break
      currentPage += 1
    }

    return allReservations
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const allReservations = await fetchAllReservations()
      const query = searchQuery.trim().toLowerCase()
      const exportedReservations = allReservations.filter((reservation) => {
        if (!query) return true
        return (
          reservation.reservationCode.toLowerCase().includes(query) ||
          reservation.brand.toLowerCase().includes(query) ||
          reservation.pointName.toLowerCase().includes(query) ||
          reservation.pointDistrict.toLowerCase().includes(query)
        )
      })
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
          "Expire le",
        ],
        exportedReservations.map((reservation) => [
          reservation.reservationCode,
          reservation.brand,
          reservation.format,
          reservation.quantity,
          reservation.amount,
          reservation.amountType,
          reservation.pointName,
          reservation.pointDistrict,
          getReservationStatusLabel(reservation.status),
          reservation.reservedAt,
          reservation.collectedAt,
          reservation.cancelledAt,
          reservation.expiresAt,
        ])
      )
      const date = new Date().toISOString().slice(0, 10)
      downloadCsv(`reservations-${date}.csv`, csv)
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de l'export des réservations"
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes réservations</h1>
          <p className="text-muted-foreground">Suivez et gérez vos réservations de bouteilles de gaz</p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard/recherches">
          <Package className="size-4 mr-2" /> Nouvelle réservation
        </Link>} />
      </div>

      {/* Error state */}
      {error && (
        <Card className="border border-border shadow-sm rounded-lg">
          <CardContent className="p-4 bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadAttempt((value) => value + 1)}
              className="mt-3"
              disabled={loading}
            >
              <RefreshCw className="size-3 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border border-border shadow-sm rounded-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, marque, point de vente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                if (value !== null) setFilterStatus(value)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="collected">Récupérées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                if (value === "date_desc" || value === "date_asc") {
                  setSortBy(value)
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes</SelectItem>
                <SelectItem value="date_asc">Plus anciennes</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={exporting || filteredReservations.length === 0}
            >
              <Download className="size-4 mr-2" />
              {exporting ? "Export…" : "Exporter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Reservations list */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card className="border border-border shadow-sm rounded-lg">
              <CardContent className="py-12 text-center">
                <Package className="size-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">
                  {selectedReservationId
                    ? "Réservation introuvable"
                    : "Aucune réservation"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReservationId
                    ? "Cette réservation n'existe plus ou n'est pas accessible depuis votre compte."
                    : searchQuery || filterStatus !== "all"
                      ? "Aucune réservation ne correspond à vos filtres."
                      : "Vous n'avez pas encore de réservations. Commencez par rechercher du gaz !"}
                </p>
                <Button render={<Link href="/dashboard/recherches">Rechercher du gaz</Link>} className="mt-4" variant="outline" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((res) => (
                <Card
                  key={res.id}
                  className="border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground truncate">{res.brand} {res.format}</p>
                            {res.amountType === "consigne" && (
                              <Badge variant="secondary" className="text-xs">Consigne</Badge>
                            )}
                            {res.amountType === "mixed" && (
                              <Badge variant="outline" className="text-xs">Mixte</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {res.pointName} — {res.pointDistrict}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Code : {res.reservationCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              res.status === "confirmed" ? "default" :
                              res.status === "collected" ? "secondary" :
                              res.status === "cancelled" ? "destructive" :
                              res.status === "pending" ? "outline" : "destructive"
                            }
                            className="group-hover:bg-primary/90 group-hover:text-primary-foreground"
                          >
                            {getStatusConfig(res.status).label}
                          </Badge>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0 min-w-[200px]">
                          <p>Réservée : {new Date(res.reservedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>
                          {res.expiresAt && <p>Expire : {new Date(res.expiresAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                          {res.collectedAt && <p className="text-green-600">Récupérée : {new Date(res.collectedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                          {res.cancelledAt && <p className="text-red-600">Annulée : {new Date(res.cancelledAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                        </div>
                        {res.status === "confirmed" && (
                          <Button variant="outline" size="sm" onClick={() => handleCancel(res.id)} className="mt-2">
                            <X className="size-3 mr-1" /> Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages} · {total} réservation{total > 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="size-4" /> Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page >= totalPages || loading}
                    >
                      Suivant <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Chargement des réservations…
        </div>
      }
    >
      <ReservationsPageContent />
    </Suspense>
  )
}