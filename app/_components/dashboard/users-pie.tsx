"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type TooltipContentProps,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#16834a", "#174a7e", "#5b6b62"]

interface UsersPieProps {
  data: Array<{ name: string; count: number }>
}

export function UsersPie({ data }: UsersPieProps) {
  const total = data.reduce((a, d) => a + d.count, 0)
  const hasData = total > 0

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Répartition des utilisateurs</CardTitle>
        </div>
        <CardDescription className="text-xs">Clients, vendeurs, administrateurs</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-6">
        {!hasData ? (
          <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucun utilisateur enregistré.</p>
          </div>
        ) : (
          <>
            <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({
                    active,
                    payload,
                  }: TooltipContentProps) => {
                    const rawEntry: unknown = payload?.[0]?.payload
                    if (
                      !active ||
                      typeof rawEntry !== "object" ||
                      rawEntry === null ||
                      !("name" in rawEntry) ||
                      !("count" in rawEntry)
                    ) {
                      return null
                    }

                    const name = rawEntry.name
                    const count = rawEntry.count
                    if (typeof name !== "string" || typeof count !== "number") {
                      return null
                    }

                    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0"
                    return (
                      <div className="bg-card p-2 border border-border shadow-sm min-w-[110px]">
                        <p className="text-xs font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {count.toLocaleString()} ({pct}%)
                        </p>
                      </div>
                    )
                  }}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              {data.map((entry) => {
                const pct = total > 0 ? ((entry.count / total) * 100).toFixed(1) : "0"
                return (
                  <div key={entry.name} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "inline-block size-2.5 rounded-full",
                        COLORS[data.indexOf(entry) % COLORS.length].startsWith("#16")
                          ? "bg-[#16834a]"
                          : COLORS[data.indexOf(entry) % COLORS.length].startsWith("#17")
                            ? "bg-[#174a7e]"
                            : "bg-[#5b6b62]",
                      )}
                    />
                    <p className="text-xs font-medium text-foreground">{entry.count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{entry.name}</p>
                    <p className="text-[10px] text-muted-foreground">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
