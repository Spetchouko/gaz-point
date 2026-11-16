"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package } from "lucide-react"

const COLOR_POINTS = "#174a7e"

interface PointsChartProps {
  data: Array<{ date: string; count: number }>
}

export function PointsChart({ data }: PointsChartProps) {
  const hasData = data.some((d) => d.count > 0)
  const total = data.reduce((a, d) => a + d.count, 0)

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Évolution des points de vente</CardTitle>
        </div>
        <CardDescription className="text-xs">Dépôts créés</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucun point de vente enregistré sur cette période.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 24, right: 20, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => v.toLocaleString()} hide />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload
                      return (
                        <div className="bg-card p-2 border border-border shadow-sm min-w-[100px]">
                          <p className="text-xs text-muted-foreground">{entry.date}</p>
                          <p className="mt-1 text-sm font-bold">
                            {entry.count.toLocaleString()} point(s)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line type="monotone" dataKey="count" stroke={COLOR_POINTS} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {total.toLocaleString()} points de vente créés sur la période
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
