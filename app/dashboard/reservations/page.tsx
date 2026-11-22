"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  Package,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/app/_components/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { requestJson } from "@/lib/client-request"
import { getReservationStatusLabel } from "@/lib/client-dashboard"
import { buildCsv, downloadCsv } from "@/lib/csv-export"
import {
  RESERVATION_UNIT_AMOUNT,
  calculateReservationAmount,
} from "@/lib/reservation-amount"

interface Reservation {
  id: string
  reservationCode: string
  status: "confirmed" | "collected" | "cancelled" | "pending" | "expired"
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: "reservation" | "consigne" | "mixed"
  paymentStatus: string
  reservedAt: string
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
  qrCode: string | null
  pointName: string
  pointDistrict: string
  pointCity: string
}

interface ReservationsResponse {
  reservations: Reservation[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle2,
    variant: "default" as const,
  },
  collected: {
    label: "Récupérée",
    icon: CheckCircle2,
    variant: "secondary" as const,
  },
  cancelled: {
    label: "Annulée",
    icon: X,
    variant: "destructive" as const,
  },
  pending: { label: "En attente", icon: Clock, variant: "outline" as const },
  expired: { label: "Expirée", icon: AlertCircle, variant: "destructive" as const },
}

function getStatusConfig(status: Reservation["status"]) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed
}

