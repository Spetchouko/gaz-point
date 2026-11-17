"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface District {
  district: string
  count: number
}

interface GeographicChartProps {
  districts: District[]
}

export function GeographicChart({ districts }: GeographicChartProps) {
  const max = Math.max(0, ...districts.map((d) => d.count))
  const hasData = districts.length > 0 && max > 0

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Répartition géographique</CardTitle>
        </div>
        <CardDescription className="text-xs">Points de vente par ville / quartier</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune donnée de localisation disponible.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {districts.map((d) => {
              const width = max > 0 ? (d.count / max) * 100 : 0
              return (
                <div key={d.district} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 shrink-0 truncate">
                    {d.district}
                  </span>
                  <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-10 shrink-0 text-right">
                    {d.count}
                  </span>
                </div>
              )
            })}
            <p className="mt-3 text-xs text-muted-foreground text-center">
              {districts.reduce((a, d) => a + d.count, 0).toLocaleString()} point(s) de vente localisé(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
