"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Store, AlertCircle, ArrowLeft, CheckCircle2, Clock } from "lucide-react"
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

interface VendorApproval {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  approvalStatus: "none" | "pending" | "approved" | "rejected"
  approvalRequestedAt: string | null
  approvalProcessedAt: string | null
  rejectionReason: string | null
  points: Array<{
    id: string
    name: string
    district: string
    address: string
  }>
}

export default function AdminVendeursPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<VendorApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      return (
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
      )
    }
    return true
  }).filter((v) => {
    if (filterStatus === "pending") return v.approvalStatus === "pending"
    if (filterStatus === "approved") return v.approvalStatus === "approved"
    if (filterStatus === "rejected") return v.approvalStatus === "rejected"
    if (filterStatus === "none") return v.approvalStatus === "none"
    return true
  })

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
            Consultez et gérez les demandes d'approbation des vendeurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
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

          {/* Vendors list */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Vendeur</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Demandé le</th>
                  <th className="text-left py-3 px-4">Points de vente</th>
                  <th className="text-right py-3 px-4">Action</th>
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
                            {v.points.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {v.points.length} point(s) de vente
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(v.approvalStatus)}>
                          {statusLabel(v.approvalStatus)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {v.approvalRequestedAt
                          ? new Date(v.approvalRequestedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.points.map((p) => p.name).join(", ") || "—"
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        {v.approvalStatus === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Approval action would need API
                                alert("Approuver ce vendeur")
                              }}
                            >
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                alert("Rejeter ce vendeur")
                              }}
                            >
                              Rejeter
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            Déjà traité
                          </Button>
                        )}
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