function formatDateTime(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

function isExpired(res: Reservation) {
  if (res.status === "expired") return true
  if (!res.expiresAt) return false
  const t = new Date(res.expiresAt).getTime()
  return Number.isFinite(t) && t < Date.now()
}

function canModify(res: Reservation) {
  return res.status === "confirmed" && !isExpired(res)
}

function canCancel(res: Reservation) {
  return res.status === "confirmed" && !isExpired(res)
}

function canDelete(res: Reservation) {
  return res.status === "cancelled"
}

function ReservationsPageContent() {
  const searchParams = useSearchParams()
  const selectedReservationId = searchParams.get("reservation")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc">("date_desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [exporting, setExporting] = useState(false)

  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null)
  const [editReservation, setEditReservation] = useState<Reservation | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Reservation | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const status = params.get("status")
    if (!status) return
    if (["all", "confirmed", "collected", "cancelled", "pending", "expired"].includes(status)) {
      setFilterStatus(status)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, selectedReservationId])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (selectedReservationId) {
          params.set("reservation", selectedReservationId)
        } else {
          if (filterStatus !== "all") params.set("status", filterStatus)
          params.set("page", String(page))
          params.set("pageSize", "10")
        }
        const data = await requestJson<ReservationsResponse>(
          `/api/reservation/my?${params.toString()}`,
          { signal: controller.signal }
        )
        setReservations(data.reservations ?? [])
        setTotalPages(data.pagination?.totalPages ?? 1)
        setTotal(data.pagination?.total ?? data.reservations?.length ?? 0)
      } catch (requestError) {
        if (controller.signal.aborted) return
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Impossible de charger vos réservations"
        setError(message)
        setReservations([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [filterStatus, loadAttempt, page, selectedReservationId])

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = !query
      ? reservations
      : reservations.filter(
          (r) =>
            r.reservationCode.toLowerCase().includes(query) ||
            r.brand.toLowerCase().includes(query) ||
            r.pointName.toLowerCase().includes(query) ||
            r.pointDistrict.toLowerCase().includes(query)
        )
    return [...filtered].sort((a, b) => {
      const ta = new Date(a.reservedAt).getTime()
      const tb = new Date(b.reservedAt).getTime()
      return sortBy === "date_desc" ? tb - ta : ta - tb
    })
  }, [reservations, searchQuery, sortBy])

  const refresh = () => setLoadAttempt((v) => v + 1)

  const handleCancel = async (res: Reservation) => {
    setActionBusyId(res.id)
    try {
      await requestJson<{ ok: boolean }>("/api/reservation/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: res.id }),
      })
      toast.success(`Réservation ${res.reservationCode} annulée`)
      setConfirmCancel(null)
      refresh()
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de l'annulation"
      )
    } finally {
      setActionBusyId(null)
    }
  }

  const handleModify = async () => {
    if (!editReservation) return
    const qty = editQuantity
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("La quantité doit être un entier supérieur à 0")
      return
    }
    setActionBusyId(editReservation.id)
    try {
      const data = await requestJson<{
        ok: boolean
        reservation: { quantity: number; amount: number }
      }>(`/api/reservation/${editReservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      })
      toast.success(
        `Réservation ${editReservation.reservationCode} modifiée: ${data.reservation.quantity} bouteille(s), ${formatAmount(data.reservation.amount)}`
      )
      setEditReservation(null)
      refresh()
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de la modification"
      )
    } finally {
      setActionBusyId(null)
    }
  }

  const handleDelete = async (res: Reservation) => {
    setActionBusyId(res.id)
    try {
      await requestJson<{ ok: boolean }>(`/api/reservation/${res.id}`, {
        method: "DELETE",
      })
      toast.success(`Réservation ${res.reservationCode} supprimée`)
      setConfirmDelete(null)
      refresh()
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Erreur lors de la suppression"
      )
    } finally {
      setActionBusyId(null)
    }
  }

  const fetchAllReservations = async () => {
    const all: Reservation[] = []
    let currentPage = 1
    let maxPages = 1
    while (currentPage <= maxPages) {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      params.set("page", String(currentPage))
      params.set("pageSize", "50")
      const data = await requestJson<ReservationsResponse>(
        `/api/reservation/my?${params.toString()}`
      )
      const rows = data.reservations ?? []
      all.push(...rows)
      maxPages = data.pagination?.totalPages ?? 1
      if (rows.length === 0 || currentPage >= maxPages) break
      currentPage += 1
    }
    return all
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const allReservations = await fetchAllReservations()
      const query = searchQuery.trim().toLowerCase()
      const exported = allReservations.filter((r) => {
        if (!query) return true
        return (
          r.reservationCode.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.pointName.toLowerCase().includes(query) ||
          r.pointDistrict.toLowerCase().includes(query)
        )
      })
      const csv = buildCsv(
        [
          "Code",
          "Marque",
          "Format",
          "Quantité",
          "Montant (FCFA)",
          "Point de vente",
          "District",
          "Statut",
          "Réservée le",
          "Collectée le",
          "Annulée le",
          "Expire le",
        ],
        exported.map((r) => [
          r.reservationCode,
          r.brand,
          r.format,
          r.quantity,
          r.amount,
          r.pointName,
          r.pointDistrict,
          getReservationStatusLabel(r.status),
          r.reservedAt,
          r.collectedAt,
          r.cancelledAt,
          r.expiresAt,
        ])
      )
      downloadCsv(`reservations-${new Date().toISOString().slice(0, 10)}.csv`, csv)
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

  const editAmount = calculateReservationAmount(editQuantity)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes réservations</h1>
          <p className="text-muted-foreground">
            Suivez et gérez vos réservations de bouteilles de gaz
          </p>
        </div>
        <Button
          variant="outline"
          render={
            <Link href="/dashboard/recherches">
              <Package className="size-4 mr-2" /> Nouvelle réservation
            </Link>
          }
        />
      </div>

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
              onClick={refresh}
              className="mt-3"
              disabled={loading}
            >
              <RefreshCw className="size-3 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

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
                if (value === "date_desc" || value === "date_asc") setSortBy(value)
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

      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

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
                <Button
                  render={<Link href="/dashboard/recherches">Rechercher du gaz</Link>}
                  className="mt-4"
                  variant="outline"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((res) => {
                const status = getStatusConfig(res.status)
                const busy = actionBusyId === res.id
                return (
                  <Card
                    key={res.id}
                    className="border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <CardContent className="pt-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Package className="size-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">
                                {res.brand} {res.format}
                              </p>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {res.pointName} — {res.pointDistrict}
                            </p>
                            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                              <p>Code : <span className="font-medium text-foreground">{res.reservationCode}</span></p>
                              <p>Quantité : <span className="font-medium text-foreground">{res.quantity}</span></p>
                              <p>Montant à régler au dépôt : <span className="font-medium text-foreground">{formatAmount(res.amount)}</span></p>
                              <p>Réservée : {formatDateTime(res.reservedAt)}</p>
                              {res.expiresAt && <p>Expire : {formatDateTime(res.expiresAt)}</p>}
                              {res.collectedAt && <p className="text-green-600">Récupérée : {formatDateTime(res.collectedAt)}</p>}
                              {res.cancelledAt && <p className="text-red-600">Annulée : {formatDateTime(res.cancelledAt)}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end lg:max-w-[320px]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailReservation(res)}
                          >
                            <Eye className="size-3 mr-1" /> Consulter
                          </Button>
                          {canModify(res) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditReservation(res)
                                setEditQuantity(res.quantity)
                              }}
                              disabled={busy}
                            >
                              <Pencil className="size-3 mr-1" /> Modifier
                            </Button>
                          )}
                          {canCancel(res) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmCancel(res)}
                              disabled={busy}
                            >
                              <X className="size-3 mr-1" /> Annuler
                            </Button>
                          )}
                          {canDelete(res) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmDelete(res)}
                              disabled={busy}
                            >
                              <Trash2 className="size-3 mr-1" /> Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages} · {total} réservation{total > 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((c) => Math.max(1, c - 1))}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="size-4" /> Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
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

      <Dialog
        open={!!detailReservation}
        onOpenChange={(open) => !open && setDetailReservation(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              Informations complètes de la réservation sélectionnée.
            </DialogDescription>
          </DialogHeader>
          {detailReservation && (
            <div className="grid gap-3 text-sm">
              <DetailRow label="Numéro" value={detailReservation.reservationCode} />
              <DetailRow label="Statut" value={getReservationStatusLabel(detailReservation.status)} />
              <DetailRow label="Point de vente" value={detailReservation.pointName} />
              <DetailRow label="Vendeur / district" value={`${detailReservation.pointDistrict}${detailReservation.pointCity ? `, ${detailReservation.pointCity}` : ""}`} />
              <DetailRow label="Marque / format" value={`${detailReservation.brand} ${detailReservation.format}`} />
              <DetailRow label="Quantité réservée" value={String(detailReservation.quantity)} />
              <DetailRow label="Montant à régler au dépôt" value={formatAmount(detailReservation.amount)} />
              <DetailRow label="Date de réservation" value={formatDateTime(detailReservation.reservedAt)} />
              <DetailRow label="Expiration" value={formatDateTime(detailReservation.expiresAt)} />
              <DetailRow label="Collectée le" value={formatDateTime(detailReservation.collectedAt)} />
              <DetailRow label="Annulée le" value={formatDateTime(detailReservation.cancelledAt)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailReservation(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editReservation}
        onOpenChange={(open) => !open && setEditReservation(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Vous pouvez modifier la quantité si la réservation est confirmée et non expirée. Le montant à régler au dépôt sera recalculé automatiquement.
            </DialogDescription>
          </DialogHeader>
          {editReservation && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{editReservation.reservationCode}</p>
                <p className="text-muted-foreground">
                  {editReservation.brand} {editReservation.format} — {editReservation.pointName}
                </p>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Quantité</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                Montant à régler au dépôt: <span className="font-medium text-foreground">{editAmount === null ? "—" : formatAmount(editAmount)}</span>
                <span className="block text-xs">({RESERVATION_UNIT_AMOUNT.toLocaleString("fr-FR")} FCFA par bouteille)</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditReservation(null)} disabled={!!actionBusyId}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleModify()}
              disabled={!!actionBusyId || !editReservation || editAmount === null}
            >
              {actionBusyId ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmCancel} onOpenChange={(open) => !open && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCancel
                ? `La réservation ${confirmCancel.reservationCode} sera annulée. Cette action sera enregistrée et répercutée dans l'espace vendeur.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancel && void handleCancel(confirmCancel)}
              disabled={!!actionBusyId}
            >
              {actionBusyId ? "Annulation…" : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete
                ? `La réservation annulée ${confirmDelete.reservationCode} sera supprimée de votre liste. Cette action est réservée aux réservations annulées et n'efface pas les réservations actives ou collectées.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionBusyId}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && void handleDelete(confirmDelete)}
              disabled={!!actionBusyId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionBusyId ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value || "—"}</span>
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
