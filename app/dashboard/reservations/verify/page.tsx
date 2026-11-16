"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { Search, CheckCircle2, AlertCircle, Clock, Package, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonSpinner } from "@/app/_components/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface VerifiedReservation {
  id: string
  reservationCode: string
  status: string
  isExpired: boolean
  clientName: string
  clientPhone: string | null
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  pointId: string
  reservedAt: string
  expiresAt: string | null
  collectedAt: string | null
  cancelledAt: string | null
}

export default function VerifyCodePage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<VerifiedReservation | null>(null)
  const [collecting, setCollecting] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setReservation(null)

    const trimmed = code.trim().toUpperCase()
    if (!trimmed || trimmed.length !== 10) {
      setError("Le code de réservation doit contenir 10 caractères")
      return
    }

    setVerifying(true)
    try {
      const res = await fetch("/api/reservation/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Code de réservation invalide")
      }

      setReservation({
        id: data.reservation.id,
        reservationCode: data.reservation.reservationCode,
        status: data.reservation.status,
        isExpired: data.reservation.isExpired,
        clientName: data.reservation.clientName ?? "Client",
        clientPhone: data.reservation.clientPhone ?? null,
        brand: data.reservation.brand,
        format: data.reservation.format,
        quantity: data.reservation.quantity,
        amount: data.reservation.amount,
        amountType: data.reservation.amountType,
        pointId: data.reservation.pointId,
        reservedAt: data.reservation.reservedAt,
        expiresAt: data.reservation.expiresAt,
        collectedAt: data.reservation.collectedAt,
        cancelledAt: data.reservation.cancelledAt,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la vérification")
    } finally {
      setVerifying(false)
    }
  }

  const handleCollect = async () => {
    if (!reservation) return
    if (!window.confirm(`Confirmer le retrait définitif pour le code ${reservation.reservationCode} ?`)) return

    setCollecting(true)
    try {
      const res = await fetch("/api/reservation/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: reservation.reservationCode }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Échec du retrait")
      }

      setReservation((prev) => prev ? { ...prev, status: "collected", collectedAt: new Date().toISOString() } : null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors du retrait")
    } finally {
      setCollecting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default"
      case "collected": return "secondary"
      case "cancelled": return "destructive"
      case "expired": return "destructive"
      case "pending": return "outline"
      default: return "outline"
    }
  }

  const canCollect = reservation
    ? reservation.status === "confirmed" && !reservation.isExpired
    : false

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/dashboard/reservations/vendor">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour aux réservations
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Vérifier un code</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saisie du code de réservation</CardTitle>
          <CardDescription>
            Demandez au client de vous présenter son code de réservation (10 caractères, format GP…).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Code de réservation</label>
              <Input
                type="text"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="GP131126TO"
                className="text-uppercase tracking-widest"
              />
            </div>
            <Button type="submit" disabled={verifying || code.length !== 10} className="w-full">
              {verifying ? (
                <span className="flex items-center gap-2">
                  <ButtonSpinner />
                  Vérification…
                </span>
              ) : (
                <span>
                  <Search className="size-4 mr-2" /> Vérifier le code
                </span>
              )}
            </Button>
          </form>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {reservation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Détails de la réservation</CardTitle>
              <Badge variant={getStatusVariant(reservation.status)} className="text-xs">
                {reservation.status === "confirmed" ? "Confirmée" :
                 reservation.status === "collected" ? "Récupérée" :
                 reservation.status === "cancelled" ? "Annulée" :
                 reservation.status === "expired" ? "Expirée" : "En attente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code de réservation</p>
                <p className="font-mono font-bold text-foreground">{reservation.reservationCode}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</p>
                <p className="text-foreground">{reservation.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</p>
                <p className="text-foreground">{reservation.clientPhone ?? "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bouteille</p>
                <p className="text-foreground">{reservation.brand} {reservation.format}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité</p>
                <p className="text-foreground">{reservation.quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</p>
                <p className="text-foreground">{reservation.amount} FCFA</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Réservée le</p>
                <p className="text-foreground">{formatDate(reservation.reservedAt)}</p>
              </div>
              {reservation.expiresAt && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expire le</p>
                  <p className={cn("text-foreground", reservation.isExpired && "text-red-600")}>
                    {formatDate(reservation.expiresAt)} {reservation.isExpired && "(expirée)"}
                  </p>
                </div>
              )}
            </div>

            {reservation.collectedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  <CheckCircle2 className="size-4 mr-2" /> Retrait déjà effectué
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Cette réservation a déjà été retirée le {formatDate(reservation.collectedAt)}.
                </p>
              </div>
            )}
            {reservation.cancelledAt && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  <AlertCircle className="size-4 mr-2" /> Réservation annulée
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Cette réservation a été annulée le {formatDate(reservation.cancelledAt)}.
                </p>
              </div>
            )}
            {reservation.isExpired && reservation.status === "confirmed" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium">
                  <Clock className="size-4 mr-2" /> Réservation expirée
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Le délai de retrait est dépassé. Cette réservation ne peut plus être honorée.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {canCollect && (
              <Button
                onClick={handleCollect}
                disabled={collecting}
                className="w-full"
              >
                {collecting ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner />
                    Confirmation…
                  </span>
                ) : (
                  <span>
                    <CheckCircle2 className="size-4 mr-2" /> Confirmer le retrait
                  </span>
                )}
              </Button>
            )}
            {!canCollect && reservation.status === "confirmed" && reservation.isExpired && (
              <Button variant="outline" disabled className="w-full">
                Code expiré - retrait impossible
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}