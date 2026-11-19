"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  ArrowLeft,
  Loader2,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Eye,
  ArrowUpDown,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"
import { AdminPageHeader, AdminCard } from "@/app/_components/dashboard/admin"

interface VendorSubscription {
  vendor: {
    id: string
    name: string
    email: string
    phoneNumber: string | null
    createdAt: string
  }
  subscription: {
    id: string
    vendorId: string
    status: "active" | "inactive" | "past_due" | "cancelled"
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelledAt: string | null
    lastPaymentAt: string | null
    lastPaymentReference: string | null
    amount: number
    currency: string
    createdAt: string
    updatedAt: string
  } | null
  lastPayment: {
    id: string
    vendorId: string
    geniuspayReference: string
    geniuspayId: number | null
    amount: number
    currency: string
    fees: number | null
    netAmount: number | null
    status: string
    paymentMethod: string | null
    paymentProvider: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    checkoutUrl: string | null
    successUrl: string | null
    errorUrl: string | null
    metadata: string | null
    environment: string
    initiatedAt: string
    completedAt: string | null
    webhookReceivedAt: string | null
    webhookVerified: boolean
    createdAt: string
    updatedAt: string
  } | null
  paymentCount: number
  effectiveStatus: "active" | "inactive" | "past_due" | "cancelled"
  referenceAmount: number
}

interface SubscriptionDetail {
  vendor: {
    id: string
    name: string
    email: string
    phoneNumber: string | null
    createdAt: string
  }
  subscription: {
    id: string
    vendorId: string
    status: "active" | "inactive" | "past_due" | "cancelled"
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelledAt: string | null
    lastPaymentAt: string | null
    lastPaymentReference: string | null
    amount: number
    currency: string
    createdAt: string
    updatedAt: string
  } | null
  payments: Array<{
    id: string
    vendorId: string
    geniuspayReference: string
    geniuspayId: number | null
    amount: number
    currency: string
    fees: number | null
    netAmount: number | null
    status: string
    paymentMethod: string | null
    paymentProvider: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    checkoutUrl: string | null
    successUrl: string | null
    errorUrl: string | null
    metadata: string | null
    environment: string
    initiatedAt: string
    completedAt: string | null
    webhookReceivedAt: string | null
    webhookVerified: boolean
    createdAt: string
    updatedAt: string
  }>
  nextDueDate: string | null
  referenceAmount: number
}

const statusLabel = (status: string) => {
  switch (status) {
    case "active": return "Actif"
    case "inactive": return "Inactif"
    case "past_due": return "En retard"
    case "cancelled": return "Annulé"
    default: return status
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "default"
    case "inactive": return "secondary"
    case "past_due": return "destructive"
    case "cancelled": return "outline"
    default: return "outline"
  }
}

const paymentStatusLabel = (status: string) => {
  switch (status) {
    case "completed": return "Réussi"
    case "pending": return "En attente"
    case "processing": return "En cours"
    case "failed": return "Échoué"
    case "cancelled": return "Annulé"
    case "expired": return "Expiré"
    case "refunded": return "Remboursé"
    default: return status
  }
}

const paymentStatusVariant = (status: string) => {
  switch (status) {
    case "completed": return "default"
    case "pending": return "outline"
    case "processing": return "secondary"
    case "failed": return "destructive"
    case "cancelled": return "outline"
    case "expired": return "destructive"
    case "refunded": return "secondary"
    default: return "outline"
  }
}

function formatDate(dateString: string | null, withTime = false) {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function formatAmount(amount: number | null, currency = "XAF") {
  if (amount === null || amount === undefined) return "—"
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount)
}

