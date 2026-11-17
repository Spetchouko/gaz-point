"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, AlertCircle, ArrowLeft, BarChart3, TrendingUp, Users, Package, Clock, PieChart, Activity, Maximize, Store } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

interface AnalyticsData {
  period: { from: string; to: string }
  generatedAt: string
  kpis: {
    acquisition: {
      uniqueVisitors: number
      totalSessions: number
      newVisitors: number
      returningVisitors: number
    }
    conversion: {
      signupsCompleted: number
      sellerSignups: number
      emailVerified: number
      conversionVisitToSignup: number
      conversionVisitToClient: number
      conversionVisitToSeller: number
    }
    users: {
      totalUsers: number
      totalClients: number
      totalVendors: number
      totalAdmins: number
      verifiedUsers: number
      unverifiedUsers: number
      activeUsers: number
      newUsersPeriod: number
      newVendorsPeriod: number
    }
    business: {
      totalPoints: number
      activePoints: number
      totalDispos: number
      activeDispos: number
      searchesCount: number
      searchResultsViewed: number
      pointsCreatedPeriod: number
      disposPublishedPeriod: number
      activeSellers: number
    }
  }
  charts: {
    traffic: Array<{
      date: string
      uniqueVisitors: number
      sessions: number
      newVisitors: number
      returningVisitors: number
    }>
    funnel: Array<{
      step: string
      label: string
      volume: number
      rate: number
    }>
    evolution: Array<{
      date: string
      clients: number
      vendors: number
      verified: number
    }>
    topPages: Array<{ name: string; views: number; uniqueVisitors: number; avgTime: number }>
    sources: Array<{ name: string; count: number }>
    devices: Array<{ name: string; count: number }>
    search: {
      totalSearches: number
      resultsViewed: number
      topBrands: Array<{ name: string; count: number }>
      topFormats: Array<{ name: string; count: number }>
      searchesWithoutResults: number
    }
    sellers: {
      pointsCreatedPeriod: number
      disposPublishedPeriod: number
      activeSellers: number
      evolution: Array<{
        date: string
        points: number
        dispos: number
      }>
    }
  }
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<string>("30")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadAnalytics() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/analytics?period=${period}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les analytics")
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les analytics")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAnalytics()
    return () => {
      cancelled = true
    }
  }, [period])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  const k = data.kpis

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports et statistiques</h1>
          <p className="text-muted-foreground">
            Analyse de l'activité de la plateforme GazPoints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value ?? "30")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={period + " jours"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 jour</SelectItem>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/dashboard/admin">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" /> Retour
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <AlertCircle className="size-4 mr-2 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Visiteurs uniques
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {k.acquisition.uniqueVisitors.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {k.acquisition.newVisitors} nouveaux • {k.acquisition.returningVisitors} récurrents
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                <Activity className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Inscriptions
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {k.conversion.signupsCompleted.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {k.conversion.emailVerified} emails vérifiés
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-green/10 text-green">
                <Users className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Points de vente
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {k.business.totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {k.business.activePoints} actifs
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <Store className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Taux de conversion
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {k.conversion.conversionVisitToSignup.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Visiteur → Inscription
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                <TrendingUp className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Traffic + Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution du trafic</CardTitle>
            <CardDescription>
              Visiteurs uniques et sessions par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.charts.traffic}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="uniqueVisitors" stroke="#3b82f6" strokeWidth={2} name="Visiteurs uniques" />
                  <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Sessions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Entonnoir de conversion</CardTitle>
            <CardDescription>
              Parcours du visiteur à l'inscription vérifiée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.charts.funnel.map((step, i) => (
                <div key={step.step} className="flex items-center gap-4">
                  <div className="w-8 text-right text-xs font-medium text-muted-foreground">
                    {step.volume.toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{step.label}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {step.rate.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full w-full mt-1">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(step.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Evolution + Sources/Devices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Nouveaux inscrits par jour</CardTitle>
            <CardDescription>
              Clients et vendeurs inscrits quotidiennement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.charts.evolution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} name="Clients" />
                  <Line type="monotone" dataKey="vendors" stroke="#10b981" strokeWidth={2} name="Vendeurs" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Sources de trafic</CardTitle>
            <CardDescription>
              Répartition de l'origine des visiteurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={data.charts.sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label
                  >
                    {data.charts.sources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Devices + Top Brands */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Appareils utilisés</CardTitle>
            <CardDescription>
              Répartition mobile / ordinateur / tablette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={data.charts.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label
                  >
                    {data.charts.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Marques et formats recherchés</CardTitle>
            <CardDescription>
              Tendances de recherche des utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Marques populaires
                </h3>
                {data.charts.search.topBrands.slice(0, 6).map((b) => (
                  <div key={b.name} className="flex items-center justify-between py-2 text-sm border-b border-border/50">
                    <span className="text-muted-foreground">{b.name}</span>
                    <span className="font-medium">{b.count}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Formats populaires
                </h3>
                {data.charts.search.topFormats.slice(0, 6).map((f) => (
                  <div key={f.name} className="flex items-center justify-between py-2 text-sm border-b border-border/50">
                    <span className="text-muted-foreground">{f.name}</span>
                    <span className="font-medium">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé business */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Activité commerciale
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Recherches
            </p>
            <p className="text-2xl font-bold text-foreground">
              {k.business.searchesCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Points créés
            </p>
            <p className="text-2xl font-bold text-foreground">
              {k.business.pointsCreatedPeriod.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Disponibilités publiées
            </p>
            <p className="text-2xl font-bold text-foreground">
              {k.business.disposPublishedPeriod.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Vendeurs actifs
            </p>
            <p className="text-2xl font-bold text-foreground">
              {k.business.activeSellers.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
