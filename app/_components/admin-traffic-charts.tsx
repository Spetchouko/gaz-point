"use client"

import { useState } from "react"
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
} from "recharts"
import { Activity, BarChart2, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TrafficDay = {
  date: string
  visits: number
  signups: number
  signins: number
}

type EvolutionDay = {
  date: string
  users: number
  vendors: number
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
  const [city, setCity] = useState<"all" | "douala">("douala")

  const days = period === "7" ? 7 : period === "30" ? 30 : 90
  const trafficSlice = trafficData.slice(-days)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="GazPoints couvre actuellement Douala"
            className="pointer-events-none"
          >
            <MapPin className="size-4 mr-1" />
            Ville : {city === "douala" ? "Douala" : "Toutes"}
          </Button>
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
        </div>
        <p className="text-sm text-muted-foreground">
          {days} derniers jours · vues croisées visites / inscriptions
        </p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="size-5 text-primary" />
              Inscriptions utilisateurs (30 j)
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
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="size-5 text-emerald-600" />
              Inscriptions vendeurs (30 j)
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
      </div>
    </div>
  )
}