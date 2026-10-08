"use client"

import { useState } from "react"
import { useActionState } from "react"
import { CheckCircle2, Loader2, X, Package, Store, MapPin, Phone, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDisponibiliteAdmin, updateDisponibiliteAdmin, deleteDisponibiliteAdmin, type ActionResult } from "@/app/admin/actions"
import { bottleFormats } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

type PointOption = {
  id: string
  name: string
  district: string
  vendorName: string
}

type DispoData = {
  id: string
  pointId: string
  status: string
  quantity: number | null
  format: string | null
  phone: string | null
  note: string | null
  pointName: string
} | null

const STATUSES: AvailabilityStatus[] = ["disponible", "a_confirmer", "indisponible"]

export function AdminDisponibiliteForm({
  open,
  onClose,
  editingDispo,
  points,
}: {
  open: boolean
  onClose: () => void
  editingDispo: DispoData
  points: PointOption[]
}) {
  const isEditing = editingDispo !== null

  const [formState, setFormState] = useState({
    pointId: editingDispo?.pointId ?? "",
    status: (editingDispo?.status as AvailabilityStatus) ?? "disponible",
    quantity: editingDispo?.quantity ?? "",
    format: editingDispo?.format ?? "",
    phone: editingDispo?.phone ?? "",
    note: editingDispo?.note ?? "",
  })

  const [step, setStep] = useState<"form" | "confirm" | "deleteConfirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const createAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await createDisponibiliteAdmin(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  const updateAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await updateDisponibiliteAdmin(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  const deleteAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await deleteDisponibiliteAdmin(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  if (!open) return null

  const selectedPoint = points.find((p) => p.id === formState.pointId)

  const confirmContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" />
        Confirmer la disponibilité avant publication
      </div>
      <dl className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Dépôt</dt>
          <dd className="font-medium text-foreground">{selectedPoint?.name} — {selectedPoint?.district}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Vendeur</dt>
          <dd className="font-medium text-foreground">{selectedPoint?.vendorName}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Format</dt>
          <dd className="font-medium text-foreground">{formState.format}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Statut</dt>
          <dd className="font-medium text-foreground">
            {STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })).find((s) => s.value === formState.status)?.label ?? formState.status}
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
        <dd className="text-xs text-muted-foreground">
          Source : Administration · Date de publication automatique
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
              : "Ajouter une disponibilité (Admin)"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form action={isEditing ? updateAction : createAction} className="space-y-4">
            {isEditing && <input type="hidden" name="disponibiliteId" value={editingDispo?.id ?? ""} />}

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
                      {point.name} — {point.district} ({point.vendorName})
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
                  required
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
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity-input">Quantité</Label>
              <Input
                id="quantity-input"
                type="number"
                min="0"
                value={formState.quantity}
                onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                placeholder="Ex: 25"
                required
              />
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
              <Label htmlFor="note-input">Indication / itinéraire (facultatif)</Label>
              <Textarea
                id="note-input"
                value={formState.note}
                onChange={(e) => setFormState((s) => ({ ...s, note: e.target.value }))}
                placeholder="Ex: Après Tradex, à côté de la pharmacie..."
                rows={3}
              />
            </div>

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
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
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </form>
        )}

        {step === "confirm" && (
          <form action={isEditing ? updateAction : createAction} className="space-y-4">
            {isEditing && <input type="hidden" name="disponibiliteId" value={editingDispo?.id ?? ""} />}
            {confirmContent}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!!feedback?.ok}>
                Confirmer le signalement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Modifier
              </Button>
            </div>
            {feedback && !feedback.ok && <p role="alert" className="text-sm text-destructive">{feedback.message}</p>}
          </form>
        )}

        {step === "deleteConfirm" && (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="disponibiliteId" value={editingDispo?.id ?? ""} />
            {deleteConfirmContent}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" className="flex-1">
                Supprimer définitivement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Annuler
              </Button>
            </div>
            {feedback && !feedback.ok && <p role="alert" className="text-sm text-destructive">{feedback.message}</p>}
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