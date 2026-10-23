"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Calendar, MapPin, Phone, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type Reservation = {
  id: string
  reservationCode: string
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  status: string
  reservedAt: string
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
  pointName: string
  pointDistrict: string
  pointAddress: string
  pointPhone: string | null
  isExpired: boolean
  reservedAtFormatted: string
  collectedAtFormatted: string | null
  cancelledAtFormatted: string | null
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

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <Calendar className="size-3.5" />,
  collected: <CheckCircle className="size-3.5" />,
  cancelled: <XCircle className="size-3.5" />,
  expired: <AlertCircle className="size-3.5" />,
}

export function MesReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await fetch("/api/reservation/my")
        if (!res.ok) throw new Error("Impossible de charger les réservations")
        const data = await res.json()
        setReservations(data.reservations ?? [])
      } catch {
        setError("Erreur lors du chargement des réservations")
      } finally {
        setLoading(false)
      }
    }
    fetchReservations()
  }, [])

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement de vos réservations...</p>
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

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Calendar className="size-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune réservation pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vos réservations apparaîtront ici après confirmation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          Mes réservations
        </CardTitle>
        <span className="text-sm text-muted-foreground">{reservations.length} réservation{reservations.length > 1 ? "s" : ""}</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-lg font-bold text-primary tracking-wider">
                      {res.reservationCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(res.reservationCode)}
                      className="h-8 w-8"
                      aria-label={copiedCode === res.reservationCode ? "Copié !" : "Copier le code"}
                    >
                      {copiedCode === res.reservationCode ? (
                        <CheckCircle className="size-4 text-success" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                    <Badge
                      variant="outline"
                      className={cn(statusColors[res.status] || "bg-muted text-muted-foreground")}
                    >
                      {statusIcons[res.status]}
                      <span className="ml-1">{statusLabels[res.status] || res.status}</span>
                    </Badge>
                  </div>

                  <p className="mt-1 font-medium text-foreground">{res.brand} {res.format}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {res.pointName} — {res.pointAddress}, {res.pointDistrict}
                  </p>
                  {res.pointPhone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {res.pointPhone}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right shrink-0">
                  <p className="font-semibold text-foreground">{formatPrice(res.amount)}</p>
                  <p className="text-xs text-muted-foreground">Frais de réservation</p>
                  <p className="text-xs text-muted-foreground">
                    {res.reservedAtFormatted}
                  </p>
                  {res.isExpired && (
                    <p className="text-xs text-warning font-medium">
                      Expirée le {res.expiresAt ? new Date(res.expiresAt).toLocaleString("fr-FR") : ""}
                    </p>
                  )}
                  {res.collectedAtFormatted && (
                    <p className="text-xs text-success">
                      Retirée le {res.collectedAtFormatted}
                    </p>
                  )}
                  {res.cancelledAtFormatted && (
                    <p className="text-xs text-destructive">
                      Annulée le {res.cancelledAtFormatted}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}