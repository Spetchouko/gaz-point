"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Package, AlertCircle, ArrowLeft, Store, User, Truck, Loader2, Trash2, Edit2, MapPin, Shield, ShieldCheck, ShieldAlert, Building2, ChevronLeft, ChevronRight, Package as PackageIcon } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"

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

interface Vendor {
  id: string
  name: string
  email: string
}

export default function PointDeVenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [point, setPoint] = useState<PointDeVente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [vendors, setVendors] = useState<Vendor[]>([])

  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const form = useForm<PointFormValues>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      name: "", district: "", address: "", phone: null, brands: [], formats: [],
      deliveryEnabled: false, deliveryFee: 0, exchangeEnabled: false, gasSaleEnabled: false,
      isActive: true, vendorId: null,
    },
  })

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params
      try {
        setLoading(true)
        const [pointRes, vendorsRes] = await Promise.all([
          fetch(`/api/admin/points-de-vente?id=${id}`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`/api/admin/vendors/list`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          })
        ])

        if (!pointRes.ok) throw new Error("Impossible de charger le point de vente")
        const pointData = await pointRes.json()
        if (!pointData.point) throw new Error("Point de vente introuvable")

        const vendorsData = await vendorsRes.json()
        setPoint(pointData.point)
        setVendors(vendorsData.vendors ?? [])
        setError(null)
      } catch {
        setError("Impossible de charger les données")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params])

  const handleEditSubmit = async (values: PointFormValues) => {
    if (!point) return
    setSaving((prev) => new Set([...prev, point.id]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${point.id}`, {
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
      const { id } = await params
      const res2 = await fetch(`/api/admin/points-de-vente?id=${id}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (res2.ok) {
        const data = await res2.json()
        if (data.point) setPoint(data.point)
      }
      toast.success("Point de vente mis à jour avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(point.id)
        return next
      })
    }
  }

  const toggleStatus = async () => {
    if (!point) return
    setSaving((prev) => new Set([...prev, point.id]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${point.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !point.isActive }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setPoint((prev) => prev ? { ...prev, isActive: !prev.isActive } : null)
      toast.success(`Dépôt ${!point.isActive ? "réactivé" : "suspendu"} avec succès`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(point.id)
        return next
      })
    }
  }

  const deletePoint = async () => {
    if (!point) return
    setSaving((prev) => new Set([...prev, point.id]))
    try {
      const res = await fetch(`/api/admin/points-de-vente/${point.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Échec de la suppression")
      toast.success("Point de vente supprimé avec succès")
      window.location.href = "/dashboard/admin/points-de-vente"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(point.id)
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

  if (error || !point) {
    return (
      <div className="admin-section">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Point de vente</h1>
          </div>
          <Link href="/dashboard/admin/points-de-vente">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" /> Retour
            </Button>
          </Link>
        </div>
        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-destructive">Point de vente introuvable</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ce point de vente n&apos;existe plus ou a été supprimé.
              </p>
            </div>
          </div>
          <Link href="/dashboard/admin/points-de-vente">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="size-4 mr-2" /> Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <div>
          <Link href="/dashboard/admin/points-de-vente" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="size-4" />
            Retour à la liste
          </Link>
          <h1 className="admin-page-title">{point.name}</h1>
          <p className="admin-page-subtitle">{point.district} • {point.address}</p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour admin
          </Button>
        </Link>
      </div>

      {/* Header Card with Status */}
      <Card className="border border-border shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{point.name}</h2>
                <p className="text-muted-foreground mt-1">{point.district} • {point.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={point.isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
                {point.isActive ? "Actif" : "Suspendu"}
              </Badge>
              {point.vendorName && (
                <Badge variant="outline" className="px-3 py-1">
                  <User className="size-3 mr-1" /> {point.vendorName}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Localisation & Coordonnées */}
        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Localisation & Coordonnées
            </CardTitle>
            <CardDescription>Informations géographiques et de contact du dépôt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adresse complète</p>
                <p className="text-foreground break-all">{point.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">District / Quartier</p>
                <p className="text-foreground">{point.district}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone du dépôt</p>
                <p className="text-foreground">{point.phone || "Non renseigné"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date de création</p>
                <p className="text-foreground">{new Date(point.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendeur associé */}
        {point.vendorName && (
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                Vendeur associé
              </CardTitle>
              <CardDescription>Informations du vendeur gérant ce dépôt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Nom</span>
                  <span className="font-medium">{point.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Email</span>
                  <span className="font-medium break-all">{point.vendorEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">ID</span>
                  <span className="font-mono text-xs text-muted-foreground">{point.vendorId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marques & Formats */}
        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="size-5 text-primary" />
              Marques & Formats de bouteilles
            </CardTitle>
            <CardDescription>Produits disponibles dans ce dépôt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Marques acceptées</p>
              <div className="flex flex-wrap gap-1">
                {(point.brands || []).length > 0 ? (
                  (point.brands || []).map((b) => (
                    <span key={b} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{b}</span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Aucune marque définie</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Formats de bouteilles</p>
              <div className="flex flex-wrap gap-1">
                {(point.formats || []).length > 0 ? (
                  (point.formats || []).map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded bg-info/10 text-info">{f}</span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Aucun format défini</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              Services proposés
            </CardTitle>
            <CardDescription>Services disponibles dans ce dépôt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-3 transition-colors",
                point.deliveryEnabled ? "bg-success/10 border-success/30" : "bg-muted/30 border-border"
              )}>
                <div className={cn("size-10 rounded-lg flex items-center justify-center", point.deliveryEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                  <Truck className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Livraison à domicile</p>
                  <p className="text-xs text-muted-foreground">
                    {point.deliveryEnabled ? `Activée (${point.deliveryFee.toLocaleString()} FCFA)` : "Non disponible"}
                  </p>
                </div>
              </div>
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-3 transition-colors",
                point.exchangeEnabled ? "bg-warning/10 border-warning/30" : "bg-muted/30 border-border"
              )}>
                <div className={cn("size-10 rounded-lg flex items-center justify-center", point.exchangeEnabled ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Échange bouteilles</p>
                  <p className="text-xs text-muted-foreground">
                    {point.exchangeEnabled ? "Disponible" : "Non disponible"}
                  </p>
                </div>
              </div>
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-3 transition-colors",
                point.gasSaleEnabled ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border"
              )}>
                <div className={cn("size-10 rounded-lg flex items-center justify-center", point.gasSaleEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <PackageIcon className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Vente de gaz</p>
                  <p className="text-xs text-muted-foreground">
                    {point.gasSaleEnabled ? "Disponible" : "Non disponible"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Actions Administratives */}
      <Card className="border border-border shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Actions administratives
          </CardTitle>
          <CardDescription>Actions disponibles selon vos permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={point.isActive ? "outline" : "default"}
              size="sm"
              onClick={toggleStatus}
              disabled={saving.has(point.id)}
            >
              {saving.has(point.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Shield className="size-4 mr-2" />}
              {point.isActive ? "Suspendre le dépôt" : "Réactiver le dépôt"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialog(true)}
              disabled={saving.has(point.id)}
            >
              <Trash2 className="size-4 mr-2" />
              Supprimer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                form.reset({
                  name: point.name,
                  district: point.district,
                  address: point.address,
                  phone: point.phone,
                  brands: point.brands || [],
                  formats: point.formats || [],
                  deliveryEnabled: point.deliveryEnabled,
                  deliveryFee: point.deliveryFee,
                  exchangeEnabled: point.exchangeEnabled,
                  gasSaleEnabled: point.gasSaleEnabled,
                  isActive: point.isActive,
                  vendorId: point.vendorId,
                })
                setEditDialog(true)
              }}
              disabled={saving.has(point.id)}
            >
              <Edit2 className="size-4 mr-2" />
              Modifier
            </Button>
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
                            {vendors.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name} ({v.email})</SelectItem>
                            ))}
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
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has(point.id)}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Supprimer le point de vente
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement le dépôt <strong>{point?.name}</strong> ?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Cette action est irréversible. Si le dépôt est lié à des réservations ou des disponibilités actives, la suppression sera refusée pour protéger ces données.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={deletePoint}
              disabled={saving.has(point.id)}
            >
              {saving.has(point.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}