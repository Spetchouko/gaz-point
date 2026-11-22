"use client"

import { useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Minus,
  Package,
  Plus,
  Shield,
} from "lucide-react"
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
import { normalizeReservationQuantity } from "@/lib/disponibilite-overlay"
import { calculateReservationAmount } from "@/lib/reservation-amount"
import { copyReservationCode } from "@/lib/reservation-clipboard"

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
  maxQuantity?: number | null
}

export function ReservationModal({
  open,
  onClose,
  point,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  point: PointData | null
  onConfirm: (disponibiliteId: string, quantity: number) => Promise<ReservationResult | void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ReservationResult | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [codeCopied, setCodeCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const maxQuantity = normalizeReservationQuantity(1, point?.maxQuantity ?? null)
  const amount = calculateReservationAmount(quantity) ?? 0

  const handleConfirm = async () => {
    if (!point) return
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`Choisissez une quantité entre 1 et ${maxQuantity}.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await onConfirm(point.disponibiliteId, quantity)
      if (!result) {
        setError("La réservation n’a pas pu être créée.")
        return
      }
      setPending(result)
      setCodeCopied(false)
      setCopyError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réservation")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPending(null)
    setError(null)
    setLoading(false)
    setQuantity(1)
    setCodeCopied(false)
    setCopyError(null)
    onClose()
  }

  const handleCopyCode = async () => {
    if (!pending?.code) return
    const copied = await copyReservationCode(pending.code)
    if (copied) {
      setCodeCopied(true)
      setCopyError(null)
    } else {
      setCopyError("La copie n'a pas pu être effectuée. Sélectionnez le code manuellement.")
    }
  }

  if (!open) return null

  if (pending) {
    return (
      <Dialog open onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-5" />
              Réservation enregistrée
            </DialogTitle>
            <DialogDescription>
              Votre réservation a été enregistrée avec succès&nbsp;!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Numéro de réservation
              </p>
              <p className="mt-1 select-all font-mono text-xl font-bold tracking-wider text-foreground">
                {pending.code}
              </p>
              {copyError ? (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {copyError}
                </p>
              ) : codeCopied ? (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-success">
                  <Check className="size-3.5" aria-hidden />
                  Code copié
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-foreground">Point de vente</p>
                <p>{pending.pointName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Bouteille</p>
                <p>{pending.brand} {pending.format}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Quantité</p>
                <p>{pending.quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Montant à régler au dépôt</p>
                <p>{formatPrice(pending.amount)}</p>
              </div>
            </div>

            <p className="rounded-lg bg-success/5 p-3 text-xs leading-relaxed text-muted-foreground">
              Présentez ce numéro au vendeur pour récupérer votre réservation et
              régler directement au dépôt.
            </p>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => void handleCopyCode()} disabled={!pending.code}>
              {codeCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {codeCopied ? "Code copié" : "Copier le code"}
            </Button>
            <Button onClick={handleClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Confirmer la réservation
          </DialogTitle>
          <DialogDescription>
            Vous allez réserver une bouteille de gaz au dépôt {point?.name}.
            Le montant sera réglé directement au dépôt, sans paiement sur la plateforme.
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
                  Téléphone du vendeur : {point.phone}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium text-foreground">Quantité</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={quantity <= 1 || loading}
                  aria-label="Diminuer la quantité"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={quantity >= maxQuantity || loading}
                  aria-label="Augmenter la quantité"
                  onClick={() =>
                    setQuantity((current) => Math.min(maxQuantity, current + 1))
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {(point.hasDelivery || point.hasExchange || point.hasGasSale) && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-muted-foreground">
                  Autres services disponibles au dépôt
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {point.hasDelivery && (
                    <li><span className="font-medium">Livraison</span> à domicile</li>
                  )}
                  {point.hasExchange && (
                    <li><span className="font-medium">Échange de bouteille</span></li>
                  )}
                  {point.hasGasSale && (
                    <li><span className="font-medium">Vente de bouteille de gaz</span></li>
                  )}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sélectionnez ou validez ces services auprès du dépôt. Le prix est
                  discuté ou payé au dépôt.
                </p>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Montant à payer au dépôt</span>
                <span className="font-semibold text-foreground">{formatPrice(amount)}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Le paiement s&apos;effectue directement auprès du vendeur, au dépôt,
                après présentation de votre numéro de réservation généré sur
                GazPoints. Aucun paiement n&apos;est effectué sur la plateforme.
              </p>
            </div>

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
                onClick={() => void handleConfirm()}
                disabled={loading}
                className="flex h-14 flex-1 gap-2 text-lg font-extrabold tracking-tight shadow-xl shadow-primary/20 transition hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Préparation…
                  </>
                ) : (
                  <>
                    <Package className="size-5" />
                    Confirmer la réservation
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
