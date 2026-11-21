"use client"

import { useState } from "react"
import { AlertCircle, Clock3, CreditCard, Loader2, Shield } from "lucide-react"
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
import type { ClientReservationResult } from "@/lib/client-reservation"

export type ReservationResult = ClientReservationResult

type PointData = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brand: string | null
  format: string | null
  disponibiliteId: string
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
  const [pending, setPending] = useState<ReservationResult | null>(null)

  const handleConfirm = async () => {
    if (!point) return

    setLoading(true)
    setError(null)

    try {
      const result = await onConfirm(point.disponibiliteId)
      if (!result) {
        setError("La réservation n’a pas pu être créée.")
        return
      }
      setPending(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réservation")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPending(null)
    setError(null)
    onClose()
  }

  const handlePayment = () => {
    if (!pending) return
    window.location.assign(pending.checkoutUrl)
  }

  if (!open) return null

  if (pending) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Clock3 className="size-5" />
              En attente de paiement
            </DialogTitle>
            <DialogDescription>
              Votre réservation est enregistrée. Elle sera confirmée après
              validation du paiement par GeniusPay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Code de réservation
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-wider text-foreground">
                {pending.code}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Ce code ne pourra être utilisé qu’après confirmation du paiement.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <p className="text-xs font-semibold text-foreground">Point de vente</p>
                <p className="text-sm">{pending.pointName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Quartier</p>
                <p className="text-sm">{pending.pointDistrict}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Bouteille</p>
                <p className="text-sm">
                  {pending.brand} {pending.format}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Montant</p>
                <p className="text-sm">{formatPrice(pending.amount)}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Plus tard
            </Button>
            <Button className="gap-2" onClick={handlePayment}>
              <CreditCard className="size-4" />
              Payer maintenant
            </Button>
          </DialogFooter>
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
            Le paiement de {formatPrice(RESERVATION_AMOUNT)} sera demandé à
            l’étape suivante.
          </DialogDescription>
        </DialogHeader>

        {point && (
          <div className="space-y-4 py-2">
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

            {(point.hasDelivery || point.hasExchange || point.hasGasSale) && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-muted-foreground">
                  Autres services disponibles au dépôt
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
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
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button
                size="lg"
                onClick={handleConfirm}
                disabled={loading}
                className="flex h-14 flex-1 gap-2 text-lg font-extrabold tracking-tight shadow-xl shadow-primary/20 transition hover:scale-[1.01] hover:shadow-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Préparation…
                  </>
                ) : (
                  "Réserver et payer"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
