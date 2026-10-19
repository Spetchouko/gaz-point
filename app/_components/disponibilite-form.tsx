"use client"

import { useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertDisponibilite, deleteDisponibilite, type ActionResult } from "@/app/dashboard/pro/actions"
import type { AvailabilityStatus } from "@/db/schema"

type PointWithDispos = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  disponibilites: {
    id: string
    format: string | null
    status: string
    phone: string | null
    quantity: number | null
    note: string | null
    createdAt: string | Date
  }[]
}

type EditingDispo = {
  dispo: PointWithDispos["disponibilites"][0]
  pointId: string
  pointName: string
} | null

const STATUSES: AvailabilityStatus[] = ["disponible", "indisponible"]

export function DisponibiliteForm({
  open,
  onClose,
  editingDispo,
  points,
}: {
  open: boolean
  onClose: () => void
  editingDispo: EditingDispo
  points: PointWithDispos[]
}) {
  const isEditing = editingDispo?.dispo.id !== "" && editingDispo?.dispo.id !== undefined

  const [formState, setFormState] = useState({
    pointId: editingDispo?.pointId ?? "",
    pointName: editingDispo?.pointName ?? "",
    format: editingDispo?.dispo.format ?? "",
    status: (editingDispo?.dispo.status as AvailabilityStatus) ?? "disponible",
    phone: editingDispo?.dispo.phone ?? "",
    quantity: editingDispo?.dispo.quantity ?? "",
    note: editingDispo?.dispo.note ?? "",
    brand: editingDispo?.dispo.brand ?? "",
  })

  const [step, setStep] = useState<"form" | "confirm" | "deleteConfirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await upsertDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      onClose()
    }
  }

  const handleDelete = async (formData: FormData) => {
    const result = await deleteDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      onClose()
    }
  }

  if (!open) return null

  const selectedPoint = points.find((p) => p.id === formState.pointId)

  const confirmContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" />
        Confirme la disponibilité avant publication
      </div>
      <dl className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Dépôt</dt>
          <dd className="font-medium text-foreground">{selectedPoint?.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Format</dt>
          <dd className="font-medium text-foreground">{formState.format}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Statut</dt>
          <dd className="font-medium text-foreground">
            {availabilityLabel[formState.status]}
          </dd>
        </div>
        {formState.quantity && (
          <div className="flex justify-between">
            <dt>Quantité</dt>
            <dd className="font-medium text-foreground">{formState.quantity}</dd>
          </div>
        )}
        {formState.note && (
          <div className="flex justify-between">
            <dt>Indication</dt>
            <dd className="font-medium text-foreground">{formState.note}</dd>
          </div>
        )}
        {formState.phone && (
          <div className="flex justify-between">
            <dt>Téléphone</dt>
            <dd className="font-medium text-foreground">{formState.phone}</dd>
          </div>
        )}
        <dd className="text-xs">
          La date et l&apos;heure de publication seront enregistrées automatiquement.
        </dd>
      </dl>
    </div>
  )

  const deleteConfirmContent = (
    <div className="space-y-4 text-center">
      <p className="text-sm text-destructive">
        Voulez-vous vraiment supprimer cette disponibilité ?
      </p>
      <p className="text-sm text-muted-foreground">
        {selectedPoint?.name} — {formState.format}
      </p>
      <p className="text-xs text-muted-foreground">
        Cette action est irréversible.
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "deleteConfirm"
              ? "Supprimer la disponibilité"
              : step === "confirm"
              ? "Vérifier le signalement"
              : isEditing
              ? "Modifier la disponibilité"
              : "Ajouter une disponibilité"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            <input type="hidden" name="phone" value={formState.phone} />
            <input type="hidden" name="quantity" value={formState.quantity} />
            <input type="hidden" name="note" value={formState.note} />
            {isEditing && (
              <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="point-name">Point de vente</Label>
              <Input
                id="point-name"
                type="text"
                value={formState.pointName}
                onChange={(e) => setFormState((s) => ({ ...s, pointName: e.target.value }))}
                placeholder="Saisissez le nom du dépôt"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Vendeur</Label>
              <Input
                id="vendor-name"
                type="text"
                value={formState.brand}
                onChange={(e) => setFormState((s) => ({ ...s, brand: e.target.value }))}
                placeholder="Nom du vendeur ou du dépositaire"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="format-input">Format de bouteille</Label>
              <Input
                id="format-input"
                type="text"
                value={formState.format}
                onChange={(e) => setFormState((s) => ({ ...s, format: e.target.value }))}
                placeholder="Ex: 6 kg, 12,5 kg, 15 kg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-input">Marque de bouteille</Label>
              <Input
                id="brand-input"
                type="text"
                value={formState.brand}
                onChange={(e) => setFormState((s) => ({ ...s, brand: e.target.value }))}
                placeholder="Ex: Total, Payo, Gazex..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity-input">Quantité</Label>
              <Input
                id="quantity-input"
                type="number"
                min="0"
                value={formState.quantity}
                onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                placeholder="Ex: 50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="directions-input">Indication / itinéraire (facultatif)</Label>
              <Textarea
                id="directions-input"
                value={formState.note}
                onChange={(e) => setFormState((s) => ({ ...s, note: e.target.value }))}
                placeholder="Ex: Après Tradex, à côté de la pharmacie..."
                rows={3}
              />
            </div>

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!!feedback?.ok}
              >
                {isEditing ? "Enregistrer les modifications" : "Ajouter la disponibilité"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setStep("deleteConfirm")}
                >
                  <X className="size-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </form>
        )}

        {step === "confirm" && (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="pointId" value={formState.pointId} />
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            <input type="hidden" name="phone" value={formState.phone} />
            <input type="hidden" name="quantity" value={formState.quantity} />
            <input type="hidden" name="note" value={formState.note} />
            {confirmContent}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!!feedback?.ok}>
                Confirmer le signalement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Modifier
              </Button>
            </div>
            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
            )}
          </form>
        )}

        {step === "deleteConfirm" && (
          <form action={handleDelete} className="space-y-4">
            <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            {deleteConfirmContent}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" className="flex-1">
                Supprimer définitivement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Annuler
              </Button>
            </div>
            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
            )}
          </form>
        )}

        {feedback?.ok && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            {feedback.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}