export default function AdminAbonnementsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [abonnements, setAbonnements] = useState<VendorSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewDetail, setViewDetail] = useState<SubscriptionDetail | null>(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
  const [referenceAmount, setReferenceAmount] = useState(5000)

  useEffect(() => {
    let cancelled = false
    async function loadAbonnements() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set("page", String(pagination.page))
        params.set("pageSize", String(pagination.pageSize))
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery) params.set("search", searchQuery)

        const res = await fetch(`/api/admin/abonnements?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les abonnements")
        const data = await res.json()
        if (!cancelled) {
          setAbonnements(data.abonnements ?? [])
          setPagination(data.pagination ?? { total: 0, page: 1, pageSize: 20, totalPages: 1 })
          setReferenceAmount(data.referenceAmount ?? 5000)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les abonnements")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAbonnements()
    return () => { cancelled = true }
  }, [filterStatus, searchQuery, pagination.page, pagination.pageSize])

  const loadDetail = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/abonnements/${vendorId}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Impossible de charger les détails")
      const data = await res.json()
      setViewDetail(data)
    } catch {
      toast.error("Impossible de charger les détails de l'abonnement")
    }
  }

  if (loading) {
    return (
      <div className="admin-section">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <AdminPageHeader
        title="Abonnements vendeurs"
        subtitle={`Gestion des abonnements vendeurs (référence : ${formatAmount(referenceAmount)})`}
        icon={<CreditCard className="size-5" />}
        actions={
          <Link href="/dashboard/admin">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" /> Retour
            </Button>
          </Link>
        }
        breadcrumb={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Abonnements" }]}
      />

      {error && (
        <AdminCard className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </AdminCard>
      )}

      {/* Abonnements Section */}
      <Card className="admin-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="admin-card__title">Abonnements vendeurs</CardTitle>
              <CardDescription className="admin-card__description">
                {abonnements.length} sur {pagination.total} vendeurs • Cliquez sur un vendeur pour voir l'historique complet
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: string | null) => { setFilterStatus(value ?? "all"); setPagination(p => ({ ...p, page: 1 })) }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="past_due">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {abonnements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <CreditCard className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">Aucun vendeur trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">Vendeur</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut paiement</TableHead>
                      <TableHead>Date abonnement</TableHead>
                      <TableHead className="text-right w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abonnements.map((a) => (
                      <TableRow
                        key={a.vendor.id}
                        className="cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => loadDetail(a.vendor.id)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium text-foreground">{a.vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{a.vendor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(a.effectiveStatus)}>
                            {statusLabel(a.effectiveStatus)}
                          </Badge>
                          {a.subscription && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.subscription.status === "active" && a.subscription.currentPeriodEnd
                                ? `Expire le ${formatDate(a.subscription.currentPeriodEnd)}`
                                : a.subscription.status === "past_due"
                                ? "Paiement en retard"
                                : a.subscription.status === "cancelled" && a.subscription.cancelledAt
                                ? `Annulé le ${formatDate(a.subscription.cancelledAt)}`
                                : "Aucune période active"
                              }
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {a.subscription ? formatAmount(a.subscription.amount, a.subscription.currency) : formatAmount(a.referenceAmount)}
                        </TableCell>
                        <TableCell>
                          {a.lastPayment ? (
                            <Badge variant={paymentStatusVariant(a.lastPayment.status)}>
                              {paymentStatusLabel(a.lastPayment.status)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun paiement</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {a.subscription?.createdAt ? formatDate(a.subscription.createdAt) : formatDate(a.vendor.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Eye className="size-4 text-muted-foreground/50 hover:text-primary transition-colors" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog - Subscription Details */}
      <Dialog open={!!viewDetail} onOpenChange={(open) => !open && setViewDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewDetail && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CreditCard className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{viewDetail.vendor.name}</h2>
                        <p className="text-muted-foreground text-sm">{viewDetail.vendor.email}</p>
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      Vendeur depuis le {formatDate(viewDetail.vendor.createdAt)} • {viewDetail.payments.length} paiement{viewDetail.payments.length > 1 ? "s" : ""} enregistré{viewDetail.payments.length > 1 ? "s" : ""}
                    </DialogDescription>
                  </div>
                  <Badge variant={viewDetail.subscription ? statusVariant(viewDetail.subscription.status) : "secondary"} className="text-sm">
                    {viewDetail.subscription ? statusLabel(viewDetail.subscription.status) : "Aucun abonnement"}
                  </Badge>
                </div>
              </DialogHeader>

              <Separator />

              {/* Subscription Info */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Current Subscription */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    Abonnement actuel
                  </h4>
                  {viewDetail.subscription ? (
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Statut</dt>
                        <dd className="text-foreground font-medium flex items-center gap-2">
                          <Badge variant={statusVariant(viewDetail.subscription.status)}>
                            {statusLabel(viewDetail.subscription.status)}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Montant mensuel</dt>
                        <dd className="text-foreground font-medium font-mono">
                          {formatAmount(viewDetail.subscription.amount, viewDetail.subscription.currency)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Début de période</dt>
                        <dd className="text-foreground font-medium">
                          {viewDetail.subscription.currentPeriodStart ? formatDate(viewDetail.subscription.currentPeriodStart, true) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Fin de période (échéance)</dt>
                        <dd className="text-foreground font-medium">
                          {viewDetail.subscription.currentPeriodEnd ? formatDate(viewDetail.subscription.currentPeriodEnd, true) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Prochaine échéance estimée</dt>
                        <dd className="text-foreground font-medium">
                          {viewDetail.nextDueDate ? formatDate(viewDetail.nextDueDate) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Dernier paiement</dt>
                        <dd className="text-foreground font-medium">
                          {viewDetail.subscription.lastPaymentAt ? formatDate(viewDetail.subscription.lastPaymentAt, true) : "—"}
                        </dd>
                      </div>
                      {viewDetail.subscription.lastPaymentReference && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Référence dernier paiement</dt>
                          <dd className="text-foreground font-medium font-mono text-xs break-all">
                            {viewDetail.subscription.lastPaymentReference}
                          </dd>
                        </div>
                      )}
                      {viewDetail.subscription.cancelledAt && (
                        <div className="flex justify-between text-destructive">
                          <dt className="text-muted-foreground">Annulé le</dt>
                          <dd className="text-foreground font-medium">{formatDate(viewDetail.subscription.cancelledAt, true)}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-xl text-center text-sm text-muted-foreground">
                      Aucun abonnement actif pour ce vendeur
                    </div>
                  )}
                </div>

                {/* Reference Amount */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    Référence & Configuration
                  </h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Montant de référence</dt>
                      <dd className="text-foreground font-medium font-mono text-lg">
                        {formatAmount(viewDetail.referenceAmount)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Devise</dt>
                      <dd className="text-foreground font-medium">XAF (FCFA)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Passerelle de paiement</dt>
                      <dd className="text-foreground font-medium">GeniusPay (préparé pour intégration)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Mode actuel</dt>
                      <dd className="text-foreground font-medium">
                        <Badge variant="outline">Sandbox / Préparation</Badge>
                      </dd>
                    </div>
                    <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
                      <p className="text-xs text-info">
                        <strong>Note :</strong> Cette section est préparée pour l'intégration future de la passerelle de paiement GeniusPay.
                        Aucun vrai paiement n'est déclenché actuellement. Les transactions affichées sont des données de test ou historiques.
                      </p>
                    </div>
                  </dl>
                </div>
              </div>

              <Separator />

              {/* Payment History */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  Historique des paiements
                </h4>
                {viewDetail.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead>Environnement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewDetail.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{formatDate(p.initiatedAt, true)}</TableCell>
                            <TableCell className="font-mono text-xs">{p.geniuspayReference}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatAmount(p.amount, p.currency)}</TableCell>
                            <TableCell>
                              <Badge variant={paymentStatusVariant(p.status)}>
                                {paymentStatusLabel(p.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-capitalize text-sm">{p.paymentMethod || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.environment === "live" ? "default" : "outline"}>
                                {p.environment}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <History className="size-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>Aucun paiement enregistré pour ce vendeur</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDetail(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}