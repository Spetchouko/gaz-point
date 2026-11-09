"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2, Camera, Search, Shield } from "lucide-react"
import { formatPrice } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type Reservation = {
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
  statusLabel: string
  qrCode: string | undefined
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmée",
  collected: "Retirée",
  cancelled: "Annulée",
  expired: "Expirée",
  en_attente: "En attente",
  terminee: "Terminée",
}

const statusColors: Record<string, string> = {
  confirmed: "bg-info/10 text-info border-info/20",
  collected: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-warning/10 text-warning border-warning/20",
  en_attente: "bg-warning/10 text-warning border-warning/20",
  terminee: "bg-success/10 text-success border-success/20",
}

export function MesReservationsVendeur() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanCode, setScanCode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    ok: boolean
    reservation?: Reservation
    error?: string
    status?: string
  } | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch("/api/reservation/vendor")
        if (!res.ok) throw new Error("Impossible de charger les réservations")
        const data = await res.json()
        if (mounted) setReservations(data.reservations ?? [])
      } catch {
        if (mounted) setError("Erreur lors du chargement des réservations")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleScan = async () => {
    if (!scanCode.trim() || scanning) return
    const code = scanCode.trim().toUpperCase()

    setScanning(true)
    setScanResult(null)

    try {
      const res = await fetch("/api/reservation/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setScanResult({ ok: true, reservation: data.reservation, status: data.status })
        // Refresh list after successful scan
        const refreshRes = await fetch("/api/reservation/vendor")
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          setReservations(refreshData.reservations ?? [])
        }
      } else {
        setScanResult({ ok: false, error: data.error, status: data.status })
      }
    } catch {
      setScanResult({ ok: false, error: "Erreur lors du scan" })
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = async (reservationId: string) => {
    if (scanning) return
    const res = await fetch("/api/reservation/vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm", reservationId }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      // Refresh list
      const refreshRes = await fetch("/api/reservation/vendor")
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setReservations(refreshData.reservations ?? [])
      }
    }
  }

  const handleCancel = async (reservationId: string) => {
    if (scanning) return
    const res = await fetch("/api/reservation/vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", reservationId }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      // Refresh list
      const refreshRes = await fetch("/api/reservation/vendor")
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setReservations(refreshData.reservations ?? [])
      }
    }
  }

  const handleTerminee = async (reservationId: string) => {
    if (scanning) return
    const res = await fetch("/api/reservation/vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "terminee", reservationId }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      // Refresh list
      const refreshRes = await fetch("/api/reservation/vendor")
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setReservations(refreshData.reservations ?? [])
      }
    }
  }

  const resetScan = () => {
    setScanCode("")
    setScanResult(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des réservations...</p>
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

  return (
    <div className="space-y-6">
      {/* Section Scanner QR Code */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-5" />
            Scanner un code de réservation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="scan-code" className="block text-sm font-medium mb-1">
                  Code de réservation (12 caractères)
                </Label>
                <Input
                  id="scan-code"
                  type="text"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123XYZ789"
                  maxLength={12}
                  className="text-lg font-mono tracking-wider"
                  disabled={scanning}
                />
              </div>
              <Button
                onClick={handleScan}
                disabled={scanning || !scanCode.trim()}
                className="h-11 flex items-center gap-2"
              >
                {scanning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Vérifier
                  </>
                )}
              </Button>
            </div>

            {scanResult && (
              <div
                className={cn(
                  "rounded-lg p-4 border",
                  scanResult.ok ? "bg-success/5 border-success/20 text-success" : "bg-destructive/5 border-destructive/20 text-destructive"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scanResult.ok ? (
                    <CheckCircle className="size-5" />
                  ) : (
                    <AlertCircle className="size-5" />
                  )}
                  <span className="font-medium">
                    {scanResult.ok ? "Réservation valide" : "Erreur"}
                  </span>
                </div>

                {scanResult.reservation && (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Client :</strong> {scanResult.reservation.clientName}
                    </p>
                    <p>
                      <strong>Bouteille :</strong> {scanResult.reservation.brand} {scanResult.reservation.format}
                    </p>
                    <p>
                      <strong>Point :</strong> {scanResult.reservation.pointName}
                    </p>
                    <p>
                      <strong>Statut :</strong> {scanResult.reservation.statusLabel}
                    </p>
                    {scanResult.reservation.clientPhone && (
                      <p>
                        <strong>Tél :</strong> {scanResult.reservation.clientPhone}
                      </p>
                    )}
                  </div>
                )}

                {scanResult.error && (
                  <p className="text-sm font-medium">{scanResult.error}</p>
                )}

                {scanResult.ok && scanResult.status === "confirmed" && (
                  <Button onClick={() => handleConfirm(scanResult.reservation!.id)} className="mt-2 w-full" size="lg">
                    <Shield className="size-4 mr-2" />
                    Confirmer le retrait
                  </Button>
                )}

                {scanResult.ok && scanResult.status === "en_attente" && (
                  <Button onClick={() => handleConfirm(scanResult.reservation!.id)} className="mt-2 w-full" size="lg">
                    <CheckCircle className="size-4 mr-2" />
                    Confirmer
                  </Button>
                )}

                {scanResult.ok && scanResult.status === "terminee" && (
                  <Button variant="ghost" size="sm" onClick={resetScan} className="mt-2">
                    Réservation déjà traitée
                  </Button>
                )}

                {scanResult.ok && scanResult.status === "cancelled" && (
                  <Button variant="ghost" size="sm" onClick={resetScan} className="mt-2">
                    Réservation annulée
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={resetScan} className="mt-2">
                  Scanner un autre code
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Mes réservations
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="py-10 text-center">
              <Shield className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune réservation pour le moment</p>
            </div>
          ) : (
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
                        <Badge
                          variant="outline"
                          className={cn(statusColors[res.status] || "bg-muted text-muted-foreground")}
                        >
                          {res.statusLabel}
                        </Badge>
                      </div>

                      <p className="mt-1 font-medium text-foreground">{res.brand} {res.format}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Client : {res.clientName}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {res.pointName} — {res.pointDistrict}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end gap-2 text-right shrink-0">
                      <p className="font-semibold text-foreground">{formatPrice(res.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {res.amountType === "consigne" ? "Consigne" : "Frais de réservation"}
                      </p>
                      <p className="text-xs text-muted-foreground">{res.reservedAtFormatted}</p>
                      {res.isExpired && (
                        <p className="text-xs text-warning font-medium">Expirée</p>
                      )}
                      {res.status === "confirmed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirm(res.id)}
                          className="mt-1 px-3 py-1 text-sm"
                        >
                          Confirmer
                        </Button>
                      )}
                      {res.status === "en_attente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirm(res.id)}
                          className="mt-1 px-3 py-1 text-sm"
                        >
                          Confirmer
                        </Button>
                      )}
                      {res.status === "cancelled" && (
                        <span className="text-xs text-muted-foreground">Annulée</span>
                      )}
                      {res.status !== "cancelled" && res.status !== "terminee" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(res.id)}
                          className="mt-1 px-3 py-1 text-sm text-destructive"
                        >
                          Annuler
                        </Button>
                      )}
                      {res.status === "confirmed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminee(res.id)}
                          className="mt-1 px-3 py-1 text-sm text-success"
                        >
                          Terminée
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}