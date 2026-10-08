"use client"

import { useActionState, useEffect, useState } from "react"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { upsertDisponibilite, deleteDisponibilite, type ActionResult } from "@/app/dashboard/pro/actions"
import { availabilityLabel, bottleFormats } from "@/lib/gaz"
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
    format: editingDispo?.dispo.format ?? "",
    status: (editingDispo?.dispo.status as AvailabilityStatus) ?? "disponible",
    phone: editingDispo?.dispo.phone ?? "",
    quantity: editingDispo?.dispo.quantity ?? "",
    directions: editingDispo?.dispo.note ?? "",
  })

  const [step, setStep] = useState<"form" | "confirm" | "deleteConfirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  useEffect(() => {
    if (open && editingDispo) {
      setFormState({
        pointId: editingDispo.pointId,
        format: editingDispo.dispo.format ?? "",
        status: (editingDispo.dispo.status as AvailabilityStatus) ?? "disponible",
        phone: editingDispo.dispo.phone ?? "",
        quantity: editingDispo.dispo.quantity ?? "",
        directions: editingDispo.dispo.note ?? "",
      })
      setStep("form")
      setFeedback(null)
    }
  }, [open, editingDispo])

  const handleSubmit = async (formData: FormData) => {
    const result = await upsertDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      onClose()
    }
    return result
  }

  const handleDelete = async (formData: FormData) => {
    const result = await deleteDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      onClose()
    }
    return result
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
        {formState.directions && (
          <div className="flex justify-between">
            <dt>Indication</dt>
            <dd className="font-medium text-foreground">{formState.directions}</dd>
          </div>
        )}
        {formState.phone && (
          <div className="flex justify-between">
            <dt>Téléphone</dt>
            <dd className="font-medium text-foreground">{formState.phone}</dd>
          </div>
        )}
        <dd className="text-xs">
          La date et l'heure de publication seront enregistrées automatiquement.
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
            <input type="hidden" name="pointId" value={formState.pointId} />
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            <input type="hidden" name="phone" value={formState.phone} />
            <input type="hidden" name="quantity" value={formState.quantity} />
            <input type="hidden" name="directions" value={formState.directions} />
            {isEditing && (
              <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="point-select">Point de vente</Label>
              <Select
                value={formState.pointId}
                onValueChange={(v) => setFormState((s) => ({ ...s, pointId: v }))}
                disabled={isEditing}
              >
                <SelectTrigger id="point-select" className="w-full" disabled={isEditing}>
                  <SelectValue placeholder="Sélectionne un dépôt" />
                </SelectTrigger>
                <SelectContent>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name} — {point.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="format-select">Format</Label>
                <Select
                  value={formState.format}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v }))}
                >
                  <SelectTrigger id="format-select" className="w-full">
                    <SelectValue placeholder="Choisis un format" />
                  </SelectTrigger>
                  <SelectContent>
                    {bottleFormats.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status-select">Statut</Label>
                <Select
                  value={formState.status}
                  onValueChange={(v) => setFormState((s) => ({ ...s, status: v as AvailabilityStatus }))}
                >
                  <SelectTrigger id="status-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {availabilityLabel[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-input">Téléphone (facultatif)</Label>
              <Input
                id="phone-input"
                type="tel"
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Ex: +237 6 99 00 00 00"
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
                value={formState.directions}
                onChange={(e) => setFormState((s) => ({ ...s, directions: e.target.value }))}
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
            <input type="hidden" name="directions" value={formState.directions} />
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