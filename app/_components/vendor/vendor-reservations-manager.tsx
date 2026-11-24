"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Package,
  QrCode,
  ScanLine,
  Search,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  VendorEmptyState,
  VendorErrorState,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"
import { requestJson } from "@/lib/client-request"
import { formatDateTime, formatPrice } from "@/lib/gaz"
import type { VendorReservationDto } from "@/lib/vendor-dashboard"

type ActionError = { message: string; retry: () => void }

type VerifiedReservation = {
  id: string
  clientName: string
  clientPhone: string | null
  reservationCode: string
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  status: string
  reservedAt: string
  expiresAt: string | null
  isExpired: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  en_attente: "En attente",
  confirmed: "Confirmée",
  collected: "Récupérée",
  terminee: "Terminée",
  cancelled: "Annulée",
  expired: "Expirée",
}

const AMOUNT_LABELS: Record<string, string> = {
  reservation: "Réservation",
  consigne: "Consigne",
  mixed: "Mixte",
}

export function VendorReservationsManager({
  reservations: initialReservations,
  depotName,
}: {
  reservations: VendorReservationDto[]
  depotName: string | null
}) {
  const router = useRouter()
  const verifyFormRef = useRef<HTMLFormElement | null>(null)
  const [items, setItems] = useState(initialReservations)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<ActionError | null>(null)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<VerifiedReservation | null>(null)
  const [collecting, setCollecting] = useState(false)

  // Synchronisation pendant le rendu après router.refresh() : les données du
  // serveur reprennent le dessus sans provoquer de rendu en cascade.
  const [syncedReservations, setSyncedReservations] = useState(initialReservations)
  if (syncedReservations !== initialReservations) {
    setSyncedReservations(initialReservations)
    setItems(initialReservations)
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => {
        if (!query) return true
        return [
          item.reservationCode,
          item.clientName,
          item.clientPhone ?? "",
          item.brand,
          item.format,
          item.pointName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())
  }, [items, search, statusFilter])

  const runAction = async (
    action: () => Promise<void>,
    successMessage: string,
    reservationId?: string
  ) => {
    setError(null)
    if (reservationId) {
      setBusyIds((current) => new Set(current).add(reservationId))
    }
    try {
      await action()
      toast.success(successMessage)
      router.refresh()
    } catch (actionError) {
      setError({
        message:
          actionError instanceof Error
            ? actionError.message
            : "Une erreur est survenue. Réessayez.",
        retry: () => void runAction(action, successMessage, reservationId),
      })
    } finally {
      if (reservationId) {
        setBusyIds((current) => {
          const next = new Set(current)
          next.delete(reservationId)
          return next
        })
      }
    }
  }

  const updateStatus = (reservation: VendorReservationDto, action: string) => {
    void runAction(async () => {
      await requestJson("/api/reservation/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reservationId: reservation.id }),
      })
      const nextStatus =
        action === "confirm"
          ? "confirmed"
          : action === "cancel"
            ? "cancelled"
            : action === "terminee"
              ? "terminee"
              : "en_attente"
      setItems((current) =>
        current.map((item) =>
          item.id === reservation.id ? { ...item, status: nextStatus } : item
        )
      )
    }, "Réservation mise à jour", reservation.id)
  }

  const collectByCode = async (reservationCode: string, reservationId?: string) => {
    await runAction(async () => {
      await requestJson("/api/reservation/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: reservationCode }),
      })
      if (reservationId) {
        setItems((current) =>
          current.map((item) =>
            item.id === reservationId
              ? {
                  ...item,
                  status: "collected",
                  collectedAt: new Date().toISOString(),
                }
              : item
          )
        )
      }
      setVerified(null)
      setCode("")
      setVerifyOpen(false)
    }, "Retrait confirmé", reservationId)
  }

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (normalized.length !== 10) {
      setError({
        message: "Le code doit contenir exactement 10 caractères.",
        retry: () => {
          setError(null)
          setVerifyOpen(true)
          verifyFormRef.current?.requestSubmit()
        },
      })
      return
    }
    void (async () => {
      setVerifying(true)
      setError(null)
      try {
        const payload = await requestJson<{ reservation?: VerifiedReservation }>(
          "/api/reservation/verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: normalized }),
          }
        )
        if (!payload?.reservation) {
          throw new Error("Réservation introuvable")
        }
        setVerified(payload.reservation)
      } catch (verifyError) {
        setError({
          message:
            verifyError instanceof Error
              ? verifyError.message
              : "Impossible de vérifier ce code.",
          retry: () => {
            setError(null)
            setVerifyOpen(true)
            verifyFormRef.current?.requestSubmit()
          },
        })
      } finally {
        setVerifying(false)
      }
    })()
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mes réservations"
        description={
          depotName
            ? `Réservations reçues sur ${depotName}`
            : "Consultez et traitez les réservations de votre dépôt."
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link prefetch={false} href="/dashboard/vendeur">Retour</Link>}
            />
            <Button size="sm" onClick={() => setVerifyOpen(true)}>
              <ScanLine className="size-4" aria-hidden />
              Vérifier un code
            </Button>
          </>
        }
      />

      {error && <VendorErrorState message={error.message} onRetry={error.retry} />}

      <VendorSectionCard title="Filtrer" contentClassName="p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Code, client, marque ou dépôt…"
              className="pl-9"
              aria-label="Rechercher une réservation"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
            <SelectTrigger className="w-full" aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </VendorSectionCard>

      <VendorSectionCard
        title="Réservations reçues"
        description={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}`}
        contentClassName="p-0"
      >
        {filtered.length === 0 ? (
          <VendorEmptyState
            icon={Calendar}
            title="Aucune réservation"
            description="Les réservations de vos clients apparaîtront ici. Vous pouvez aussi vérifier un code manuellement."
            actions={
              <Button size="sm" variant="outline" onClick={() => setVerifyOpen(true)}>
                <QrCode className="size-4" aria-hidden />
                Vérifier un code
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code / Client</th>
                  <th className="px-4 py-2.5 font-medium">Produit</th>
                  <th className="px-4 py-2.5 font-medium">Montant</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filtered.map((item) => {
                  const canConfirm =
                    item.status === "pending" || item.status === "en_attente"
                  const canComplete = item.status === "confirmed"
                  const canCancel =
                    item.status === "pending" ||
                    item.status === "en_attente" ||
                    item.status === "confirmed"
                  const isBusy = busyIds.has(item.id)
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-foreground">
                          {item.reservationCode}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.clientName}
                          {item.clientPhone ? ` · ${item.clientPhone}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          {item.brand} · {item.format}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.quantity} bouteille{item.quantity > 1 ? "s" : ""} ·{" "}
                          {item.pointName ?? "Dépôt"}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {AMOUNT_LABELS[item.amountType] ?? item.amountType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {formatPrice(item.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <VendorStatusBadge
                          status={item.status}
                          label={STATUS_LABELS[item.status] ?? item.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="block">{formatDateTime(item.reservedAt)}</span>
                        {item.expiresAt && (
                          <span className="block">Expire : {formatDateTime(item.expiresAt)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {canConfirm && (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => updateStatus(item, "confirm")}
                            >
                              Confirmer
                            </Button>
                          )}
                          {canComplete && (
                            <>
                              <Button
                                size="xs"
                                disabled={isBusy}
                                onClick={() => void collectByCode(item.reservationCode, item.id)}
                              >
                                <CheckCircle2 className="size-3.5" aria-hidden />
                                Retrait
                              </Button>
                              <Button
                                size="xs"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={() => updateStatus(item, "terminee")}
                              >
                                Terminée
                              </Button>
                            </>
                          )}
                          {canCancel && (
                            <Button
                              size="xs"
                              variant="destructive"
                              disabled={isBusy}
                              onClick={() => updateStatus(item, "cancel")}
                            >
                              <XCircle className="size-3.5" aria-hidden />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </VendorSectionCard>

      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          setVerifyOpen(open)
          if (!open) {
            setVerified(null)
            setCode("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vérifier une réservation</DialogTitle>
          </DialogHeader>
          <form ref={verifyFormRef} onSubmit={handleVerify} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reservation-code">Code de réservation</Label>
              <Input
                id="reservation-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))
                  setError(null)
                }}
                placeholder="GP0101ABCD"
                maxLength={10}
                className="font-mono tracking-widest"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">10 caractères requis.</p>
            </div>
            <Button type="submit" size="sm" disabled={verifying || code.length !== 10}>
              {verifying ? "Vérification…" : "Vérifier"}
            </Button>
          </form>

          {verified && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono font-semibold text-foreground">
                  {verified.reservationCode}
                </p>
                <VendorStatusBadge
                  status={verified.status}
                  label={STATUS_LABELS[verified.status] ?? verified.status}
                />
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground">
                <p>Client : {verified.clientName}</p>
                <p>
                  Produit : {verified.brand} · {verified.format} · {verified.quantity}
                </p>
                <p>Montant : {formatPrice(verified.amount)}</p>
                <p>Réservée le {formatDateTime(verified.reservedAt)}</p>
              </div>
              {verified.status === "confirmed" && !verified.isExpired && (
                <Button
                  size="sm"
                  disabled={collecting}
                  onClick={() => {
                    setCollecting(true)
                    void collectByCode(verified.reservationCode, verified.id).finally(() =>
                      setCollecting(false)
                    )
                  }}
                >
                  <Package className="size-4" aria-hidden />
                  {collecting ? "Confirmation…" : "Confirmer le retrait"}
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerifyOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
