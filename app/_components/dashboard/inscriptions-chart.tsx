"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

const COLOR_CLIENTS = "#16834a"
const COLOR_VENDORS = "#1f6fb2"

interface InscriptionsChartProps {
  data: Array<{ date: string; clients: number; vendors: number }>
}

export function InscriptionsChart({ data }: InscriptionsChartProps) {
  const hasData = data.some((d) => d.clients > 0 || d.vendors > 0)
  const total = data.reduce((a, d) => a + d.clients + d.vendors, 0)

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Évolution des inscriptions</CardTitle>
        </div>
        <CardDescription className="text-xs">Nouveaux clients et vendeurs</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune inscription enregistrée sur cette période.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 24, right: 26, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => v.toLocaleString()} hide />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload
                      return (
                        <div className="bg-card p-2 border border-border shadow-sm min-w-[120px]">
                          <p className="text-xs text-muted-foreground">{entry.date}</p>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#16834a]" />
                              <span className="font-medium">{entry.clients.toLocaleString()} clients</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#1f6fb2]" />
                              <span className="font-medium">{entry.vendors.toLocaleString()} vendeurs</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Line type="monotone" dataKey="clients" stroke={COLOR_CLIENTS} strokeWidth={2} dot={false} name="Clients" />
                <Line type="monotone" dataKey="vendors" stroke={COLOR_VENDORS} strokeWidth={2} dot={false} name="Vendeurs" />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {total.toLocaleString()} inscriptions sur la période
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
