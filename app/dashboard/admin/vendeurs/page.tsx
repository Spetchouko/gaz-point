"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Store, AlertCircle, ArrowLeft, CheckCircle2, Clock, Package, Truck, Trash2, Edit2, ShieldCheck, ShieldAlert } from "lucide-react"
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

interface VendorApproval {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  approvalStatus: "none" | "pending" | "approved" | "rejected"
  approvalRequestedAt: string | null
  approvalProcessedAt: string | null
  approvalProcessedBy: string | null
  rejectionReason: string | null
  points: Array<{
    id: string
    name: string
    district: string
    address: string
    phone: string | null
    brands: string[] | null
    formats: string[] | null
    deliveryEnabled: boolean
    deliveryFee: number
    exchangeEnabled: boolean
    gasSaleEnabled: boolean
    isActive: boolean
  }>
}

const statusLabel = (status: string) => {
  switch (status) {
    case "pending": return "En attente"
    case "approved": return "Approuvé"
    case "rejected": return "Rejeté"
    case "none": return "Non demandé"
    default: return status
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case "approved": return "default"
    case "pending": return "outline"
    case "rejected": return "destructive"
    case "none": return "secondary"
    default: return "outline"
  }
}

export default function AdminVendeursPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<VendorApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function loadVendors() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/vendors/approvals?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les vendeurs")
        const data = await res.json()
        if (!cancelled) {
          setVendors(data.approvals ?? [])
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les vendeurs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadVendors()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredVendors = vendors.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
    }
    return true
  }).filter((v) => {
    if (filterStatus === "pending") return v.approvalStatus === "pending"
    if (filterStatus === "approved") return v.approvalStatus === "approved"
    if (filterStatus === "rejected") return v.approvalStatus === "rejected"
    if (filterStatus === "none") return v.approvalStatus === "none"
    return true
  })

  const updateApproval = async (id: string, action: "approve" | "reject") => {
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(action === "approve"
        ? "/api/admin/vendors/approve"
        : "/api/admin/vendors/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Échec de l'opération")
      }
      setVendors((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, approvalStatus: action === "approve" ? "approved" : "rejected", approvalProcessedAt: new Date().toISOString() }
            : v
        )
      )
      toast.success(action === "approve" ? "Vendeur approuvé avec succès" : "Vendeur rejeté")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'opération")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const togglePointStatus = async (pointId: string, currentActive: boolean) => {
    setSaving((prev) => new Set([...prev, pointId]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${pointId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setVendors((prev) =>
        prev.map((v) => ({
          ...v,
          points: v.points.map((p) =>
            p.id === pointId ? { ...p, isActive: !currentActive } : p
          ),
        }))
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(pointId)
        return next
      })
    }
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
        <h1 className="text-2xl font-bold tracking-tight">Gestion des vendeurs</h1>
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
          <CardTitle>Vendeurs inscrits</CardTitle>
          <CardDescription>
            Consultez et gérez les demandes d'approbation des vendeurs et leurs dépôts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
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
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="none">Non demandé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Vendeur</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Statut approbation</th>
                  <th className="text-left py-3 px-4">Demandé le</th>
                  <th className="text-left py-3 px-4">Points de vente</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucun vendeur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr key={v.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Store className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{v.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.role} • {v.points.length} point(s) de vente
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{v.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(v.approvalStatus)}>
                          {statusLabel(v.approvalStatus)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {v.approvalRequestedAt
                          ? new Date(v.approvalRequestedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                          })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.points.map((p) => p.name).join(", ") || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2">
                          {v.approvalStatus === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateApproval(v.id, "approve")}
                                disabled={saving.has(v.id)}
                              >
                                {saving.has(v.id) ? <Loader2 className="size-4" /> : <ShieldCheck className="size-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateApproval(v.id, "reject")}
                                disabled={saving.has(v.id)}
                              >
                                {saving.has(v.id) ? <Loader2 className="size-4" /> : <ShieldAlert className="size-4" />}
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Déjà traité
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Détails des points de vente par vendeur */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Points de vente (dépôts)</h2>
          <Link href="/dashboard/admin/points-de-vente">
            <Button variant="outline" size="sm">Gérer tous les dépôts</Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.flatMap((v) =>
            v.points.map((p) => (
              <Card key={p.id} className="shadow-sm border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.district}</p>
                      <p className="text-xs text-muted-foreground">{p.address}</p>
                      {p.phone && (
                        <p className="text-xs text-muted-foreground mt-1">{p.phone}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.brands || []).map((b) => (
                          <span key={b} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {b}
                          </span>
                        ))}
                        {(p.formats || []).map((f) => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePointStatus(p.id, p.isActive)}
                          disabled={saving.has(p.id)}
                        >
                          {p.isActive ? "Suspendre" : "Réactiver"}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {v.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
