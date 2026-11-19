"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  Star,
  Eye,
  AlertCircle,
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
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"
import { AdminPageHeader, AdminCard } from "@/app/_components/dashboard/admin"

interface Avis {
  id: string
  authorName: string
  authorRole: "client" | "vendor"
  authorImage: string | null
  city: string | null
  quote: string
  status: "pending" | "approved" | "rejected" | "hidden"
  createdAt: string
  updatedAt: string
  userId: string
}

const statusLabel = (status: string) => {
  switch (status) {
    case "pending": return "En attente"
    case "approved": return "Validé"
    case "rejected": return "Refusé"
    case "hidden": return "Masqué"
    default: return status
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case "approved": return "default"
    case "pending": return "outline"
    case "rejected": return "destructive"
    case "hidden": return "secondary"
    default: return "outline"
  }
}

const roleLabel = (role: string) => {
  return role === "vendor" ? "Vendeur" : "Client"
}

const roleVariant = (role: string) => {
  return role === "vendor" ? "default" : "outline"
}

function formatDate(dateString: string | null, withTime = false) {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export default function AdminAvisPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [avisList, setAvisList] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [viewAvis, setViewAvis] = useState<Avis | null>(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 })

  useEffect(() => {
    let cancelled = false
    async function loadAvis() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set("page", String(pagination.page))
        params.set("pageSize", String(pagination.pageSize))
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery) params.set("search", searchQuery)

        const res = await fetch(`/api/admin/avis?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les avis")
        const data = await res.json()
        if (!cancelled) {
          setAvisList(data.avis ?? [])
          setPagination(data.pagination ?? { total: 0, page: 1, pageSize: 20, totalPages: 1 })
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les avis")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAvis()
    return () => { cancelled = true }
  }, [filterStatus, searchQuery, pagination.page, pagination.pageSize])

  const updateAvisStatus = async (id: string, action: "approve" | "reject" | "hide") => {
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/avis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Échec de l'opération")
      }
      const data = await res.json()
      setAvisList((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: data.avis.status, updatedAt: new Date().toISOString() } : a
        )
      )
      toast.success(action === "approve" ? "Avis validé avec succès" : action === "reject" ? "Avis refusé" : "Avis masqué")
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
        title="Gestion des avis"
        subtitle="Consultez et modérez les avis soumis par les clients et vendeurs"
        icon={<MessageSquare className="size-5" />}
        actions={
          <Link href="/dashboard/admin">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" /> Retour
            </Button>
          </Link>
        }
        breadcrumb={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Avis" }]}
      />

      {error && (
        <AdminCard className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </AdminCard>
      )}

      {/* Avis Section */}
      <Card className="admin-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="admin-card__title">Avis soumis</CardTitle>
              <CardDescription className="admin-card__description">
                {avisList.length} sur {pagination.total} avis • Cliquez sur une carte pour voir le détail complet
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par auteur, ville, commentaire..."
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
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Validés</SelectItem>
                  <SelectItem value="rejected">Refusés</SelectItem>
                  <SelectItem value="hidden">Masqués</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {avisList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <MessageSquare className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">Aucun avis trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {avisList.map((a) => (
                <Card
                  key={a.id}
                  className={cn(
                    "shadow-sm border border-border hover:shadow-md hover:border-green-200 transition-all cursor-pointer bg-card",
                    a.status === "rejected" && "border-red-200 bg-red-50/50",
                    a.status === "hidden" && "border-muted/30 bg-muted/30 opacity-70"
                  )}
                  onClick={() => setViewAvis(a)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewAvis(a); } }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "size-10 rounded-xl flex items-center justify-center",
                            a.authorRole === "vendor" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                          )}>
                            <Star className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{a.authorName}</p>
                            <p className="text-xs text-muted-foreground">{a.city || "Ville non spécifiée"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={roleVariant(a.authorRole)} className="text-xs">
                            {roleLabel(a.authorRole)}
                          </Badge>
                          <Badge variant={statusVariant(a.status)}>
                            {statusLabel(a.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.createdAt, true)}
                      </span>
                      <Eye className="size-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground line-clamp-3">{a.quote}</p>
                    {a.status === "pending" && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); updateAvisStatus(a.id, "approve") }}
                          disabled={saving.has(a.id)}
                          className="flex-1"
                        >
                          {saving.has(a.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
                          Valider
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); updateAvisStatus(a.id, "reject") }}
                          disabled={saving.has(a.id)}
                          className="flex-1"
                        >
                          {saving.has(a.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <XCircle className="size-4 mr-2" />}
                          Refuser
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
        </CardContent>
      </Card>

      {/* Dialog - Avis Details */}
      <Dialog open={!!viewAvis} onOpenChange={(open) => !open && setViewAvis(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewAvis && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <MessageSquare className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Avis de {viewAvis.authorName}</h2>
                        <p className="text-muted-foreground text-sm">
                          {roleLabel(viewAvis.authorRole)} • {viewAvis.city || "Ville non spécifiée"}
                        </p>
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      Soumis le {formatDate(viewAvis.createdAt, true)}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusVariant(viewAvis.status)} className="text-sm">
                    {statusLabel(viewAvis.status)}
                  </Badge>
                </div>
              </DialogHeader>

              <Separator />

              {/* Author Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <div className={cn(
                  "size-12 rounded-full flex items-center justify-center",
                  viewAvis.authorRole === "vendor" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                )}>
                  {viewAvis.authorImage ? (
                    <img
                      src={viewAvis.authorImage}
                      alt={viewAvis.authorName}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <Star className="size-6" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{viewAvis.authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {viewAvis.authorRole === "vendor" ? "Vendeur" : "Client"} • ID: {viewAvis.userId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Full Quote */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Commentaire complet
                </h4>
                <div className="p-4 bg-card border border-border rounded-xl">
                  <p className="text-foreground whitespace-pre-wrap">{viewAvis.quote}</p>
                </div>
              </div>

              <Separator />

              {/* Admin Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="size-4 text-muted-foreground" />
                  Actions de modération
                </h4>
                <div className="flex flex-wrap gap-3">
                  {viewAvis.status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => { updateAvisStatus(viewAvis.id, "approve"); setViewAvis(null); }}
                        disabled={saving.has(viewAvis.id)}
                      >
                        {saving.has(viewAvis.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
                        Valider l'avis
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { updateAvisStatus(viewAvis.id, "reject"); setViewAvis(null); }}
                        disabled={saving.has(viewAvis.id)}
                      >
                        {saving.has(viewAvis.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <XCircle className="size-4 mr-2" />}
                        Refuser l'avis
                      </Button>
                    </>
                  )}
                  {viewAvis.status === "approved" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { updateAvisStatus(viewAvis.id, "hide"); setViewAvis(null); }}
                      disabled={saving.has(viewAvis.id)}
                    >
                      <XCircle className="size-4 mr-2" />
                      Masquer l'avis
                    </Button>
                  )}
                  {viewAvis.status === "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { updateAvisStatus(viewAvis.id, "approve"); setViewAvis(null); }}
                      disabled={saving.has(viewAvis.id)}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Réactiver (Valider)
                    </Button>
                  )}
                  {viewAvis.status === "hidden" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { updateAvisStatus(viewAvis.id, "approve"); setViewAvis(null); }}
                      disabled={saving.has(viewAvis.id)}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Réactiver (Valider)
                    </Button>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewAvis(null)}>
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