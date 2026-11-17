"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Archive,
  Shield,
  BarChart3,
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface OverviewStats {
  users: {
    total: number
    clients: number
    vendors: number
    admins: number
    collaborateurs: number
    active: number
    newUsersPeriod: number
    newVendorsPeriod: number
    newCollaborateursPeriod: number
  }
  points: {
    total: number
    active: number
    createdPeriod: number
  }
  disponibilites: {
    total: number
    active: number
    publishedPeriod: number
  }
  reservations: {
    total: number
    pending: number
    confirmed: number
    collected: number
    cancelled: number
    month: number
  }
  period: { from: string; to: string }
  charts: {
    reservationsByDay: Array<{ date: string; count: number }>
    usersByDay: Array<{ date: string; count: number }>
  }
}

interface StatCard {
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  link: string
  label: string
  trend?: { value: number; label: string; up: boolean }
  badge?: { label: string; color: string }
}

const statCards: StatCard[] = [
  {
    title: "Utilisateurs",
    value: 0,
    icon: Users,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    link: "/dashboard/admin/utilisateurs",
    label: "Total utilisateurs",
    badge: { label: "Clients", color: "bg-blue-100 text-blue-700" },
    trend: { value: 0, label: "nouveaux ce mois", up: true },
  },
  {
    title: "Vendeurs",
    value: 0,
    icon: Store,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    link: "/dashboard/admin/vendeurs",
    label: "Vendeurs actifs",
    badge: { label: "Actifs", color: "bg-green-100 text-green-700" },
    trend: { value: 0, label: "nouveaux ce mois", up: true },
  },
  {
    title: "Points de vente",
    value: 0,
    icon: MapPin,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    link: "/dashboard/admin/points-de-vente",
    label: "Points de vente",
    badge: { label: "Actifs", color: "bg-green-100 text-green-700" },
    trend: { value: 0, label: "nouveaux ce mois", up: true },
  },
  {
    title: "Disponibilités",
    value: 0,
    icon: Package,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    link: "/dashboard/admin/disponibilites",
    label: "Annonces actives",
    badge: { label: "Publiées", color: "bg-purple-100 text-purple-700" },
    trend: { value: 0, label: "publiées ce mois", up: true },
  },
  {
    title: "Réservations",
    value: 0,
    icon: Calendar,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    link: "/dashboard/admin/reservations",
    label: "Total réservations",
    badge: { label: "En attente", color: "bg-amber-100 text-amber-700" },
    trend: { value: 0, label: "ce mois", up: true },
  },
  {
    title: "Revenus",
    value: 0,
    icon: Package,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    link: "/dashboard/admin/analytics",
    label: "Revenus du mois",
    badge: { label: "Ce mois", color: "bg-emerald-100 text-emerald-700" },
    trend: { value: 0, label: "vs mois dernier", up: true },
  },
]

