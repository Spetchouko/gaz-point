"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  Eye,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { publiciteSlotShort } from "@/lib/publicite-config"
import { formatPercent, type PubliciteStats } from "@/lib/publicite-analytics"

const CHART_COLORS = {
  impressions: "#1f6fb2",
  clicks: "#b45309",
  conversions: "#17804a",
}

const SOURCE_COLORS = ["#5b6b62", "#1f6fb2", "#174a7e", "#b45309", "#16834a"]

const PERIOD_BUTTONS = [
  { key: "7", label: "7 jours" },
  { key: "30", label: "30 jours" },
] as const

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Eye
  accent: string
}) {
  return (
    <Card className="border transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className={`flex size-7 items-center justify-center rounded-full ${accent}`}>
            <Icon className="size-3.5" />
          </span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export function AdminPubliciteStats({
  periodKey,
  fromInput,
  toInput,
  stats,
}: {
  periodKey: string
  fromInput: string
  toInput: string
  stats: PubliciteStats
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [fromDraft, setFromDraft] = useState(fromInput)
  const [toDraft, setToDraft] = useState(toInput)

  const [customError, setCustomError] = useState<string | null>(null)

  const go = (params: URLSearchParams) => {
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const selectPeriod = (key: string) => {
    const params = new URLSearchParams()
    params.set("period", key)
    go(params)
  }

  const applyCustom = () => {
    if (!fromDraft || !toDraft) {
      setCustomError("Choisissez une date de début et de fin.")
      return
    }
    if (fromDraft > toDraft) {
      setCustomError("La date de début doit précéder la date de fin.")
      return
    }
    setCustomError(null)
    const params = new URLSearchParams()
    params.set("period", "custom")
    params.set("from", fromDraft)
    params.set("to", toDraft)
    go(params)
  }

  const { totals, series, byAd, bySource, byConversion } = stats
  const hasData = totals.impressions > 0 || totals.clicks > 0 || totals.conversions > 0
  const sourceTotal = bySource.reduce((sum, item) => sum + item.clicks, 0)
  const sourceChartData = bySource
    .filter((item) => item.clicks > 0)
    .map((item) => ({ name: item.label, value: item.clicks }))

  return (
    <section aria-labelledby="publicite-stats-heading" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="publicite-stats-heading" className="text-xl font-semibold">
            Statistiques et performances
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Impressions, clics et conversions réellement observés sur la plateforme.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_BUTTONS.map((period) => (
            <Button
              key={period.key}
              type="button"
              size="sm"
              variant={periodKey === period.key ? "default" : "outline"}
              onClick={() => selectPeriod(period.key)}
            >
              {period.label}
            </Button>
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border p-1.5">
            <Input
              type="date"
              value={fromDraft}
              max={toDraft || undefined}
              onChange={(event) => setFromDraft(event.target.value)}
              className="h-8 w-[9.5rem] text-sm"
              aria-label="Date de début"
            />
            <span className="text-sm text-muted-foreground">→</span>
            <Input
              type="date"
              value={toDraft}
              min={fromDraft || undefined}
              onChange={(event) => setToDraft(event.target.value)}
              className="h-8 w-[9.5rem] text-sm"
              aria-label="Date de fin"
            />
            <Button
              type="button"
              size="sm"
              variant={periodKey === "custom" ? "default" : "outline"}
              onClick={applyCustom}
            >
              Appliquer
            </Button>
          </div>
        </div>
      </div>

      {customError && <p className="text-sm text-destructive">{customError}</p>}

      {!hasData && (
        <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Aucun événement publicitaire enregistré sur cette période. Le suivi ne
          démarre qu&apos;après le consentement du visiteur et après une réelle
          interaction avec une bannière.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Impressions"
          value={totals.impressions.toLocaleString("fr-FR")}
          hint="Bannière réellement visible (≥ 50 % / 1 s)"
          icon={Eye}
          accent="bg-info/10 text-info"
        />
        <KpiCard
          label="Clics"
          value={totals.clicks.toLocaleString("fr-FR")}
          hint="Clics externes sur la bannière"
          icon={MousePointerClick}
          accent="bg-warning/10 text-warning"
        />
        <KpiCard
          label="Conversions"
          value={totals.conversions.toLocaleString("fr-FR")}
          hint="Inscription, recherche ou réservation"
          icon={Target}
          accent="bg-success/10 text-success"
        />
        <KpiCard
          label="Taux de clic (CTR)"
          value={formatPercent(totals.ctr)}
          hint="Clics ÷ impressions"
          icon={Percent}
          accent="bg-navy/10 text-navy"
        />
        <KpiCard
          label="Taux de conversion"
          value={formatPercent(totals.conversionRate)}
          hint="Conversions ÷ clics"
          icon={TrendingUp}
          accent="bg-info/10 text-info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution des performances</CardTitle>
            <CardDescription>Impressions, clics et conversions par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe8e2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="impressions"
                    name="Impressions"
                    stroke={CHART_COLORS.impressions}
                    fill={CHART_COLORS.impressions}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    name="Clics"
                    stroke={CHART_COLORS.clicks}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke={CHART_COLORS.conversions}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources de trafic</CardTitle>
            <CardDescription>Origine des visiteurs ayant cliqué ({sourceTotal})</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceChartData.length === 0 ? (
              <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Aucun clic sur la période.
              </p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {sourceChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 space-y-1.5">
              {bySource.map((source, index) => (
                <li key={source.source} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    {source.label}
                  </span>
                  <span className="font-medium tabular-nums">
                    {source.clicks.toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Performances par publicité</CardTitle>
            <CardDescription>Détail de chaque bannière sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm" role="table">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Publicité</th>
                    <th className="px-3 py-2 font-semibold">Emplacement</th>
                    <th className="px-3 py-2 text-right font-semibold">Impressions</th>
                    <th className="px-3 py-2 text-right font-semibold">Clics</th>
                    <th className="px-3 py-2 text-right font-semibold">Conv.</th>
                    <th className="px-3 py-2 text-right font-semibold">CTR</th>
                    <th className="px-3 py-2 text-right font-semibold">Taux conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byAd.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        Aucune publicité.
                      </td>
                    </tr>
                  ) : (
                    byAd.map((ad) => (
                      <tr key={ad.id} className="hover:bg-muted/50">
                        <td className="max-w-[240px] truncate px-3 py-2 font-medium">{ad.title}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="whitespace-nowrap">
                            {publiciteSlotShort(ad.slot)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {ad.impressions.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {ad.clicks.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {ad.conversions.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatPercent(ad.ctr)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatPercent(ad.conversionRate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              Conversions par objectif
            </CardTitle>
            <CardDescription>Attribution au dernier clic, 30 jours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byConversion.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums">
                  {item.count.toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byConversion} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Conversions" fill={CHART_COLORS.conversions} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Une conversion n&apos;est comptée qu&apos;une fois par clic et par
              objectif, dans les 30 jours suivant le clic.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
