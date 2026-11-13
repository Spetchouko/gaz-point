"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Store,
  Calendar,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { formatDateTime } from "@/lib/gaz"

interface OverviewStats {
  users: {
    total: number
    clients: number
    vendors: number
    admins: number
    active: number
  }
  points: {
    total: number
    active: number
  }
  disponibilites: {
    total: number
    active: number
  }
  reservations: {
    total: number
    pending: number
    confirmed: number
    collected: number
    cancelled: number
    month: number
  }
}

interface RecentActivity {
  id: string
  type: "signup" | "reservation" | "point_created" | "status_change"
  userName: string
  userEmail: string
  details: string
  createdAt: string
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/overview", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les statistiques")
        const data = await res.json()
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les statistiques")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{error || "Erreur inconnue"}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  const statCards = [
    {
      title: "Clients",
      value: stats.users.clients,
      icon: Users,
      iconColor: "text-blue-600",
      link: "/dashboard/admin/utilisateurs",
      label: "Utilisateurs avec le rôle client",
    },
    {
      title: "Vendeurs",
      value: stats.users.vendors,
      icon: Store,
      iconColor: "text-orange-600",
      link: "/dashboard/admin/vendeurs",
      label: "Comptes vendeurs inscrits",
    },
    {
      title: "Points de vente",
      value: stats.points.total,
      icon: Package,
      iconColor: "text-green-600",
      link: "/dashboard/admin/vendeurs",
      label: `${stats.points.active} actifs`,
    },
    {
      title: "Disponibilités",
      value: stats.disponibilites.total,
      icon: Clock,
      iconColor: "text-purple-600",
      link: "/dashboard/admin/disponibilites",
      label: `${stats.disponibilites.active} disponibles`,
    },
    {
      title: "Réservations",
      value: stats.reservations.total,
      icon: Calendar,
      iconColor: "text-red-600",
      link: "/dashboard/admin/reservations",
      label: `${stats.reservations.pending} en attente`,
    },
    {
      title: "Mois en cours",
      value: stats.reservations.month,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      link: "/dashboard/admin/reservations",
      label: "Nouvelles réservations",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Statistiques et activité de la plateforme GazPoints
          </p>
        </div>
      </div>

      {/* Stats cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-sm border border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href={stat.link}
                className="w-full text-xs font-medium text-primary hover:underline"
              >
                Voir détails <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Actions rapides</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Link href="/dashboard/admin/utilisateurs" className="group">
            <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5 text-center">
                <Users className="size-6 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Gérer les utilisateurs
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Clients et administrateurs
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/admin/vendeurs" className="group">
            <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5 text-center">
                <Store className="size-6 mx-auto mb-2 text-orange-600 group-hover:text-orange-600/80 transition-colors" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Gérer les vendeurs
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Approbation et suivi
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/admin/reservations" className="group">
            <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5 text-center">
                <Calendar className="size-6 mx-auto mb-2 text-red-600 group-hover:text-red-600/80 transition-colors" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Gérer les réservations
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Suivi de toutes les réservations
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/admin/disponibilites" className="group">
            <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5 text-center">
                <Package className="size-6 mx-auto mb-2 text-purple-600 group-hover:text-purple-600/80 transition-colors" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Disponibilités
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Stock des vendeurs
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Alerts / important */}
      {stats.reservations.pending > 0 && (
        <section className="mt-6">
          <Card className="border border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800">
                    {stats.reservations.pending} réservation(s) en attente
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Des réservations client attendent votre validation. Consultez la
                    gestion des réservations pour les traiter.
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/reservations?status=pending"
                  className="ml-4"
                >
                  <Button variant="outline" size="sm">
                    Voir les en attente
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
