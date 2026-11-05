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
  PieChart as RechartsPieChart,
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

type DeviceBreakdown = { label: string; count: number; color: string }
type SourceBreakdown = { label: string; count: number; color: string }

const PERIODS = [
  { key: "7", label: "7 jours" },
  { key: "30", label: "30 jours" },
  { key: "90", label: "90 jours" },
] as const

// ------------------------------------------------------------------
// Chart pieces re-exported from admin-statistiques-charts-v2 / .
// ------------------------------------------------------------------

type DeviceData = { name: string; count: number; color: string }
type SourceData = { name: string; count: number }
type TrafficData = { date: string; visits: number; signups: number; signins: number }
type EvolutionData = { date: string; users: number; vendors: number }
type PageData = { name: string; count: number }
type OSData = { name: string; count: number; color: string }
type BrowserData = { name: string; count: number; color: string }
type ResolutionData = { name: string; count: number; color: string }
type EntryExitData = { name: string; entries: number; exits: number }

const CHART_COLORS = {
  mobile: "hsl(142 70% 50%)",
  desktop: "hsl(217 91% 60%)",
  tablet: "hsl(268 82% 56%)",
  visits: "#16834a",
  signups: "hsl(158 64% 52%)",
  signins: "hsl(217 91% 60%)",
  entries: "hsl(158 64% 52%)",
  exits: "hsl(0 84% 60%)",
}

