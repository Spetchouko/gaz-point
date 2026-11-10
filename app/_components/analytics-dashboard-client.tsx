"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Download,
  Calendar,
  AlertTriangle,
  Activity,
  Users,
  Store,
  UserCheck,
  UserX,
  Cylinder,
  Search,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  KpiCard,
  TrafficLineChart,
  type TrafficPoint,
  FunnelChart,
  type FunnelStep,
  EvolutionLineChart,
  type EvolutionPoint,
  TopPagesBarChart,
  type PageStat,
  SourcesPieChart,
  type SourceStat,
  DevicesPieChart,
  type DeviceStat,
} from "@/app/_components/analytics-charts"
import { cn } from "@/lib/utils"

type AnalyticsData = {
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
    traffic: TrafficPoint[]
    funnel: FunnelStep[]
    evolution: EvolutionPoint[]
    topPages: PageStat[]
    sources: SourceStat[]
    devices: DeviceStat[]
    search: {
      totalSearches: number
      resultsViewed: number
      topBrands: { name: string; count: number }[]
      topFormats: { name: string; count: number }[]
      searchesWithoutResults: number
    }
    sellers: {
      pointsCreatedPeriod: number
      disposPublishedPeriod: number
      activeSellers: number
      evolution: { date: string; points: number; dispos: number }[]
    }
  }
}

type PeriodKey = "today" | "7" | "30" | "90" | "custom"

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd’hui" },
  { key: "7", label: "7 derniers jours" },
  { key: "30", label: "30 derniers jours" },
  { key: "90", label: "90 derniers jours" },
  { key: "custom", label: "Période personnalisée" },
]

function nf(value: number): string {
  return value.toLocaleString("fr-FR")
}

