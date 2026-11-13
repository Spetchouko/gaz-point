"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Edit,
  RefreshCw,
  Package,
  Truck,
  RotateCcw,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Depot {
  id: string
  name: string
  district: string
  address: string
  brands: string[]
  formats: string[]
  deliveryEnabled: boolean
  exchangeEnabled: boolean
  gasSaleEnabled: boolean
}

interface Stats {
  depots: number
  brands: number
  formats: number
  available: number
  unavailable: number
  reservations: number
  pending: number
}

export default function VendeurPage() {
  const [depot, setDepot] = useState<Depot | null>(null)
  const [stats, setStats] = useState<Stats>({
    depots: 0,
    brands: 0,
    formats: 0,
    available: 0,
    unavailable: 0,
    reservations: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [depotRes, dispoRes, resRes] = await Promise.all([
          fetch("/api/depot/mine", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/disponibilite/mine", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/reservation/vendor?pageSize=50", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ])

        if (depotRes.ok) {
          const depotData = await depotRes.json()
          if (depotData.point) {
            setDepot({
              id: depotData.point.id,
              name: depotData.point.name,
              district: depotData.point.district,
              address: depotData.point.address,
              brands: depotData.point.brands ?? [],
              formats: depotData.point.formats ?? [],
              deliveryEnabled: Boolean(depotData.point.deliveryEnabled),
              exchangeEnabled: Boolean(depotData.point.exchangeEnabled),
              gasSaleEnabled: Boolean(depotData.point.gasSaleEnabled),
            })
          }
        }

        if (dispoRes.ok) {
          const dispoData = await dispoRes.json()
          const dispo = dispoData.disponibilites ?? []
          const available = dispo.filter((d: any) => d.status === "disponible").length
          const unavailable = dispo.filter((d: any) => d.status === "indisponible").length
          setStats((prev) => ({ ...prev, available, unavailable }))
        }

        if (resRes.ok) {
          const resData = await resRes.json()
          const reservations = resData.reservations ?? []
          const pending = reservations.filter(
            (r: any) => r.status === "pending" || r.status === "confirmed"
          ).length
          setStats((prev) => ({ ...prev, reservations: reservations.length, pending }))
        }

        if (!cancelled) {
          const brands = depot ? new Set(depot.brands).size : 0
          const formats = depot ? new Set(depot.formats).size : 0
          setStats((prev) => ({ ...prev, brands, formats, depots: depot ? 1 : 0 }))
        }
      } catch {
        setError("Impossible de charger les données du tableau de bord")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!depot) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border border-border rounded-xl shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="size-6 text-muted-foreground mx-auto mb-3" />
            <CardTitle>Aucun dépôt configuré</CardTitle>
            <CardDescription>
              Vous devez d'abord créer votre point de dépôt pour accéder au
              tableau de bord vendeur.
            </CardDescription>
            <CardFooter className="pt-6">
              <Button asChild className="w-full">
                <Link href="/dashboard/depot">Créer mon dépôt</Link>
              </Button>
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: "Marques",
      value: stats.brands,
      icon: Package,
      label: "gérées",
    },
    {
      title: "Formats",
      value: stats.formats,
      icon: RotateCcw,
      label: "disponibles",
    },
    {
      title: "Disponibles",
      value: stats.available,
      icon: CheckCircle2,
      label: "produits",
    },
    {
      title: "Indisponibles",
      value: stats.unavailable,
      icon: AlertCircle,
      label: "produits",
    },
    {
      title: "Réservations",
      value: stats.reservations,
      icon: Calendar,
      label: "reçues",
    },
    {
      title: "En attente",
      value: stats.pending,
      icon: Clock,
      label: "à traiter",
    },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord vendeur</h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre point de dépôt GazPoints
          </p>
        </div>
        <Link href="/dashboard/depot/services">
          <Button variant="default">
            <Edit className="size-4 mr-2" /> Gérer les services
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
          <div className="grid gap-3 sm:grid-cols-3">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className="border border-border rounded-lg shadow-sm p-3"
              >
                <CardContent className="pt-2 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="size-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/depot/disponibilites" className="group">
          <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue/10 text-blue group-hover:bg-blue group-hover:text-blue-foreground transition-colors">
                  <Package className="size-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-blue transition-colors">
                    Mes disponibilités
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gérez vos marques et formats
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/depot/services" className="group">
          <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green group-hover:bg-green group-hover:text-green-foreground transition-colors">
                  <Truck className="size-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-green transition-colors">
                    Mes services
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Échange, livraison, vente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/depot/reservations" className="group">
          <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple group-hover:bg-purple group-hover:text-purple-foreground transition-colors">
                  <Calendar className="size-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-purple transition-colors">
                    Mes réservations
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valider les retraits clients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
