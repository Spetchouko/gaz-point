"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatPrice } from "@/lib/gaz"
import { QRCodeDisplay } from "@/app/_components/qr-code-display"

export type ReservationResult = {
  code: string
  expiresAt: string
  amount: number
  brand: string
  format: string
  quantity: number
  pointName: string
  pointDistrict: string
  reservedAt: string
  qrCode?: string
}

type PointData = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brand: string | null
  format: string | null
  disponibiliteId: string
  // Services
  hasDelivery: boolean
  hasExchange: boolean
  hasGasSale: boolean
}

const RESERVATION_AMOUNT = 1000 // FCFA

export function ReservationModal({
  open,
  onClose,
  point,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  point: PointData | null
  onConfirm: (disponibiliteId: string) => Promise<ReservationResult | void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ReservationResult | null>(null)

  const handleConfirm = async () => {
    if (!point) return

    setLoading(true)
    setError(null)

    try {
      const result = await onConfirm(point.disponibiliteId)
      if (!result) {
        setError("La réservation n'a pas pu être confirmée.")
        return
      }
      setSuccess(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réservation")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(null)
    setError(null)
    onClose()
  }

  if (!open) return null

  if (success) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="size-5" />
              Réservation confirmée
            </DialogTitle>
            <DialogDescription>
              Votre réservation a été enregistrée avec succès.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {success.qrCode && (
              <QRCodeDisplay qrCodeDataUrl={success.qrCode} reservationCode={success.code} />
            )}
            <div className="rounded-lg bg-success/5 border border-success/20 p-4">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-success">
                Code de réservation
              </p>
              <p className="mt-1 text-center font-mono text-lg font-bold tracking-wider text-success">
                {success.code}
              </p>
              <p className="mt-1 text-center text-sm text-success">
                À présenter au vendeur pour le retrait
              </p>
              <p className="mt-2 text-center text-xs text-success">
                Expire le{" "}
                {new Date(success.expiresAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <p className="text-xs font-semibold text-foreground">Point de vente</p>
                <p className="text-sm">{success.pointName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Quartier</p>
                <p className="text-sm">{success.pointDistrict}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Bouteille</p>
                <p className="text-sm">
                  {success.brand} {success.format}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Date</p>
                <p className="text-sm">
                  {new Date(success.reservedAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Confirmer la réservation
          </DialogTitle>
          <DialogDescription>
            Vous allez réserver une bouteille de gaz au dépôt {point?.name}.
          </DialogDescription>
        </DialogHeader>

        {point && (
          <div className="space-y-4 py-2">
            {/* Récapitulatif automatique de la disponibilité */}
            <div className="rounded-lg border bg-primary/5 p-4">
              <p className="font-medium text-primary">
                {point.brand ?? "—"} {point.format ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {point.address}, {point.district}
              </p>
              {point.phone && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Téléphone du vendeur: {point.phone}
                </p>
              )}
            </div>

            {/* Autres services disponibles au dépôt */}
            {point.hasDelivery || point.hasExchange || point.hasGasSale && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-muted-foreground">Autres services disponibles au dépôt</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                  {point.hasDelivery && (
                    <li>
                      <span className="font-medium">Livraison</span> à domicile
                    </li>
                  )}
                  {point.hasExchange && (
                    <li>
                      <span className="font-medium">Échange de bouteille</span>
                    </li>
                  )}
                  {point.hasGasSale && (
                    <li>
                      <span className="font-medium">Vente de bouteille de gaz</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button size="lg" onClick={handleConfirm} disabled={loading} className="flex-1 gap-2 h-14 text-lg font-extrabold tracking-tight shadow-xl shadow-primary/20 transition hover:shadow-2xl hover:scale-[1.01]">
                Réserver
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}