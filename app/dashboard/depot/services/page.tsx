"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, RotateCcw, Truck, Package, Save } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface Depot {
  id: string
  name: string
  district: string
  address: string
  deliveryEnabled: boolean
  exchangeEnabled: boolean
  gasSaleEnabled: boolean
}

export default function ServicesPage() {
  const [depot, setDepot] = useState<Depot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
            deliveryEnabled: Boolean(data.point.deliveryEnabled),
            exchangeEnabled: Boolean(data.point.exchangeEnabled),
            gasSaleEnabled: Boolean(data.point.gasSaleEnabled),
          })
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

  const toggleService = async (field: string, currentValue: boolean) => {
    const newValue = !currentValue
    setSaving((prev) => new Set([...prev, field]))
    try {
      const res = await fetch(`/api/depot/${depot!.id}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: newValue,
        }),
      })
      if (!res.ok) throw new Error("Échec de la mise à jour")
      setDepot((prev) =>
        prev ? { ...prev, [field]: newValue } : null
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la mise à jour")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(field)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RotateCcw className="size-8 animate-spin text-muted-foreground" />
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

  const services = [
    {
      id: "exchangeEnabled",
      name: "Échange de bouteilles",
      icon: RotateCcw,
      iconColor: "text-blue-600",
      description:
        "Permettez à vos clients d'échanger leurs bouteilles vides contre des pleines.",
      note: "Prix discutable au dépôt",
    },
    {
      id: "deliveryEnabled",
      name: "Livraison à domicile",
      icon: Truck,
      iconColor: "text-green-600",
      description:
        "Proposez la livraison de bouteilles directement chez vos clients.",
      note: "Prix discutable au dépôt",
    },
    {
      id: "gasSaleEnabled",
      name: "Vente de bouteilles avec gaz",
      icon: Package,
      iconColor: "text-purple-600",
      description:
        "Vendez des bouteilles de gaz déjà chargées, prêtes à l'emploi.",
      note: "Prix discutable au dépôt",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mes services</h1>
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
            {services.map((service) => {
              const isActive = Boolean(
                (depot as any)[service.id as keyof Depot]
              )
              return (
                <Card
                  key={service.id}
                  className={cn(
                    "border border-border rounded-lg shadow-sm transition-all hover:shadow-md group",
                    isActive ? "border-primary/50 bg-primary/5" : ""
                  )}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <service.icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {service.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {service.description}
                          </p>
                          <p className="text-xs font-medium text-primary">
                            {service.note}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() =>
                          toggleService(service.id, isActive)
                        }
                        disabled={saving.has(service.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Les services activés apparaissent sur votre fiche publique. Les prix
            sont fixés librement avec chaque client au dépôt.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
