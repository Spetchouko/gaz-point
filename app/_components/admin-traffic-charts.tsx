"use client"

import { useState, useMemo } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts"
import {
  Activity,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Users,
  List,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TrafficDay = {
  date: string
  visits: number
  signups: number
  signins: number
  userAgent?: string | null
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

type EvolutionDay = {
  date: string
  users: number
  vendors: number
}

type DeviceBreakdown = {
  label: string
  count: number
  color: string
}

type SourceBreakdown = {
  label: string
  count: number
  color: string
}

const PERIODS = [
  { key: "7", label: "7 jours" },
  { key: "30", label: "30 jours" },
  { key: "90", label: "90 jours" },
] as const

export function AdminTrafficCharts({
  trafficData,
  evolutionData,
}: {
  trafficData: TrafficDay[]
  evolutionData: EvolutionDay[]
}) {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30")
  const [view, setView] = useState<"devices" | "sources">("sources")

  const days = period === "7" ? 7 : period === "30" ? 30 : 90
  const trafficSlice = trafficData.slice(-days)

  // Répartition par appareil : calculée à partir des user-agents, dérivée
  // directement des données (pas d'état intermédiaire ni d'effet).
  const deviceData: DeviceBreakdown[] = useMemo(() => {
    const uaRows = trafficData.filter((d) => d.userAgent).slice(-days)

    let mobileCount = 0
    let desktopCount = 0
    let tabletCount = 0

    for (const row of uaRows) {
      const lowerUa = (row.userAgent ?? "").toLowerCase()
      const isMobile = /mobi|android|iphone|ipad|palmid|windows phone|iemobile/.test(lowerUa)
      const isTablet = /ipad|tablet|sandbox/.test(lowerUa) && !isMobile

      if (isMobile) mobileCount++
      else if (isTablet) tabletCount++
      else desktopCount++
    }

    return [
      { label: "Mobile", count: mobileCount, color: "hsl(142 70% 50%)" },
      { label: "Desktop", count: desktopCount, color: "hsl(217 91% 60%)" },
      { label: "Tablette", count: tabletCount, color: "hsl(268 82% 56%)" },
    ]
  }, [days, trafficData])

  // Classification des sources, elle aussi dérivée des données.
  const sourceData: SourceBreakdown[] = useMemo(() => {
    const SEARCH_HOSTS = [
      "google.", "bing.", "yahoo.", "duckduckgo.", "qwant.", "ecosia.",
      "yandex.", "baidu.", "startpage.", "search.brave.",
    ]

    const SOCIAL_HOSTS = [
      "facebook.", "fb.", "instagram.", "twitter.", "x.com", "t.co",
      "linkedin.", "youtube.", "youtu.be", "tiktok.", "snapchat.",
      "whatsapp.", "wa.me", "telegram.", "t.me", "pinterest.", "reddit.", "threads.",
    ]

    const CAMPAIGN_MEDIUMS = [
      "cpc", "ppc", "paid", "paidsearch", "display", "banner", "cpm", "ads", "ad", "sponsored", "email",
    ]

    const referrerHost = (referrer: string | null | undefined): string | null => {
      if (!referrer) return null
      try {
        const url = new URL(referrer)
        return url.hostname.toLowerCase() || null
      } catch {
        return null
      }
    }

    const matchesHost = (host: string, patterns: string[]): boolean => {
      return patterns.some((pattern) => host.includes(pattern))
    }

    const classifySource = (input: {
      referrer?: string | null
      utmSource?: string | null
      utmMedium?: string | null
      utmCampaign?: string | null
    }): "direct" | "search" | "social" | "referral" | "campaign" => {
      const medium = (input.utmMedium ?? "").toLowerCase().trim()
      const source = (input.utmSource ?? "").toLowerCase().trim()
      const campaign = (input.utmCampaign ?? "").toLowerCase().trim()

      if (source || campaign || CAMPAIGN_MEDIUMS.includes(medium)) return "campaign"

      const host = referrerHost(input.referrer)
      if (!host) return "direct"
      if (matchesHost(host, SEARCH_HOSTS)) return "search"
      if (matchesHost(host, SOCIAL_HOSTS)) return "social"
      return "referral"
    }

    const sourceRows = trafficData
      .filter((d) => d.referrer || d.utmSource || d.utmMedium)
      .slice(-days)

    const counts = {
      direct: 0,
      search: 0,
      social: 0,
      referral: 0,
      campaign: 0,
    }

    for (const row of sourceRows) {
      const source = classifySource({
        referrer: row.referrer,
        utmSource: row.utmSource,
        utmMedium: row.utmMedium,
        utmCampaign: row.utmCampaign,
      })
      counts[source]++
    }

    return [
      { label: "Accès direct", count: counts.direct, color: "hsl(39 91% 63%)" },
      { label: "Moteurs de recherche", count: counts.search, color: "hsl(184 56% 50%)" },
      { label: "Réseaux sociaux", count: counts.social, color: "hsl(220 95% 55%)" },
      { label: "Sites référents", count: counts.referral, color: "hsl(270 62% 54%)" },
      { label: "Campagnes", count: counts.campaign, color: "hsl(224 71% 45%)" },
    ]
  }, [days, trafficData])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  period === p.key ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border">
            <button
              type="button"
              onClick={() => setView("sources")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                view === "sources" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
            >
              Sources
            </button>
            <button
              type="button"
              onClick={() => setView("devices")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                view === "devices" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
            >
              Appareils
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {days} derniers jours
        </p>
      </div>

      <div className="grid gap-6">
        {/* Trafic principal - toujours affiché */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Trafic & conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trafficSlice} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Visites"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Bar dataKey="signups" name="Inscriptions" fill="hsl(158 64% 52%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="signins" name="Connexions" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vue par appareil ou source selon le sélecteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {view === "devices"
                ? <SmartphoneLaptopTablet className="size-5 text-primary" />
                : <Globe className="size-5 text-success" />
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {view === "devices" && (
                  <PieChart data={deviceData}>
                    <Pie
                      dataKey="count"
                      cx="50%"
                      cy="50%"
                      r="40"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {deviceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
                {view === "sources" && (
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Bar dataKey="count" name="Visiteurs" fill="#8884d8" />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Graphique évolutif utilisateurs / vendeurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              Évolution utilisateurs / vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Utilisateurs"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="vendors"
                    name="Vendeurs"
                    stroke="hsl(158 64% 52%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Legend and filter controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="size-5" />
              Filtres et légendes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>Période :</strong> {period === "7" ? "7 derniers jours" : period === "30" ? "30 derniers jours" : "90 derniers jours"}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Vue :</strong> {view === "devices" ? "Répartition appareils" : "Sources de trafic"}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Interactions :</strong> Cliquer sur les légendes pour afficher/masquer une série de données. Passer la souris sur les barres/pieces pour voir les valeurs précises.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Composant auxiliaire pour l'icône device
function SmartphoneLaptopTablet({ className }: { className?: string }) {
  return (
    <g className={className}>
      <Smartphone className="size-3 mr-1" />
      <Laptop className="size-3 mr-1" />
      <Tablet className="size-3" />
    </g>
  )
}