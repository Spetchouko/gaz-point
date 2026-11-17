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
  Truck,
  Shield,
  BarChart3,
  MessageSquare,
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

interface CollaborateurOverviewStats {
  users?: {
    total: number
    clients: number
    vendors: number
    admins: number
    active: number
  }
  points?: {
    total: number
    active: number
  }
  disponibilites?: {
    total: number
    active: number
  }
  reservations?: {
    total: number
    pending: number
    confirmed: number
    collected: number
    cancelled: number
    month: number
  }
}

interface ModuleAccess {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  description: string
}

const MODULE_ICONS: Record<string, ModuleAccess> = {
  utilisateurs: {
    key: "utilisateurs",
    label: "Gestion des utilisateurs",
    href: "/dashboard/admin/utilisateurs",
    icon: Users,
    iconColor: "text-blue-600",
    description: "Clients, administrateurs et collaborateurs",
  },
  clients: {
    key: "clients",
    label: "Clients",
    href: "/dashboard/admin/utilisateurs?role=client",
    icon: Users,
    iconColor: "text-blue-600",
    description: "Liste des clients de la plateforme",
  },
  vendeurs: {
    key: "vendeurs",
    label: "Gestion des vendeurs",
    href: "/dashboard/admin/vendeurs",
    icon: Store,
    iconColor: "text-orange-600",
    description: "Approbation et suivi des vendeurs",
  },
  disponibilites: {
    key: "disponibilites",
    label: "Disponibilités",
    href: "/dashboard/admin/disponibilites",
    icon: Package,
    iconColor: "text-purple-600",
    description: "Stock des vendeurs et disponibilités",
  },
  reservations: {
    key: "reservations",
    label: "Gestion des réservations",
    href: "/dashboard/admin/reservations",
    icon: Calendar,
    iconColor: "text-red-600",
    description: "Suivi de toutes les réservations",
  },
  publicite: {
    key: "publicite",
    label: "Annonces & publicités",
    href: "/dashboard/admin/publicite",
    icon: Truck,
    iconColor: "text-indigo-600",
    description: "Gestion des annonces publicitaires",
  },
  collaborateurs: {
    key: "collaborateurs",
    label: "Gestion des collaborateurs",
    href: "/dashboard/admin/collaborateurs",
    icon: Shield,
    iconColor: "text-pink-600",
    description: "Création et gestion des comptes collaborateurs",
  },
  marketing: {
    key: "marketing",
    label: "Marketing",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
    iconColor: "text-teal-600",
    description: "Analyses et statistiques marketing",
  },
  avis: {
    key: "avis",
    label: "Avis",
    href: "/dashboard/admin/utilisateurs?type=avis",
    icon: MessageSquare,
    iconColor: "text-green-600",
    description: "Modération des avis clients",
  },
  statistiques: {
    key: "statistiques",
    label: "Statistiques",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
    iconColor: "text-emerald-600",
    description: "Tableaux de bord et rapports",
  },
}

export default function CollaborateurOverviewPage() {
  const [stats, setStats] = useState<CollaborateurOverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set())
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        setLoading(true)
        // Get user permissions from API first
        const permRes = await fetch("/api/user/permissions", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!permRes.ok) {
          throw new Error("Impossible de récupérer les permissions")
        }
        const permData = await permRes.json()
        const permissions = new Set(permData.permissions || [])
        setUserRole(permData.role || "")
        setUserPermissions(permissions)

        // Load stats if user has relevant permissions
        const hasStatsAccess = permissions.has("statistiques") ||
          permissions.has("utilisateurs") ||
          permissions.has("vendeurs") ||
          permissions.has("disponibilites") ||
          permissions.has("reservations")

        if (hasStatsAccess) {
          const res = await fetch("/api/admin/overview", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          })
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) {
              setStats(data)
              setError(null)
            }
          }
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les données")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // We need to re-fetch permissions - let's use a different approach
  // Actually, the permissions come from the layout wrapper which calls getStaff()
  // Let's read from a global or use a different method

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  // Filter modules based on user permissions
  const availableModules = Object.values(MODULE_ICONS).filter((module) =>
    userPermissions.has(module.key)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble collaborateur</h1>
          <p className="text-muted-foreground">
            Accédez aux modules dont vous disposez des permissions
          </p>
        </div>
      </div>

      {/* Quick access cards for allowed modules */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Mes modules accessibles</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availableModules.map((module) => (
            <Link key={module.key} href={module.href} className="group">
              <Card className={cn("border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50", "group")}>
                <CardContent className="pt-5 pb-5 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <module.icon className="size-6" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {module.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {module.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">
                    Accéder <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats overview - only show if user has relevant permissions */}
      {(stats && (userPermissions.has("statistiques") || userPermissions.has("utilisateurs") || userPermissions.has("vendeurs") || userPermissions.has("disponibilites") || userPermissions.has("reservations"))) && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Statistiques rapides</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userPermissions.has("utilisateurs") && stats.users && (
              <Card className="shadow-sm border border-border">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Clients
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.users.clients}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.users.active} actifs sur {stats.users.total} total
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Users className="size-5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/admin/utilisateurs" className="w-full text-xs font-medium text-primary hover:underline">
                    Voir détails <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            )}

            {userPermissions.has("vendeurs") && stats.points && (
              <Card className="shadow-sm border border-border">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Points de vente
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.points.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.points.active} actifs
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Store className="size-5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/admin/vendeurs" className="w-full text-xs font-medium text-primary hover:underline">
                    Voir détails <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            )}

            {userPermissions.has("disponibilites") && stats.disponibilites && (
              <Card className="shadow-sm border border-border">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Disponibilités
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.disponibilites.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.disponibilites.active} disponibles
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <Package className="size-5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/admin/disponibilites" className="w-full text-xs font-medium text-primary hover:underline">
                    Voir détails <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            )}

            {userPermissions.has("reservations") && stats.reservations && (
              <Card className="shadow-sm border border-border">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Réservations
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.reservations.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.reservations.pending} en attente • {stats.reservations.month} ce mois
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <Calendar className="size-5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/admin/reservations" className="w-full text-xs font-medium text-primary hover:underline">
                    Voir détails <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Alerts for pending reservations if user has access */}
      {stats?.reservations?.pending && stats.reservations.pending > 0 && userPermissions.has("reservations") && (
        <section className="mt-6">
          <Card className="border border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <span className="size-5 text-amber-600">⚠</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800">
                    {stats.reservations.pending} réservation(s) en attente
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Des réservations client attendent votre validation. Consultez la
                    gestion des réservations pour les traiter.
                  </p>
                </div>
                <Link href="/dashboard/admin/reservations?status=pending">
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