export function AnalyticsDashboardClient({
  initialPeriod,
  initialFrom,
  initialTo,
}: {
  initialPeriod: PeriodKey
  initialFrom: string
  initialTo: string
}) {
  const [period, setPeriod] = useState<PeriodKey>(initialPeriod)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ period })
      if (period === "custom") {
        params.set("from", from)
        params.set("to", to)
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { Accept: "application/json" },
        // No-cache pour l'actualisation manuelle
        cache: "no-store",
      })
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [period, from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================
  // Export CSV
  // ============================================================

  const handleExportCsv = useCallback(() => {
    if (!data) return

    const rows: Record<string, string>[] = []

    // KPIs
    rows.push({ section: "KPI_ACQUISITION", indicateur: "Visiteurs uniques", valeur: String(data.kpis.acquisition.uniqueVisitors) })
    rows.push({ section: "KPI_ACQUISITION", indicateur: "Sessions", valeur: String(data.kpis.acquisition.totalSessions) })
    rows.push({ section: "KPI_ACQUISITION", indicateur: "Nouveaux visiteurs", valeur: String(data.kpis.acquisition.newVisitors) })
    rows.push({ section: "KPI_ACQUISITION", indicateur: "Visiteurs récurrents", valeur: String(data.kpis.acquisition.returningVisitors) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Inscriptions terminées", valeur: String(data.kpis.conversion.signupsCompleted) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Inscriptions vendeurs", valeur: String(data.kpis.conversion.sellerSignups) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Emails vérifiés", valeur: String(data.kpis.conversion.emailVerified) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Taux visiteur→inscription (%)", valeur: String(data.kpis.conversion.conversionVisitToSignup) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Taux visiteur→client (%)", valeur: String(data.kpis.conversion.conversionVisitToClient) })
    rows.push({ section: "KPI_CONVERSION", indicateur: "Taux visiteur→vendeur (%)", valeur: String(data.kpis.conversion.conversionVisitToSeller) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Total utilisateurs", valeur: String(data.kpis.users.totalUsers) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Total clients", valeur: String(data.kpis.users.totalClients) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Total vendeurs", valeur: String(data.kpis.users.totalVendors) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Comptes vérifiés", valeur: String(data.kpis.users.verifiedUsers) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Comptes non vérifiés", valeur: String(data.kpis.users.unverifiedUsers) })
    rows.push({ section: "KPI_UTILISATEURS", indicateur: "Utilisateurs actifs", valeur: String(data.kpis.users.activeUsers) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Points de vente", valeur: String(data.kpis.business.totalPoints) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Points actifs", valeur: String(data.kpis.business.activePoints) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Disponibilités", valeur: String(data.kpis.business.totalDispos) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Disponibilités actives", valeur: String(data.kpis.business.activeDispos) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Recherches effectuées", valeur: String(data.kpis.business.searchesCount) })
    rows.push({ section: "KPI_COMMERCIAL", indicateur: "Résultats consultés", valeur: String(data.kpis.business.searchResultsViewed) })

    // Pages top
    rows.push({ section: "TOP_PAGES", indicateur: "", valeur: "" })
    for (const p of data.charts.topPages) {
      rows.push({ section: "TOP_PAGES", indicateur: p.name, valeur: `${p.views} vues (${p.uniqueVisitors} uniques)` })
    }

    // Sources
    rows.push({ section: "SOURCES", indicateur: "", valeur: "" })
    for (const s of data.charts.sources) {
      rows.push({ section: "SOURCES", indicateur: s.name, valeur: String(s.count) })
    }

    // Appareils
    rows.push({ section: "APPAREILS", indicateur: "", valeur: "" })
    for (const d of data.charts.devices) {
      rows.push({ section: "APPAREILS", indicateur: d.name, valeur: String(d.count) })
    }

    // Marques recherchées
    rows.push({ section: "MARQUES_RECHERCHEES", indicateur: "", valeur: "" })
    for (const b of data.charts.search.topBrands) {
      rows.push({ section: "MARQUES_RECHERCHEES", indicateur: b.name, valeur: String(b.count) })
    }

    // Formats recherchés
    rows.push({ section: "FORMATS_RECHERCHES", indicateur: "", valeur: "" })
    for (const f of data.charts.search.topFormats) {
      rows.push({ section: "FORMATS_RECHERCHES", indicateur: f.name, valeur: String(f.count) })
    }

    const headers = ["section", "indicateur", "valeur"]
    const csvContent =
      headers.join(",") +
      "\n" +
      rows
        .map((r) =>
          headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `gazpoints-analytics-${period}-${from}-to-${to}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [data, period, from, to])

  // ============================================================
  // États vides / erreur
  // ============================================================

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Erreur de chargement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="size-12 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            onClick={fetchData}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="size-4 mr-2" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const { kpis, charts } = data

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse des données</h1>
          <p className="mt-2 text-muted-foreground">
            Tableau de bord analytique de GazPoints — trafic, acquisition, conversion et activité commerciale.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" /> Actualiser
          </Button>
          <Button onClick={handleExportCsv} size="sm">
            <Download className="size-4 mr-2" /> Export CSV
          </Button>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3.5" /> MàJ {lastUpdated}
            </span>
          )}
        </div>
      </header>

      {/* Filtres de période */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Période :</span>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as PeriodKey)
              }}
              className="h-9 rounded-lg border bg-background px-3 py-1.5 text-sm"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {period === "custom" && (
              <>
                <label className="text-xs text-muted-foreground">Du</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                />
                <span className="text-xs text-muted-foreground mx-1">→</span>
                <label className="text-xs text-muted-foreground">au</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skeleton pendant le chargement */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="h-32 flex items-center justify-center">
                <div className="h-8 w-32 animate-pulse bg-muted/40 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              title="Visiteurs uniques"
              value={nf(kpis.acquisition.uniqueVisitors)}
              subtitle="Acquisition"
              trend={{ value: 0, label: "" }}
              Icon={Users}
              color="bg-info/10 text-info border-info/20"
            />
            <KpiCard
              title="Sessions"
              value={nf(kpis.acquisition.totalSessions)}
              subtitle="Acquisition"
              Icon={Activity}
              color="bg-info/10 text-info border-info/20"
            />
            <KpiCard
              title="Nouveaux visiteurs"
              value={nf(kpis.acquisition.newVisitors)}
              subtitle="Acquisition"
              Icon={UserCheck}
              color="bg-success/10 text-success border-success/20"
            />
            <KpiCard
              title="Visiteurs récurrents"
              value={nf(kpis.acquisition.returningVisitors)}
              subtitle="Acquisition"
              Icon={Users}
              color="bg-muted/10 text-muted-foreground border-border"
            />
            <KpiCard
              title="Inscriptions terminées"
              value={nf(kpis.conversion.signupsCompleted)}
              subtitle="Conversion"
              Icon={UserCheck}
              color="bg-success/10 text-success border-success/20"
            />
            <KpiCard
              title="Inscriptions vendeurs"
              value={nf(kpis.conversion.sellerSignups)}
              subtitle="Conversion"
              Icon={Store}
              color="bg-warning/10 text-warning border-warning/20"
            />
            <KpiCard
              title="Taux visiteur → inscription"
              value={`${kpis.conversion.conversionVisitToSignup.toFixed(1)}%`}
              subtitle="Conversion"
              Icon={TrendingUp}
              color="bg-navy/10 text-navy border-navy/20"
            />
            <KpiCard
              title="Taux visiteur → client"
              value={`${kpis.conversion.conversionVisitToClient.toFixed(1)}%`}
              subtitle="Conversion"
              Icon={UserX}
              color="bg-muted/10 text-muted-foreground border-border"
            />
            <KpiCard
              title="Taux visiteur → vendeur"
              value={`${kpis.conversion.conversionVisitToSeller.toFixed(1)}%`}
              subtitle="Conversion"
              Icon={Store}
              color="bg-warning/10 text-warning border-warning/20"
            />
            <KpiCard
              title="Points de vente"
              value={nf(kpis.business.totalPoints)}
              subtitle="Activité commerciale"
              Icon={Cylinder}
              color="bg-warning/10 text-warning border-warning/20"
            />
            <KpiCard
              title="Recherches effectuées"
              value={nf(kpis.business.searchesCount)}
              subtitle="Activité commerciale"
              Icon={Search}
              color="bg-info/10 text-info border-info/20"
            />
          </div>

          <Separator />

          {/* Ligne 1: Trafic + Entonnoir */}
          <div className="grid gap-4 lg:grid-cols-2">
            <TrafficLineChart data={charts.traffic} />
            <FunnelChart data={charts.funnel} />
          </div>

          {/* Ligne 2: Évolution inscriptions + Pages */}
          <div className="grid gap-4 lg:grid-cols-2">
            <EvolutionLineChart data={charts.evolution} />
            <TopPagesBarChart data={charts.topPages} />
          </div>

          {/* Ligne 3: Sources + Appareils */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SourcesPieChart data={charts.sources} />
            <DevicesPieChart data={charts.devices} />
          </div>

          <Separator />

          {/* Section Recherche */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Recherches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Recherches effectuées</span>
                  <span className="font-bold text-lg">{nf(charts.search.totalSearches)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Résultats consultés</span>
                  <span className="font-bold text-lg">{nf(charts.search.resultsViewed)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Sans résultat</span>
                  <span className="font-bold text-lg">{nf(charts.search.searchesWithoutResults)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Marques recherchées</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {charts.search.topBrands.length > 0 ? (
                    charts.search.topBrands.map((b) => (
                      <li key={b.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{b.name}</span>
                        <span className="font-medium">{nf(b.count)}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée</p>
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Formats recherchés</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {charts.search.topFormats.length > 0 ? (
                    charts.search.topFormats.map((f) => (
                      <li key={f.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{f.name}</span>
                        <span className="font-medium">{nf(f.count)}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée</p>
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Activité vendeurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Vendeurs actifs</span>
                  <span className="font-bold text-lg">{nf(kpis.business.activeSellers)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Points créés (periode)</span>
                  <span className="font-bold text-lg">{nf(charts.sellers.pointsCreatedPeriod)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Disponibilités publiées</span>
                  <span className="font-bold text-lg">{nf(charts.sellers.disposPublishedPeriod)}</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tableau détail pages */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Top pages</h2>
            <Card className="border">
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-3 font-medium">Page</th>
                        <th className="pb-3 font-medium text-right">Vues</th>
                        <th className="pb-3 font-medium text-right">Visiteurs uniques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charts.topPages.length > 0 ? (
                        charts.topPages.map((p) => (
                          <tr key={p.name} className="border-b hover:bg-muted/50">
                            <td className="py-3 truncate max-w-xs">{p.name}</td>
                            <td className="py-3 text-right font-medium">{nf(p.views)}</td>
                            <td className="py-3 text-right">{nf(p.uniqueVisitors)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-muted-foreground">
                            Aucune donnée de page pour cette période.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
