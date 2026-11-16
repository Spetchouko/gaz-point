"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock } from "lucide-react"

const COLOR_PUBLISHED = "#16834a"
const COLOR_EXPIRED = "#b42318"

interface DisponibilitesChartProps {
  data: Array<{ date: string; published: number; expired: number }>
}

export function DisponibilitesChart({ data }: DisponibilitesChartProps) {
  const hasData = data.some((d) => d.published > 0 || d.expired > 0)
  const totalPublished = data.reduce((a, d) => a + d.published, 0)

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Évolution des disponibilités</CardTitle>
        </div>
        <CardDescription className="text-xs">Publiées vs expirées ou désactivées</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune disponibilité enregistrée sur cette période.</p>
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
                              <span className="font-medium">{entry.published.toLocaleString()} publiée(s)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#b42318]" />
                              <span className="font-medium">{entry.expired.toLocaleString()} expirée(s)</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line type="monotone" dataKey="published" stroke={COLOR_PUBLISHED} strokeWidth={2} dot={false} name="Publiées" />
                <Line type="monotone" dataKey="expired" stroke={COLOR_EXPIRED} strokeWidth={2} dot={false} name="Expirées / désactivées" />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {totalPublished.toLocaleString()} disponibilité(s) publiée(s) sur la période
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
