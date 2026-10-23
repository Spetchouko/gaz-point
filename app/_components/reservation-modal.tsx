"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader2, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/gaz"

export type ReservationResult = {
  code: string
  expiresAt: string
  amount: number
  amountType: "reservation" | "consigne" | "mixed"
  brand: string
  format: string
  quantity: number
}

type PointData = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brand: string | null
  format: string | null
  quantity: number | null
  disponibiliteId: string
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
  onConfirm: (
    amountType: "reservation" | "consigne"
  ) => Promise<ReservationResult | void>
}) {
  const [amountType, setAmountType] = useState<"reservation" | "consigne">("reservation")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ReservationResult | null>(null)

  const handleConfirm = async () => {
    if (!point) return

    setLoading(true)
    setError(null)

    try {
      const result = await onConfirm(amountType)
      if (result) {
        setSuccess(result)
      } else {
        setError("La réservation n'a pas pu être confirmée.")
      }
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
            <div className="rounded-lg bg-success/5 border border-success/20 p-4">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-success">
                Code de retrait
              </p>
              <p className="mt-1 text-center font-mono text-lg font-bold tracking-wider text-success">
                {success.code}
              </p>
              <p className="mt-1 text-center text-sm text-success">
                À présenter au vendeur pour le retrait
              </p>
              <p className="mt-2 text-center text-xs text-success-foreground0">
                Expire le{" "}
                {new Date(success.expiresAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {success.brand} {success.format} · {success.quantity} bouteille
              {success.quantity > 1 ? "s" : ""} · {formatPrice(success.amount)}{" "}
              {success.amountType === "consigne" ? "de consigne" : "de frais de réservation"}
            </p>
            <Button onClick={handleClose} className="w-full" variant="default">
              Fermer
            </Button>
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
            Choisissez le type de frais pour réserver votre bouteille chez{" "}
            <strong>{point?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {point && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium">
                {point.brand ?? "—"} {point.format ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {point.address}, {point.district}
              </p>
              <p className="text-sm text-muted-foreground">
                Stock :{" "}
                {point.quantity !== null
                  ? `${point.quantity} bouteille${point.quantity > 1 ? "s" : ""}`
                  : "—"}
              </p>
            </div>

            <RadioGroup
              value={amountType}
              onValueChange={(value) => setAmountType(value as "reservation" | "consigne")}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="reservation" id="reservation" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="reservation" className="font-medium cursor-pointer">
                    Frais de réservation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vous payez {formatPrice(RESERVATION_AMOUNT)} pour bloquer la bouteille.
                    Le prix du gaz se paiera au dépôt.
                  </p>
                </div>
                <span className="font-semibold text-primary">
                  {formatPrice(RESERVATION_AMOUNT)}
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="consigne" id="consigne" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="consigne" className="font-medium cursor-pointer">
                    Consigne de bouteille
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vous versez {formatPrice(RESERVATION_AMOUNT)} de consigne (remboursable au
                    retour de la bouteille vide). Le prix du gaz se paiera au dépôt.
                  </p>
                </div>
                <span className="font-semibold text-success">
                  {formatPrice(RESERVATION_AMOUNT)}
                </span>
              </div>
            </RadioGroup>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                Important
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                <li>
                  Ce montant ne couvre <strong>pas</strong> le prix du gaz
                </li>
                <li>Le prix du gaz se règle directement au dépôt</li>
                <li>La réservation expire dans 30 minutes</li>
                <li>Annulation possible avant retrait (libération du stock)</li>
              </ul>
            </div>

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
              <Button onClick={handleConfirm} disabled={loading} className="flex-1 gap-2">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    Réserver pour {formatPrice(RESERVATION_AMOUNT)}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
