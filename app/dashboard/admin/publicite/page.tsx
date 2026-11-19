"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Truck, AlertCircle, ArrowLeft, Image, Link as LinkIcon, Play, Eye, EyeOff, Trash2, Edit2, Clock2, Plus, Loader2 } from "lucide-react"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"
import { AdminPageHeader } from "@/app/_components/dashboard/admin"

const slotSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(60),
  description: z.string().max(160).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  linkUrl: z.string().optional().or(z.literal("")),
  slot: z.string(),
  status: z.enum(["draft", "scheduled", "active", "expired", "suspended"]),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
})

type SlotFormValues = z.infer<typeof slotSchema>

interface PubliciteItem {
  id: string
  title: string
  description: string | null
  image: string | null
  price: number | null
  priceLabel: string | null
  location: string | null
  phone: string | null
  linkUrl: string | null
  slot: string
  status: string
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

const slotLabels: Record<string, string> = {
  home_hero: "Accueil — sous la bannière",
  home_search: "Accueil — au-dessus de « Trouver mon Gaz »",
}

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  active: "En cours",
  expired: "Terminée",
  suspended: "Suspendue",
}

export default function AdminPublicitePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSlot, setFilterSlot] = useState<string>("all")
  const [publicites, setPublicites] = useState<PubliciteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [editItem, setEditItem] = useState<PubliciteItem | null>(null)
  const [previewItem, setPreviewItem] = useState<PubliciteItem | null>(null)

  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      title: "", description: "", image: "", linkUrl: "",
      slot: "home_hero", status: "draft", startAt: "", endAt: "",
    },
  })

  useEffect(() => {
    let cancelled = false
    async function loadPublicites() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (filterSlot !== "all") params.set("slot", filterSlot)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/publicite?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les annonces")
        const data = await res.json()
        if (!cancelled) {
          setPublicites(data.publicites ?? [])
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les annonces")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPublicites()
    return () => {
      cancelled = true
    }
  }, [searchQuery, filterStatus, filterSlot])

  const handleCreateSubmit = async (values: SlotFormValues) => {
    setSaving((prev) => new Set([...prev, "create"]))
    try {
      const res = await fetch("/api/admin/publicite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          image: values.image || null,
          linkUrl: values.linkUrl || null,
          slot: values.slot,
          status: values.status,
          startAt: values.startAt || null,
          endAt: values.endAt || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de la création")
      setCreateDialog(false)
      form.reset()
      await loadPublicites()
      toast.success("Annonce créée avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete("create")
        return next
      })
    }
  }

  const handleEditSubmit = async (values: SlotFormValues) => {
    if (!editItem) return
    setSaving((prev) => new Set([...prev, editItem.id]))
    try {
      const res = await fetch(`/api/admin/publicite/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          image: values.image || null,
          linkUrl: values.linkUrl || null,
          slot: values.slot,
          status: values.status,
          startAt: values.startAt || null,
          endAt: values.endAt || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de la modification")
      setEditDialog(false)
      form.reset()
      await loadPublicites()
      toast.success("Annonce mise à jour avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(editItem.id)
        return next
      })
    }
  }

  const toggleStatus = async (id: string, status: string) => {
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setPublicites((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      )
      toast.success("Statut de l'annonce mis à jour")
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

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Échec de la suppression")
      setPublicites((prev) => prev.filter((p) => p.id !== id))
      toast.success("Annonce supprimée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const filtered = publicites.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.title.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q)
    }
    return true
  }).filter((p) => {
    if (filterStatus !== "all") return p.status === filterStatus
    return true
  }).filter((p) => {
    if (filterSlot !== "all") return p.slot === filterSlot
    return true
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  }

  const imageUrl = (img: string | null) => {
    if (!img) return null
    return img.startsWith("data:") || img.startsWith("http") ? img : null
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
      <AdminPageHeader
        title="Annonces & publicités"
        subtitle="Créez, modifiez et suivez les annonces publicitaires affichées sur le site"
        icon={<Truck className="size-5" />}
        actions={
          <>
            <Button onClick={() => {
              form.reset({
                title: "", description: "", image: "", linkUrl: "",
                slot: "home_hero", status: "draft", startAt: "", endAt: "",
              })
              setCreateDialog(true)
            }}>
              <Plus className="size-4 mr-2" /> Nouvelle annonce
            </Button>
            <Link href="/dashboard/admin">
              <Button variant="outline">
                <ArrowLeft className="size-4 mr-2" /> Retour
              </Button>
            </Link>
          </>
        }
      />

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
          <CardTitle>Gestion des annonces</CardTitle>
          <CardDescription>
            Toutes les annonces configurées dans Neon, avec leurs emplacements et dates de diffusion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre..."
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Programmée</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="expired">Terminée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSlot} onValueChange={setFilterSlot}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les emplacements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les emplacements</SelectItem>
                <SelectItem value="home_hero">Accueil — sous bannière</SelectItem>
                <SelectItem value="home_search">Accueil — recherche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Aperçu</th>
                  <th className="text-left py-3 px-4">Titre</th>
                  <th className="text-left py-3 px-4">Emplacement</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Diffusion</th>
                  <th className="text-left py-3 px-4">Créée le</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucune annonce trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted">
                            {imageUrl(p.image) ? (
                              <img src={imageUrl(p.image)!} alt="Aperçu" className="size-10 object-cover" />
                            ) : (
                              <Image className="size-5 text-muted-foreground" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setPreviewItem(p); setPreviewDialog(true) }}
                            className="text-xs text-muted-foreground hover:text-primary underline"
                            title="Prévisualiser"
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <p className="font-medium text-foreground">{p.title}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {slotLabels[p.slot] ?? p.slot}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === "active" ? "default" : p.status === "suspended" ? "secondary" : "outline"}>
                          {statusLabels[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(p.startAt)} — {formatDate(p.endAt)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const next = p.status === "active" ? "suspended" : "active"
                              toggleStatus(p.id, next)
                            }}
                            disabled={saving.has(p.id)}
                          >
                            {p.status === "active" ? "Désactiver" : "Activer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditItem(p)
                              form.reset({
                                title: p.title,
                                description: p.description ?? "",
                                image: p.image ?? "",
                                linkUrl: p.linkUrl ?? "",
                                slot: p.slot,
                                status: p.status as any,
                                startAt: p.startAt ? new Date(p.startAt).toISOString().slice(0, 16) : "",
                                endAt: p.endAt ? new Date(p.endAt).toISOString().slice(0, 16) : "",
                              })
                              setEditDialog(true)
                            }}
                            disabled={saving.has(p.id)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            disabled={saving.has(p.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
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

      {/* Dialog création */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle annonce publicitaire</DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'annonce. L'image sera stockée dans Neon.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de l'annonce</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Promo gaz 12,5 kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Détails de l'offre..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image (data-URL ou URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="Collez une data-URL ou une URL d'image" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien de destination</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un emplacement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home_hero">Accueil — sous la bannière</SelectItem>
                          <SelectItem value="home_search">Accueil — au-dessus de « Trouver mon Gaz »</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="scheduled">Programmée</SelectItem>
                          <SelectItem value="active">En cours</SelectItem>
                          <SelectItem value="expired">Terminée</SelectItem>
                          <SelectItem value="suspended">Suspendue</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début de diffusion</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de diffusion</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has("create")}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog modification */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'annonce</DialogTitle>
            <DialogDescription>
              Les changements sont immédiatement enregistrés en base.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de l'annonce</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image (data-URL ou URL)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien de destination</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un emplacement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home_hero">Accueil — sous la bannière</SelectItem>
                          <SelectItem value="home_search">Accueil — au-dessus de « Trouver mon Gaz »</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="scheduled">Programmée</SelectItem>
                          <SelectItem value="active">En cours</SelectItem>
                          <SelectItem value="expired">Terminée</SelectItem>
                          <SelectItem value="suspended">Suspendue</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || (editItem && saving.has(editItem.id))}
                >
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog prévisualisation */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prévisualisation de l'annonce</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                {imageUrl(previewItem.image) ? (
                  <img src={imageUrl(previewItem.image)!} alt="Prévisualisation" className="max-h-64 object-contain" />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <Image className="size-8" /> Aucune image
                  </div>
                )}
              </div>
              <p className="font-semibold text-foreground">{previewItem.title}</p>
              {previewItem.description && (
                <p className="text-muted-foreground">{previewItem.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{slotLabels[previewItem.slot] ?? previewItem.slot}</span>
                <span>•</span>
                <Badge variant={previewItem.status === "active" ? "default" : "outline"}>
                  {statusLabels[previewItem.status] ?? previewItem.status}
                </Badge>
              </div>
              {previewItem.linkUrl && (
                <a href={previewItem.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                  Voir le lien de destination
                </a>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
