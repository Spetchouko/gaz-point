"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, Package, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { VendorAvailabilityForm } from "@/app/_components/vendor-availability-form"
import { normalizeCatalogValue } from "@/lib/vendor-catalog"

interface Depot {
  id: string
  name: string
  district: string
  address: string
  brands: string[]
  formats: string[]
}

interface Disponibilite {
  id: string
  pointId: string
  brand: string
  format: string
  status: "disponible" | "indisponible" | "a_confirmer"
  quantity: number | null
  price: number | null
  createdAt: string
  updatedAt: string
}

function combinationKey(brand: string, format: string) {
  return `${normalizeCatalogValue(brand)}::${normalizeCatalogValue(format)}`
}

export function VendorAvailabilityManager() {
  const [depot, setDepot] = useState<Depot | null>(null)
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const loadDisponibilites = useCallback(async (pointId: string) => {
    const response = await fetch("/api/disponibilite/mine", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Erreur de chargement")

    const payload = (await response.json()) as {
      disponibilites?: Disponibilite[]
    }
    setDisponibilites(
      (payload.disponibilites ?? []).filter((item) => item.pointId === pointId)
    )
  }, [])

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch("/api/depot/mine", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!response.ok) throw new Error("Dépôt introuvable")

      const payload = (await response.json()) as { point?: Depot | null }
      if (!payload.point) {
        setDepot(null)
        return
      }

      setDepot(payload.point)
      await loadDisponibilites(payload.point.id)
    } catch {
      setError("Impossible de charger votre dépôt")
    } finally {
      setLoading(false)
    }
  }, [loadDisponibilites])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const existingCombinations = useMemo(
    () =>
      disponibilites.map((item) => combinationKey(item.brand, item.format)),
    [disponibilites]
  )

  const existingQuantities = useMemo(() => {
    const quantities: Record<string, number> = {}
    for (const item of disponibilites) {
      quantities[combinationKey(item.brand, item.format)] = item.quantity ?? 1
    }
    return quantities
  }, [disponibilites])

  const toggleStatus = async (item: Disponibilite) => {
    const newStatus =
      item.status === "disponible" ? "indisponible" : "disponible"

    if (newStatus === "disponible" && !item.quantity) {
      setError(
        "Ajoutez une quantité avant de publier cette disponibilité comme disponible."
      )
      return
    }

    setSaving((current) => new Set([...current, item.id]))
    setError(null)
    try {
      const response = await fetch(`/api/disponibilite/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Échec de la mise à jour")

      setDisponibilites((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: newStatus } : entry
        )
      )
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Échec de la mise à jour"
      )
    } finally {
      setSaving((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Chargement" />
      </div>
    )
  }

  if (!depot) {
    return (
      <Card className="mx-auto max-w-xl border-border shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground" />
          <CardTitle>Aucun dépôt configuré</CardTitle>
          <CardDescription className="mt-2">
            Créez d&apos;abord votre point de dépôt pour renseigner vos disponibilités.
          </CardDescription>
          <CardFooter className="justify-center pt-6">
            <Button render={<Link href="/dashboard/depot">Créer mon dépôt</Link>} />
          </CardFooter>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes disponibilités</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complétez cette étape quand vous le souhaitez.
          </p>
        </div>
        <Button
          variant="outline"
          render={
            <Link href="/dashboard/vendeur">
              <Save className="size-4" /> Retour au tableau de bord
            </Link>
          }
        />
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <VendorAvailabilityForm
        pointId={depot.id}
        brands={depot.brands ?? []}
        formats={depot.formats ?? []}
        existingCombinations={existingCombinations}
        existingQuantities={existingQuantities}
        onSaved={() => loadDisponibilites(depot.id)}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Disponibilités enregistrées</CardTitle>
          <CardDescription>
            {depot.name}, {depot.address}, {depot.district}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disponibilites.length === 0 ? (
            <div className="py-6 text-center">
              <Package className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune disponibilité enregistrée. Sélectionnez une combinaison
                ci-dessus pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {disponibilites.map((item) => {
                const available = item.status === "disponible"
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.brand} · {item.format}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.quantity !== null
                          ? `${item.quantity} bouteille${item.quantity > 1 ? "s" : ""}`
                          : "Quantité non renseignée"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          available
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {available && <CheckCircle2 className="size-3" aria-hidden />}
                        {available ? "Disponible" : "Indisponible"}
                      </span>
                      <Switch
                        checked={available}
                        disabled={saving.has(item.id)}
                        onCheckedChange={() => void toggleStatus(item)}
                        aria-label={`${available ? "Masquer" : "Publier"} ${item.brand} ${item.format}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
