"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, User, MapPin, Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { formatPrice, formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type Consignation = {
  id: string
  reservationCode: string
  clientName: string
  clientPhone: string | null
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  status: string
  reservedAt: string
  expiresAt: string | null
  pointName: string
  pointDistrict: string
  isExpired: boolean
  reservedAtFormatted: string
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmée",
  collected: "Retirée",
  cancelled: "Annulée",
  expired: "Expirée",
}

const statusColors: Record<string, string> = {
  confirmed: "bg-info/10 text-info border-info/20",
  collected: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-warning/10 text-warning border-warning/20",
}

export function MesConsignations() {
  const [consignations, setConsignations] = useState<Consignation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConsignations() {
      try {
        const res = await fetch("/api/reservation/vendor")
        if (!res.ok) throw new Error("Impossible de charger les consignations")
        const data = await res.json()
        setConsignations((data.reservations ?? []).map((r: Consignation & { amountType?: string }) => ({
          ...r,
          amountType: r.amountType ?? "reservation",
        })))
      } catch {
        setError("Erreur lors du chargement des consignations")
      } finally {
        setLoading(false)
      }
    }
    fetchConsignations()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement de vos consignations...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          <AlertCircle className="size-6 mx-auto mb-2" />
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (consignations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Shield className="size-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune consignation pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les codes de consignation de vos clients apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Mes consignations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez les codes de consignation générés par vos clients pour vos
          points de livraison.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Mes consignations
          </CardTitle>
          <span className="text-sm text-muted-foreground">{consignations.length} consignation{consignations.length > 1 ? "s" : ""}</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consignations.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg font-bold text-primary tracking-wider">
                        {c.reservationCode}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(statusColors[c.status] || "bg-muted text-muted-foreground")}
                      >
                        <Calendar className="size-3.5" aria-hidden />
                        <span className="ml-1">{statusLabels[c.status] || c.status}</span>
                      </Badge>
                    </div>

                    <p className="mt-1 font-medium text-foreground">{c.clientName}</p>
                    {c.clientPhone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="size-3.5" aria-hidden />
                        {c.clientPhone}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {c.pointName} — {c.pointDistrict}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      {c.brand} {c.format} · {c.quantity} bouteille{c.quantity > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end gap-2 text-right shrink-0">
                    <p className="font-semibold text-foreground">{formatPrice(c.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.amountType === "consigne" ? "Consigne" : "Frais de réservation"}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.reservedAtFormatted}</p>
                    {c.isExpired && c.status === "confirmed" && (
                      <p className="text-xs text-warning font-medium">Expiré</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
