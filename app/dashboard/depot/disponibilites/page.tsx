"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Plus, Package, Truck, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/app/_components/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DEFAULT_BRANDS = ["Total", "Tradex", "Bocom", "SCTM", "Gaz du Cameroun"] as const
const DEFAULT_FORMATS = ["6 kg", "12,5 kg", "15 kg"] as const

interface Depot {
  id: string
  name: string
  district: string
  address: string
}

interface Disponibilite {
  id: string
  brand: string
  format: string
  status: "disponible" | "indisponible" | "a_confirmer"
  quantity: number | null
  price: number | null
  createdAt: string
  updatedAt: string
}

export default function DisponibilitesPage() {
  const [depot, setDepot] = useState<Depot | null>(null)
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newBrand, setNewBrand] = useState("")
  const [newFormat, setNewFormat] = useState("")
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/depot/mine", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Dépôt introuvable")
        const data = await res.json()
        if (!cancelled && data.point) {
          setDepot({
            id: data.point.id,
            name: data.point.name,
            district: data.point.district,
            address: data.point.address,
          })
          loadDisponibilites(data.point.id)
        }
      } catch {
        setError("Impossible de charger votre dépôt")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function loadDisponibilites(pointId: string) {
    try {
      const res = await fetch(`/api/disponibilite/mine`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      const list = (data.disponibilites ?? []).filter(
        (d: any) => d.pointId === pointId
      )
      setDisponibilites(
        list.map((d: any) => ({
          id: d.id,
          brand: d.brand,
          format: d.format,
          status: d.status,
          quantity: d.quantity,
          price: d.price,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }))
      )
    } catch {
      setError("Impossible de charger les disponibilités")
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "disponible" ? "indisponible" : "disponible"
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/disponibilite/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Échec de la mise à jour")
      setDisponibilites((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la mise à jour")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depot) return
    setError(null)
    setAdding(true)
    try {
      const res = await fetch("/api/disponibilite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointId: depot.id,
          brand: newBrand,
          format: newFormat,
          status: "disponible",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de création")
      setDisponibilites((prev) => [
        ...prev,
        {
          id: data.disponibilite.id,
          brand: data.disponibilite.brand,
          format: data.disponibilite.format,
          status: data.disponibilite.status,
          quantity: data.disponibilite.quantity,
          price: data.disponibilite.price,
          createdAt: data.disponibilite.createdAt,
          updatedAt: data.disponibilite.updatedAt,
        },
      ])
      setNewBrand("")
      setNewFormat("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setAdding(false)
    }
  }

  const statusConfig = (status: string) => {
    switch (status) {
      case "disponible":
        return { label: "Disponible", variant: "default" as const, color: "text-emerald-600 bg-emerald-50/50" }
      case "indisponible":
        return { label: "Indisponible", variant: "destructive" as const, color: "text-red-600 bg-red-50/50" }
      default:
        return { label: status, variant: "outline" as const, color: "text-muted-foreground" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!depot) {
    return (
      <Card className="border border-border rounded-xl shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertCircle className="size-6 text-muted-foreground mx-auto mb-3" />
          <CardTitle>Aucun dépôt configuré</CardTitle>
          <CardDescription>
            Vous devez d'abord créer votre point de dépôt.
          </CardDescription>
          <CardFooter className="pt-6">
            <Button asChild className="w-full">
              <Link href="/dashboard/depot">Créer mon dépôt</Link>
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mes disponibilités</h1>
        <Link href="/dashboard/depot">
          <Button variant="outline">
            <Save className="size-4 mr-2" /> Modifier le dépôt
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{depot.name}</CardTitle>
          <CardDescription>
            {depot.address}, {depot.district}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">
                  Ajouter une disponibilité
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marque et format de bouteille
                </p>
              </div>
              <Button
                onClick={() => {
                  setAdding(!adding)
                }}
                variant="outline"
                size="sm"
              >
                {adding ? (
                  "Annuler"
                ) : (
                  <>
                    <Plus className="size-3 mr-2" /> Ajouter
                  </>
                )}
              </Button>
            </div>

            {adding && (
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="add-brand">Marque</Label>
                    <Select
                      value={newBrand}
                      onValueChange={setNewBrand}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une marque" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_BRANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-format">Format</Label>
                    <Select
                      value={newFormat}
                      onValueChange={setNewFormat}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={!newBrand || !newFormat} className="w-full">
                  Créer
                </Button>
              </form>
            )}

            <div className="space-y-2">
              {disponibilites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune disponibilité configurée. Ajoutez votre première bouteille.
                </p>
              ) : (
                disponibilites.map((d) => {
                  const cfg = statusConfig(d.status)
                  return (
                    <Card
                      key={d.id}
                      className={cn(
                        "border border-border rounded-lg shadow-sm transition-all hover:shadow-md group",
                        d.status === "disponible" ? "border-emerald-100" : ""
                      )}
                    >
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Package className="size-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {d.brand} {d.format}
                              </p>
                              {d.quantity !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {d.quantity} bouteille{ d.quantity > 1 ? "s" : "" }
                                </p>
                              )}
                              {d.price !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {d.price} FCFA
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-xs font-medium px-2 py-1 rounded-full", cfg.color)}>
                              {cfg.label}
                            </span>
                            <Switch
                              checked={d.status === "disponible"}
                              onCheckedChange={() => toggleStatus(d.id, d.status)}
                              disabled={saving.has(d.id)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            Maj : {new Date(d.updatedAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