export function DevicePieChart({ data }: { data: DeviceData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>Répartition appareils
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart data={data}>
              <Pie
                dataKey="count"
                cx="50%"
                cy="50%"
                r="40"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function SourceBarChart({ data }: { data: SourceData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>Sources de trafic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="name" stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Bar dataKey="count" fill="#16834a" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function TrafficComposedChart({ data }: { data: TrafficData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>Évolution dans le temps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5b6b62" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe8e2", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="visits" name="Visites" stroke={CHART_COLORS.visits} fill={CHART_COLORS.visits} fillOpacity={0.15} strokeWidth={2} />
              <Bar dataKey="signups" name="Inscriptions" fill={CHART_COLORS.signups} radius={[3, 3, 0, 0]} />
              <Bar dataKey="signins" name="Connexions" fill={CHART_COLORS.signins} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function PageBarChart({ data }: { data: PageData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>Pages les plus consultées
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="name" stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Bar dataKey="count" fill="#16834a" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function EvolutionChart({ data }: { data: EvolutionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>Évolution utilisateurs / vendeurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe8e2", borderRadius: 8 }} />
              <Area type="monotone" dataKey="users" name="Utilisateurs" stroke={CHART_COLORS.visits} fill={CHART_COLORS.visits} fillOpacity={0.15} strokeWidth={2} />
              <Line type="monotone" dataKey="vendors" name="Vendeurs" stroke={CHART_COLORS.signups} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function OSPieChart({ data }: { data: OSData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>Systèmes d'exploitation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart data={data}>
              <Pie dataKey="count" cx="50%" cy="50%" r="40" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function BrowserBarChart({ data }: { data: BrowserData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>Navigateurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="name" stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Bar dataKey="count" fill="#16834a" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResolutionBarChart({ data }: { data: ResolutionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>Résolutions d'écran
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="name" stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Bar dataKey="count" fill="#16834a" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function EntryExitChart({ data }: { data: EntryExitData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>Pages d'entrée / sortie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
              <XAxis dataKey="name" stroke="#5b6b62" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
              <Bar dataKey="entries" name="Entrées" fill={CHART_COLORS.entries} />
              <Bar dataKey="exits" name="Sorties" fill={CHART_COLORS.exits} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------------
// AdminTrafficCharts — moved from admin-traffic-charts.tsx
// ------------------------------------------------------------------

function SmartphoneLaptopTablet({ className }: { className?: string }) {
  return (
    <g className={className}>
      <Smartphone className="size-3 mr-1" />
      <Laptop className="size-3 mr-1" />
      <Tablet className="size-3" />
    </g>
  )
}

export function AdminTrafficCharts({ trafficData, evolutionData }: {
  trafficData: TrafficDay[]
  evolutionData: EvolutionDay[]
}) {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30")
  const [view, setView] = useState<"devices" | "sources">("sources")

  const days = period === "7" ? 7 : period === "30" ? 30 : 90
  const trafficSlice = trafficData.slice(-days)

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

  const sourceData: SourceBreakdown[] = useMemo(() => {
    const SEARCH_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo.", "qwant.", "ecosia.", "yandex.", "baidu.", "startpage.", "search.brave."]
    const SOCIAL_HOSTS = ["facebook.", "fb.", "instagram.", "twitter.", "x.com", "t.co", "linkedin.", "youtube.", "youtu.be", "tiktok.", "snapchat.", "whatsapp.", "wa.me", "telegram.", "t.me", "pinterest.", "reddit.", "threads."]
    const CAMPAIGN_MEDIUMS = ["cpc", "ppc", "paid", "paidsearch", "display", "banner", "cpm", "ads", "ad", "sponsored", "email"]
    const referrerHost = (referrer: string | null | undefined): string | null => {
      if (!referrer) return null
      try { const url = new URL(referrer); return url.hostname.toLowerCase() || null } catch { return null }
    }
    const matchesHost = (host: string, patterns: string[]): boolean => patterns.some((pattern) => host.includes(pattern))
    const classifySource = (input: { referrer?: string | null; utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null }): "direct" | "search" | "social" | "referral" | "campaign" => {
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
    const sourceRows = trafficData.filter((d) => d.referrer || d.utmSource || d.utmMedium).slice(-days)
    const counts = { direct: 0, search: 0, social: 0, referral: 0, campaign: 0 }
    for (const row of sourceRows) {
      const source = classifySource({ referrer: row.referrer, utmSource: row.utmSource, utmMedium: row.utmMedium, utmCampaign: row.utmCampaign })
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
              <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", period === p.key ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border">
            <button type="button" onClick={() => setView("sources")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "sources" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>Sources</button>
            <button type="button" onClick={() => setView("devices")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "devices" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>Appareils</button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{days} derniers jours</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" />Trafic & conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trafficSlice} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5b6b62" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe8e2", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="visits" name="Visites" stroke="#16834a" fill="#16834a" fillOpacity={0.15} strokeWidth={2} />
                  <Bar dataKey="signups" name="Inscriptions" fill="hsl(158 64% 52%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="signins" name="Connexions" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{view === "devices" ? <SmartphoneLaptopTablet className="size-5 text-primary" /> : <Globe className="size-5 text-success" />}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {view === "devices" && (
                  <PieChart data={deviceData}>
                    <Pie dataKey="count" cx="50%" cy="50%" r="40" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {deviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                )}
                {view === "sources" && (
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
                    <XAxis dataKey="label" stroke="#5b6b62" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
                    <Bar dataKey="count" name="Visiteurs" fill="#16834a" />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="size-5 text-success" />Évolution utilisateurs / vendeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5b6b62" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#5b6b62" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe8e2", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="users" name="Utilisateurs" stroke="#16834a" fill="#16834a" fillOpacity={0.15} strokeWidth={2} />
                  <Line type="monotone" dataKey="vendors" name="Vendeurs" stroke="hsl(158 64% 52%)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="size-5" />Filtres et légendes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground"><strong>Période :</strong>{period === "7" ? "7 derniers jours" : period === "30" ? "30 derniers jours" : "90 derniers jours"}</p>
              <p className="text-sm text-muted-foreground"><strong>Vue :</strong>{view === "devices" ? "Répartition appareils" : "Sources de trafic"}</p>
              <p className="text-sm text-muted-foreground"><strong>Interactions :</strong>Cliquer sur les légendes pour afficher/masquer une série de données. Passer la souris sur les barres/pieces pour voir les valeurs précises.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}