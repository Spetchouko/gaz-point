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
  link: string
  label: string
  trend?: { value: number; label: string; up: boolean }
}

const statCards: StatCard[] = [
  {
    title: "Clients",
    value: 0,
    icon: Users,
    iconColor: "text-blue-600",
    link: "/dashboard/admin/utilisateurs?role=client",
    label: "Utilisateurs avec le rôle client",
    trend: { value: 0, label: "nouveaux cette période", up: true },
  },
  {
    title: "Vendeurs",
    value: 0,
    icon: Store,
    iconColor: "text-orange-600",
    link: "/dashboard/admin/utilisateurs?role=vendor",
    label: "Comptes vendeurs inscrits",
    trend: { value: 0, label: "nouveaux cette période", up: true },
  },
  {
    title: "Administrateurs",
    value: 0,
    icon: Users,
    iconColor: "text-purple-600",
    link: "/dashboard/admin/utilisateurs?role=admin",
    label: "Comptes administrateurs",
  },
  {
    title: "Collaborateurs",
    value: 0,
    icon: Users,
    iconColor: "text-indigo-600",
    link: "/dashboard/admin/collaborateurs",
    label: "Comptes collaborateurs",
    trend: { value: 0, label: "nouveaux cette période", up: true },
  },
  {
    title: "Points de vente",
    value: 0,
    icon: Package,
    iconColor: "text-green-600",
    link: "/dashboard/admin/points-de-vente",
    label: "actifs",
    trend: { value: 0, label: "créés cette période", up: true },
  },
  {
    title: "Disponibilités",
    value: 0,
    icon: Clock,
    iconColor: "text-purple-600",
    link: "/dashboard/admin/disponibilites",
    label: "disponibles",
    trend: { value: 0, label: "publiées cette période", up: true },
  },
  {
    title: "Réservations",
    value: 0,
    icon: Calendar,
    iconColor: "text-red-600",
    link: "/dashboard/admin/reservations",
    label: "en attente",
  },
  {
    title: "Période",
    value: 0,
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    link: "/dashboard/admin/reservations",
    label: "nouvelles réservations",
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
      value: u.clients,
      trend: { value: u.newUsersPeriod, label: "nouveaux cette période", up: u.newUsersPeriod >= 0 },
    },
    {
      ...statCards[1],
      value: u.vendors,
      trend: { value: u.newVendorsPeriod, label: "nouveaux cette période", up: u.newVendorsPeriod >= 0 },
    },
    {
      ...statCards[2],
      value: u.admins,
    },
    {
      ...statCards[3],
      value: u.collaborateurs,
      trend: { value: u.newCollaborateursPeriod, label: "nouveaux cette période", up: u.newCollaborateursPeriod >= 0 },
    },
    {
      ...statCards[4],
      value: p.total,
      label: `${p.active} actifs`,
      trend: { value: p.createdPeriod, label: "créés cette période", up: p.createdPeriod >= 0 },
    },
    {
      ...statCards[5],
      value: d.total,
      label: `${d.active} disponibles`,
      trend: { value: d.publishedPeriod, label: "publiées cette période", up: d.publishedPeriod >= 0 },
    },
    {
      ...statCards[6],
      value: r.total,
      label: `${r.pending} en attente`,
    },
    {
      ...statCards[7],
      value: r.month,
      label: "nouvelles réservations",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Statistiques et activité de la plateforme GazPoints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Période
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="input input-sm w-full"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input input-sm w-full"
              />
            </div>
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
                  {to ? formatDateFr(to) : "aujourd’hui"}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <Card
            key={stat.title}
            className="shadow-sm border border-border group cursor-pointer"
            onClick={() => {
              if (stat.link) window.location.href = stat.link
            }}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {stat.trend && (
                    <p className="text-xs mt-1">
                      <span className={cn("font-medium", stat.trend.up ? "text-green-600" : "text-muted-foreground")}>
                        {stat.trend.value.toLocaleString()} {stat.trend.label}
                      </span>
                    </p>
                  )}
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

      <Separator />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Réservations par jour</CardTitle>
            <CardDescription>
              Évoltion des réservations sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {stats.charts.reservationsByDay.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">Aucune réservation sur cette période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.reservationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouveaux utilisateurs par jour</CardTitle>
            <CardDescription>
              Inscriptions (clients, vendeurs, collaborateurs) sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {stats.charts.usersByDay.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">Aucune inscription sur cette période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.charts.usersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Inscriptions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {r.pending > 0 && (
        <section className="mt-4">
          <Card className="border border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-600" />
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
        </section>
      )}
    </div>
  )
}
