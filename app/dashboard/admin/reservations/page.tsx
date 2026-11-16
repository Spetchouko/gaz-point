"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Calendar, AlertCircle, ArrowLeft, Package, Truck, User, Clock } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"

interface AdminReservation {
  id: string
  reservationCode: string
  status: string
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  reservedAt: string
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
  clientName: string
  clientPhone: string | null
  clientUserName: string | null
  clientUserEmail: string | null
  vendorId: string
  pointId: string
  pointName: string | null
  pointDistrict: string | null
}

const statusLabel = (status: string) => {
  switch (status) {
    case "confirmed": return "Confirmée"
    case "collected": return "Récupérée"
    case "cancelled": return "Annulée"
    case "pending": return "En attente"
    case "expired": return "Expirée"
    default: return status
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case "confirmed": return "default"
    case "collected": return "secondary"
    case "cancelled": return "destructive"
    case "pending": return "outline"
    case "expired": return "destructive"
    default: return "outline"
  }
}

export default function AdminReservationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function loadReservations() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery) params.set("search", searchQuery)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/reservations?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les réservations")
        const data = await res.json()
        if (!cancelled) {
          setReservations(data.reservations ?? [])
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les réservations")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadReservations()
    return () => {
      cancelled = true
    }
  }, [filterStatus, searchQuery])

  const updateStatus = async (id: string, status: string) => {
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
      toast.success("Réservation mise à jour avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const filteredReservations = reservations.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        r.reservationCode.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.pointName?.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestion des réservations</h1>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <AlertCircle className="size-4 mr-2 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Toutes les réservations</CardTitle>
          <CardDescription>
            Consultez, filtrez et modifiez le statut de toutes les réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, client, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Code</th>
                  <th className="text-left py-3 px-4">Client</th>
                  <th className="text-left py-3 px-4">Bouteille</th>
                  <th className="text-left py-3 px-4">Point de vente</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Réservée le</th>
                  <th className="text-right py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucune réservation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Package className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium text-foreground">
                            {r.reservationCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-foreground">{r.clientName}</p>
                            {r.clientPhone && (
                              <p className="text-xs text-muted-foreground">{r.clientPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-foreground">{r.brand} {r.format}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.quantity} bouteille{r.quantity > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {r.pointName || "—"}
                        {r.pointDistrict && (
                          <p className="text-xs">{r.pointDistrict}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(r.status)}>
                          {statusLabel(r.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(r.reservedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Select
                          value={r.status}
                          onValueChange={(value) => updateStatus(r.id, value)}
                          disabled={saving.has(r.id)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder={statusLabel(r.status)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="collected">Récupérée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