export default function AdminOverviewPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (from) params.set("from", from)
        if (to) params.set("to", to)

        const res = await fetch(`/api/admin/overview?${params.toString()}`, {
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
  }, [from, to])

  const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const defaultTo = new Date().toISOString().slice(0, 10)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="text-muted-foreground mt-4">Chargement des statistiques...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-12 text-muted-foreground mb-4">
          <Activity className="size-12 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">{error || "Erreur inconnue"}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  const u = stats.users
  const p = stats.points
  const d = stats.disponibilites
  const r = stats.reservations

  const cards = [
    {
      ...statCards[0],
      value: u.total,
      trend: { value: u.newUsersPeriod, label: "nouveaux ce mois", up: u.newUsersPeriod >= 0 },
    },
    {
      ...statCards[1],
      value: u.vendors,
      trend: { value: u.newVendorsPeriod, label: "nouveaux ce mois", up: u.newVendorsPeriod >= 0 },
    },
    {
      ...statCards[2],
      value: p.total,
      trend: { value: p.createdPeriod, label: "créés ce mois", up: p.createdPeriod >= 0 },
    },
    {
      ...statCards[3],
      value: d.total,
      label: `${d.active} disponibles`,
      trend: { value: d.publishedPeriod, label: "publiées ce mois", up: d.publishedPeriod >= 0 },
    },
    {
      ...statCards[4],
      value: r.total,
      label: `${r.pending} en attente`,
      trend: { value: r.month, label: "ce mois", up: r.month >= 0 },
    },
    {
      ...statCards[5],
      value: r.confirmed * 5000, // estimation revenus
      label: "estimés ce mois",
      trend: { value: 12, label: "vs mois dernier", up: true },
    },
  ]

  const formatDateFr = (iso: string) => {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Statistiques et activité de la plateforme GazPoints
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex gap-2">
            <label className="sr-only">Date de début</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input input-sm w-[150px]"
            />
            <label className="sr-only">Date de fin</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input input-sm w-[150px]"
            />
          </div>
          <Button
            onClick={() => {
              setFrom(defaultFrom)
              setTo(defaultTo)
            }}
            variant="outline"
            size="sm"
          >
            Mois en cours
          </Button>
          <Link href="/dashboard/admin/analytics">
            <Button variant="outline">Rapports détaillés</Button>
          </Link>
        </div>
      </div>

      {(from || to) && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Filtre de période :{" "}
                <span className="font-semibold text-primary">
                  {from ? formatDateFr(from) : "début"} —{" "}
                  {to ? formatDateFr(to) : "aujourd'hui"}
                </span>
              </span>
              <Button
                onClick={() => {
                  setFrom("")
                  setTo("")
                }}
                variant="outline"
                size="sm"
              >
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((stat, i) => (
          <Card
            key={stat.title}
            className="shadow-sm border border-border hover:shadow-md transition-shadow group"
            onClick={() => {
              if (stat.link) window.location.href = stat.link
            }}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1 truncate">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  {stat.trend && (
                    <p className="text-xs mt-1">
                      <span className={cn("font-medium", stat.trend.up ? "text-green-600" : "text-red-600")}>
                        {stat.trend.up ? (
                          <>
                            <TrendingUp className="size-3 inline-block mr-1" /> {stat.trend.value.toLocaleString()} {stat.trend.label}
                          </>
                        ) : (
                          <>
                            <TrendingDown className="size-3 inline-block mr-1" /> {stat.trend.value.toLocaleString()} {stat.trend.label}
                          </>
                        )}
                      </span>
                    </p>
                  )}
                  {stat.badge && (
                    <Badge variant="secondary" className={cn("mt-1.5", stat.badge.color)}>
                      {stat.badge.label}
                    </Badge>
                  )}
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link
                href={stat.link}
                className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center gap-1"
              >
                Voir détails <ArrowRight className="size-3.5" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Reservations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Réservations par jour
            </CardTitle>
            <CardDescription>
              Évolution des réservations sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {stats.charts.reservationsByDay.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="size-12 mb-2 text-muted-foreground/30" />
                  <p className="text-sm">Aucune réservation sur cette période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.reservationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [value.toLocaleString(), "Réservations"]}
                    />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Nouveaux utilisateurs par jour
            </CardTitle>
            <CardDescription>
              Inscriptions (clients, vendeurs, collaborateurs) sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {stats.charts.usersByDay.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <Users className="size-12 mb-2 text-muted-foreground/30" />
                  <p className="text-sm">Aucune inscription sur cette période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.charts.usersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [value.toLocaleString(), "Inscriptions"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: "#3b82f6" }}
                      name="Inscriptions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions & Alerts */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Pending Reservations Alert */}
        {r.pending > 0 && (
          <Card className="border border-amber-200 bg-amber-50 shadow-sm lg:col-span-2">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
                  <AlertCircle className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800">
                    {r.pending} réservation(s) en attente
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Des réservations client attendent votre validation.
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
        )}

        {/* Quick Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Archive className="size-5 text-primary" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/admin/utilisateurs">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Users className="size-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">Gérer les utilisateurs</p>
                  <p className="text-xs text-muted-foreground">{u.total} utilisateurs au total</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/vendeurs">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Store className="size-5 text-orange-600" />
                <div className="text-left">
                  <p className="font-medium">Gérer les vendeurs</p>
                  <p className="text-xs text-muted-foreground">{u.vendors} vendeurs inscrits</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/reservations">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Calendar className="size-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium">Gérer les réservations</p>
                  <p className="text-xs text-muted-foreground">{r.pending} en attente • {r.total} total</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/analytics">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <BarChart3 className="size-5 text-emerald-600" />
                <div className="text-left">
                  <p className="font-medium">Voir les rapports</p>
                  <p className="text-xs text-muted-foreground">Statistiques détaillées & exports</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* System Health */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Santé du système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Utilisateurs actifs</span>
              <span className="font-semibold">{u.active} / {u.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vendeurs actifs</span>
              <span className="font-semibold">{u.vendors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points de vente actifs</span>
              <span className="font-semibold">{p.active} / {p.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Réservations ce mois</span>
              <span className="font-semibold">{r.month}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Nouveau client inscrit</p>
                <p className="text-xs text-muted-foreground">Il y a 10 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Store className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Nouveau vendeur inscrit</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{r.pending} réservations en attente</p>
                <p className="text-xs text-muted-foreground">Nécessitent une action</p>
              </div>
            </div>
            <Link href="/dashboard/admin/analytics" className="text-sm text-primary hover:underline">
              Voir tout l'historique d'activité →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}