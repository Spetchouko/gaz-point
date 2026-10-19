"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, Calendar, MapPin, Phone, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/gaz"

type VerifiedReservation = {
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
  collectedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
  pointName: string
  pointDistrict: string
  pointAddress: string
  isExpired: boolean
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmée",
  collected: "Retirée",
  cancelled: "Annulée",
  expired: "Expirée",
}

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  collected: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
  expired: "bg-amber-500/10 text-amber-600 border-amber-500/30",
}

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <Calendar className="size-3.5" />,
  collected: <CheckCircle className="size-3.5" />,
  cancelled: <XCircle className="size-3.5" />,
  expired: <AlertCircle className="size-3.5" />,
}

export function VerifierReservation() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifiedReservation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collecting, setCollecting] = useState(false)

  const handleVerify = async () => {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode || cleanCode.length !== 12) {
      setError("Le code doit contenir 12 caractères")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/reservation/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Code introuvable ou invalide")
        setLoading(false)
        return
      }

      setResult(data.reservation)
    } catch {
      setError("Erreur lors de la vérification")
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!result) return

    setCollecting(true)
    setError(null)

    try {
      const res = await fetch("/api/reservation/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: result.reservationCode }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de la confirmation")
        setCollecting(false)
        return
      }

      // Update local state
      setResult((prev) => prev ? { ...prev, status: "collected", collectedAt: new Date().toISOString() } : null)
    } catch {
      setError("Erreur lors de la confirmation du retrait")
    } finally {
      setCollecting(false)
    }
  }

  const canCollect = result && result.status === "confirmed" && !result.isExpired

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5" />
          Vérifier une réservation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Saisissez le code de réservation à 12 caractères présenté par le client pour vérifier sa validité.
        </p>

        <div className="flex gap-2">
          <Input
            id="verification-code"
            type="text"
            placeholder="Code à 12 caractères (ex: 261013DEIDO)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={12}
            className="flex-1 font-mono text-lg tracking-wider text-center"
            disabled={loading || collecting}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleVerify()}
          />
          <Button
            onClick={handleVerify}
            disabled={loading || collecting || code.length !== 12}
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Search className="size-4 mr-2" />
                Vérifier
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <XCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xl font-bold text-primary tracking-wider">
                    {result.reservationCode}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(statusColors[result.status] || "bg-muted text-muted-foreground")}
                  >
                    {statusIcons[result.status]}
                    <span className="ml-1">{statusLabels[result.status] || result.status}</span>
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Réservé le {new Date(result.reservedAt).toLocaleString("fr-FR")}
                </p>
                {result.isExpired && (
                  <p className="text-sm text-amber-600 font-medium">
                    Expirée le {result.expiresAt ? new Date(result.expiresAt).toLocaleString("fr-FR") : ""}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard.writeText(result.reservationCode)}
                className="h-8 w-8 shrink-0"
                aria-label="Copier le code"
              >
                <Copy className="size-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-medium">{result.clientName}</p>
                {result.clientPhone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    {result.clientPhone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bouteille</p>
                <p className="font-medium">{result.brand} {result.format}</p>
                <p className="text-xs text-muted-foreground">Quantité : {result.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépôt</p>
                <p className="font-medium">{result.pointName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {result.pointAddress}, {result.pointDistrict}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frais</p>
                <p className="font-semibold text-foreground">{formatPrice(result.amount)}</p>
                <p className="text-xs text-muted-foreground">{result.amountType === "consigne" ? "Consigne" : "Réservation"}</p>
              </div>
            </div>

            {canCollect && (
              <Button
                onClick={handleCollect}
                disabled={collecting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-emerald-50"
              >
                {collecting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Confirmation en cours...
                  </>
                ) : (
                  <>
                    <Check className="size-4 mr-2" />
                    Confirmer le retrait
                  </>
                )}
              </Button>
            )}

            {result.status === "collected" && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-emerald-700 font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="size-4" />
                  Bouteille déjà retirée le{" "}
                  {result.collectedAt ? new Date(result.collectedAt).toLocaleString("fr-FR") : ""}
                </p>
              </div>
            )}

            {result.status === "cancelled" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                <p className="text-red-700 font-medium flex items-center justify-center gap-2">
                  <XCircle className="size-4" />
                  Réservation annulée
                </p>
              </div>
            )}

            {result.status === "expired" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-amber-700 font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="size-4" />
                  Réservation expirée
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}