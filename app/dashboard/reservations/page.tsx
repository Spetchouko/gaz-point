"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Filter, X, Download, Package, Clock, CheckCircle2, AlertCircle, ChevronDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/app/_components/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/gaz"

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

export default function ReservationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc">("date_desc")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadReservations() {
      try {
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/reservation/my?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les réservations")
        const data = await res.json()
        if (!cancelled) {
          setReservations((data.reservations ?? []).map((r: any) => ({
            id: r.id,
            reservationCode: r.reservationCode,
            status: r.status as Reservation["status"],
            brand: r.brand,
            format: r.format,
            quantity: r.quantity,
            amount: r.amount,
            amountType: r.amountType,
            pointName: r.pointName ?? "—",
            pointDistrict: r.pointDistrict ?? "",
            reservedAt: r.reservedAt,
            collectedAt: r.collectedAt,
            cancelledAt: r.cancelledAt,
            expiresAt: r.expiresAt,
          })))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur lors du chargement des réservations")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadReservations()
    return () => { cancelled = true }
  }, [filterStatus])

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmée", variant: "default" as const, icon: <CheckCircle2 className="size-3" /> }
      case "collected":
        return { label: "Récupérée", variant: "secondary" as const, icon: <CheckCircle2 className="size-3" /> }
      case "cancelled":
        return { label: "Annulée", variant: "destructive" as const, icon: <AlertCircle className="size-3" /> }
      case "pending":
        return { label: "En attente", variant: "outline" as const, icon: <Clock className="size-3" /> }
      case "expired":
        return { label: "Expirée", variant: "destructive" as const, icon: <AlertCircle className="size-3" /> }
      default:
        return { label: status, variant: "outline" as const, icon: null }
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm("Annuler cette réservation ? Le stock sera libéré.")) return
    try {
      const res = await fetch("/api/reservation/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: id }),
      })
      if (!res.ok) throw new Error("Échec de l'annulation")
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "cancelled", cancelledAt: new Date().toISOString() } : r))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'annulation")
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
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-3">
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="collected">Récupérées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes</SelectItem>
                <SelectItem value="date_asc">Plus anciennes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => alert("Export des réservations en cours...")}>
              <Download className="size-4 mr-2" />
              Exporter
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
      {!loading && (
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card className="border border-border shadow-sm rounded-lg">
              <CardContent className="py-12 text-center">
                <Package className="size-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">Aucune réservation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || filterStatus !== "all"
                    ? "Aucune réservation ne correspond à vos filtres."
                    : "Vous n'avez pas encore de réservations. Commencez par rechercher du gaz !"}
                </p>
                <Button render={<Link href="/dashboard/recherches">Rechercher du gaz</Link>} className="mt-4" variant="outline" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((res) => (
                <Card key={res.id} className="border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50">
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}