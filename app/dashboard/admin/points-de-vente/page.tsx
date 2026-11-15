"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Package, AlertCircle, ArrowLeft, Store, User, Truck, Loader2, Trash2, Edit2 } from "lucide-react"
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

const pointSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  district: z.string().min(1, "Le district est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  phone: z.string().nullable().optional(),
  brands: z.array(z.string()).default([]),
  formats: z.array(z.string()).default([]),
  deliveryEnabled: z.boolean().default(false),
  deliveryFee: z.coerce.number().default(0),
  exchangeEnabled: z.boolean().default(false),
  gasSaleEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
  vendorId: z.string().nullable().optional(),
})

type PointFormValues = z.infer<typeof pointSchema>

interface PointDeVente {
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
  vendorId: string | null
  vendorName: string | null
  vendorEmail: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPointsDeVentePage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [points, setPoints] = useState<PointDeVente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [editItem, setEditItem] = useState<PointDeVente | null>(null)
  const [deleteItem, setDeleteItem] = useState<PointDeVente | null>(null)

  const form = useForm<PointFormValues>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      name: "", district: "", address: "", phone: null, brands: [], formats: [],
      deliveryEnabled: false, deliveryFee: 0, exchangeEnabled: false, gasSaleEnabled: false,
      isActive: true, vendorId: null,
    },
  })

  useEffect(() => {
    let cancelled = false
    async function loadPoints() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (filterStatus !== "all") params.set("status", filterStatus)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/points-de-vente?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les points de vente")
        const data = await res.json()
        if (!cancelled) {
          setPoints(data.points ?? [])
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les points de vente")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPoints()
    return () => {
      cancelled = true
    }
  }, [searchQuery, filterStatus])

  const handleEditSubmit = async (values: PointFormValues) => {
    if (!editItem) return
    setSaving((prev) => new Set([...prev, editItem.id]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          district: values.district,
          address: values.address,
          phone: values.phone || null,
          brands: values.brands,
          formats: values.formats,
          deliveryEnabled: values.deliveryEnabled,
          deliveryFee: values.deliveryFee,
          exchangeEnabled: values.exchangeEnabled,
          gasSaleEnabled: values.gasSaleEnabled,
          isActive: values.isActive,
          vendorId: values.vendorId || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de la modification")
      setEditDialog(false)
      form.reset()
      await loadPoints()
      toast.success("Point de vente mis à jour avec succès")
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

  const toggleStatus = async (id: string, isActive: boolean) => {
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
      )
      toast.success(`Dépôt ${!isActive ? "réactivé" : "suspendu"} avec succès`)
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

  const filtered = points.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    }
    return true
  }).filter((p) => {
    if (filterStatus === "active") return p.isActive
    if (filterStatus === "inactive") return !p.isActive
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Points de vente (dépôts)</h1>
          <p className="text-muted-foreground text-sm">
            Consultez et gérez les dépôts de gaz et leurs vendeurs associés
          </p>
        </div>
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
          <CardTitle>Tous les points de vente</CardTitle>
          <CardDescription>
            Gérez les informations de chaque dépôt, ses services et son statut
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, district, adresse..."
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
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Suspendus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Dépôt</th>
                  <th className="text-left py-3 px-4">District / Adresse</th>
                  <th className="text-left py-3 px-4">Vendeur</th>
                  <th className="text-left py-3 px-4">Marques / Formats</th>
                  <th className="text-left py-3 px-4">Services</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-right py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucun point de vente trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Store className="size-4" />
                          </div>
                          <p className="font-medium text-foreground">{p.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <p className="text-sm">{p.district}</p>
                        <p className="text-xs">{p.address}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {p.vendorName || "—"}
                        {p.vendorEmail && <p className="text-xs">{p.vendorEmail}</p>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {(p.brands || []).slice(0, 3).join(", ") || "—"}
                        {(p.brands || []).length > 3 && <span>…</span>}
                        <br />
                        {(p.formats || []).slice(0, 3).join(", ") || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.deliveryEnabled && <span className="text-xs">Livraison</span>}
                          {p.exchangeEnabled && <span className="text-xs">Échange</span>}
                          {p.gasSaleEnabled && <span className="text-xs">Vente gaz</span>}
                          {!p.deliveryEnabled && !p.exchangeEnabled && !p.gasSaleEnabled && <span className="text-xs text-muted-foreground italic">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditItem(p)
                              form.reset({
                                name: p.name,
                                district: p.district,
                                address: p.address,
                                phone: p.phone,
                                brands: p.brands || [],
                                formats: p.formats || [],
                                deliveryEnabled: p.deliveryEnabled,
                                deliveryFee: p.deliveryFee,
                                exchangeEnabled: p.exchangeEnabled,
                                gasSaleEnabled: p.gasSaleEnabled,
                                isActive: p.isActive,
                                vendorId: p.vendorId,
                              })
                              setEditDialog(true)
                            }}
                            disabled={saving.has(p.id)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(p.id, p.isActive)}
                            disabled={saving.has(p.id)}
                          >
                            {p.isActive ? "Suspendre" : "Réactiver"}
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

      {/* Dialog modification */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le point de vente</DialogTitle>
            <DialogDescription>
              Modifiez les informations du dépôt. Les changements sont immédiatement enregistrés.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du dépôt</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District / Quartier</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} placeholder="+237 ..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <FormLabel>Marques acceptées</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {["Butagaz", "Total", "Camgaz", "Sodigaz", "Vitogaz", "Autre"].map((b) => (
                      <label key={b} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border p-2 hover:bg-primary/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.getValues("brands").includes(b)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("brands")
                            form.setValue("brands", checked
                              ? [...current, b]
                              : current.filter((v: string) => v !== b)
                            )
                          }}
                          className="accent-primary"
                        />
                        <span className="text-sm">{b}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <FormLabel>Formats de bouteilles</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {["6 kg", "12,5 kg", "15 kg"].map((f) => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border p-2 hover:bg-primary/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.getValues("formats").includes(f)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("formats")
                            form.setValue("formats", checked
                              ? [...current, f]
                              : current.filter((v: string) => v !== f)
                            )
                          }}
                          className="accent-primary"
                        />
                        <span className="text-sm">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="deliveryEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livraison à domicile</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de livraison (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exchangeEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Échange de bouteille</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gasSaleEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vente de bouteille chargée</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendeur associé</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Aucun vendeur associé" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dépôt actif</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has(editItem!.id)}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
