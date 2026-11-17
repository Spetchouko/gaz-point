"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "lucide-react"

const COLOR_RECEIVED = "#16834a"
const COLOR_CONFIRMED = "#1f6fb2"
const COLOR_PENDING = "#b45309"
const COLOR_CANCELLED = "#b42318"

interface ReservationsChartProps {
  data: Array<{
    date: string
    received: number
    confirmed: number
    pending: number
    cancelled: number
  }>
}

export function ReservationsChart({ data }: ReservationsChartProps) {
  const hasData = data.some(
    (d) => d.received > 0 || d.confirmed > 0 || d.pending > 0 || d.cancelled > 0,
  )
  const totalReceived = data.reduce((a, d) => a + d.received, 0)

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          <CardTitle className="text-sm font-semibold leading-none">Activité des réservations</CardTitle>
        </div>
        <CardDescription className="text-xs">Reçues, confirmées, en attente, annulées</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune réservation enregistrée sur cette période.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 24, right: 30, left: 8, bottom: 8 }}>
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
                              <span className="font-medium">{entry.received.toLocaleString()} reçue(s)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#1f6fb2]" />
                              <span className="font-medium">{entry.confirmed.toLocaleString()} confirmée(s)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#b45309]" />
                              <span className="font-medium">{entry.pending.toLocaleString()} en attente</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="block w-2 h-2 rounded-full bg-[#b42318]" />
                              <span className="font-medium">{entry.cancelled.toLocaleString()} annulée(s)</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line type="monotone" dataKey="received" stroke={COLOR_RECEIVED} strokeWidth={2} dot={false} name="Reçues" />
                <Line type="monotone" dataKey="confirmed" stroke={COLOR_CONFIRMED} strokeWidth={2} dot={false} name="Confirmées" />
                <Line type="monotone" dataKey="pending" stroke={COLOR_PENDING} strokeWidth={2} dot={false} name="En attente" />
                <Line type="monotone" dataKey="cancelled" stroke={COLOR_CANCELLED} strokeWidth={2} dot={false} name="Annulées" />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {totalReceived.toLocaleString()} réservation(s) reçue(s) sur la période
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
