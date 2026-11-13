"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Filter, Search, Package, Clock, CheckCircle2, AlertCircle, ChevronDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface VendorReservation {
  id: string
  reservationCode: string
  status: "confirmed" | "collected" | "cancelled" | "pending" | "expired" | "terminee"
  statusLabel: string
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: "reservation" | "consigne" | "mixed"
  clientName: string
  clientPhone: string | null
  pointName: string
  pointDistrict: string
  reservedAt: string
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
}

export default function VendorReservationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [reservations, setReservations] = useState<VendorReservation[]>([])
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

        const res = await fetch(`/api/reservation/vendor?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les réservations")
        const data = await res.json()
        if (!cancelled) {
          setReservations((data.reservations ?? []).map((r: any) => ({
            id: r.id,
            reservationCode: r.reservationCode,
            status: r.status as VendorReservation["status"],
            statusLabel: r.statusLabel ?? r.status,
            brand: r.brand,
            format: r.format,
            quantity: r.quantity,
            amount: r.amount,
            amountType: r.amountType,
            clientName: r.clientName ?? "Client",
            clientPhone: r.clientPhone ?? null,
            pointName: r.pointName ?? "—",
            pointDistrict: r.pointDistrict ?? "",
            reservedAt: r.reservedAt,
            collectedAt: r.collectedAt,
            cancelledAt: r.cancelledAt,
            expiresAt: r.expiresAt,
          })))
          setError(null)
        }
      } catch {
        setError("Impossible de charger les réservations")
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
          r.clientName.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.pointName.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default"
      case "collected": return "secondary"
      case "terminee": return "secondary"
      case "cancelled": return "destructive"
      case "expired": return "destructive"
      case "pending": return "outline"
      default: return "outline"
    }
  }

  const getStatusLabel = (status: string, statusLabel: string) => {
    return statusLabel || (() => {
      switch (status) {
        case "confirmed": return "Confirmée"
        case "collected": return "Récupérée"
        case "terminee": return "Terminée"
        case "cancelled": return "Annulée"
        case "expired": return "Expirée"
        case "pending": return "En attente"
        default: return status
      }
    })()
  }

  const handleCollect = async (id: string, code: string) => {
    if (!window.confirm(`Confirmer le retrait pour le code ${code} ?`)) return
    try {
      const res = await fetch("/api/reservation/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Échec du retrait")
      }
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "collected", collectedAt: new Date().toISOString(), statusLabel: "Récupérée" }
            : r
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors du retrait")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Package className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes réservations</h1>
          <p className="text-muted-foreground">
            Consultez les réservations effectuées sur votre dépôt
          </p>
        </div>
      </div>

      {error && (
        <Card>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, client, marque, dépôt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="size-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Aucune réservation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aucun client n'a encore réservé chez votre dépôt.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((res) => (
              <Card key={res.id} className="transition-all hover:shadow-md hover:border-primary/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground truncate">
                            {res.brand} {res.format}
                          </p>
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
                          Client : {res.clientName}
                          {res.clientPhone ? ` • ${res.clientPhone}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Code : <span className="font-mono font-bold">{res.reservationCode}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={getStatusVariant(res.status)} className="text-xs">
                        {getStatusLabel(res.status, res.statusLabel)}
                      </Badge>
                      <div className="text-right text-xs text-muted-foreground shrink-0 min-w-[200px]">
                        <p>Réservée : {formatDate(res.reservedAt)}</p>
                        {res.expiresAt && <p>Expire : {formatDate(res.expiresAt)}</p>}
                        {res.collectedAt && (
                          <p className="text-green-600">Récupérée : {formatDate(res.collectedAt)}</p>
                        )}
                        {res.cancelledAt && (
                          <p className="text-red-600">Annulée : {formatDate(res.cancelledAt)}</p>
                        )}
                      </div>
                      {res.status === "confirmed" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCollect(res.id, res.reservationCode)}
                          className="mt-2 w-full"
                        >
                          <CheckCircle2 className="size-3 mr-1" /> Confirmer retrait
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
    </div>
  )
}
