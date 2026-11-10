"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = {
  primary: "#16834a",
  secondary: "hsl(217 91% 60%)",
  warning: "hsl(35 90% 55%)",
  destructive: "hsl(0 84% 60%)",
  success: "#16834a",
  info: "hsl(217 91% 60%)",
}

const RADIUS = [0, 0, 8, 8]

// ============================================================
// KPI Card
// ============================================================

export type KpiCardProps = {
  title: string
  value: number | string
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  Icon: IconComponent,
  color = "bg-muted/10 text-muted-foreground border-border",
}: KpiCardProps) {
  return (
    <Card className="border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {trend && (
          <Badge variant={trend.value >= 0 ? "success" : "destructive"} className="text-xs">
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Line Chart (Trafic)
// ============================================================

export type TrafficPoint = {
  date: string
  uniqueVisitors: number
  sessions: number
}

export function TrafficLineChart({ data }: { data: TrafficPoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        Visiteurs: d.uniqueVisitors,
        Sessions: d.sessions,
      })),
    [data]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Trafic du site</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Visiteurs" stroke={COLORS.primary} strokeWidth={2} />
              <Line type="monotone" dataKey="Sessions" stroke={COLORS.secondary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Funnel Chart (Conversion)
// ============================================================

export type FunnelStep = {
  step: string
  label: string
  volume: number
  rate: number
}

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Entonnoir de conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((step, i) => (
            <div key={step.step} className="flex items-center gap-4">
              <div className="w-12 text-center text-xs text-muted-foreground">
                {i + 1}.
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-xs font-bold">{step.volume.toLocaleString("fr-FR")}</span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(step.rate, 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">0%</span>
                  <span className="text-xs text-muted-foreground">{step.rate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Multi Line Chart (Évolution inscriptions)
// ============================================================

export type EvolutionPoint = {
  date: string
  clients: number
  vendors: number
  verified: number
}

export function EvolutionLineChart({ data }: { data: EvolutionPoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        Clients: d.clients,
        Vendeurs: d.vendors,
        Vérifiés: d.verified,
      })),
    [data]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Évolution des inscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Clients" stroke={COLORS.primary} strokeWidth={2} />
              <Line type="monotone" dataKey="Vendeurs" stroke={COLORS.secondary} strokeWidth={2} />
              <Line type="monotone" dataKey="Vérifiés" stroke={COLORS.warning} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Bar Chart (Pages les plus visitées)
// ============================================================

export type PageStat = {
  name: string
  views: number
  uniqueVisitors: number
}

export function TopPagesBarChart({ data }: { data: PageStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Pages les plus visitées</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill={COLORS.primary} radius={RADIUS} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Donut Chart (Sources de trafic)
// ============================================================

export type SourceStat = {
  name: string
  count: number
}

export function SourcesPieChart({ data }: { data: SourceStat[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Sources de trafic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  fill="#8884d8"
                  labelLine={false}
                  label={({ name, percent }: any) => (
                    <text>{name}</text>
                  )}
                >
                  {data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length] as string} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ml-4 space-y-2">
            {data.map((d) => {
              const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : "0"
              const color = COLORS[data.indexOf(d) % COLORS.length]
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm">{d.name}</span>
                  <span className="text-sm font-medium">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Donut Chart (Appareils)
// ============================================================

export type DeviceStat = {
  name: string
  count: number
}

export function DevicesPieChart({ data }: { data: DeviceStat[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Appareils utilisés</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" cx="50%" cy="50%" innerRadius={80} outerRadius={100}>
                  {data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length] as string} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.map((d) => {
              const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : "0"
              const color = COLORS[data.indexOf(d) % COLORS.length]
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm">{d.name}</span>
                  <span className="text-sm font-medium">{d.count.toLocaleString("fr-FR")} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
