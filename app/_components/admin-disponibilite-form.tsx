"use client"

import { useState } from "react"
import { CheckCircle2, Trash2 } from "lucide-react"
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
import type { AvailabilityStatus } from "@/db/schema"

type PointOption = {
  id: string
  name: string
  district: string
  vendorName: string
}

export type DispoData = {
  id: string
  pointId: string
  status: string
  quantity: number | null
  format: string | null
  brand: string | null
  weightKg: string | null
  expiresAt: Date | string | null
  phone: string | null
  note: string | null
  pointName: string
  vendorId: string
  vendorName: string
} | null

const STATUSES: AvailabilityStatus[] = ["disponible", "a_confirmer", "indisponible"]

function toDateValue(value: Date | string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

type FormState = {
  pointId: string
  pointName: string
  status: AvailabilityStatus
  quantity: string
  format: string
  brand: string
  weightKg: string
  expiresAt: string
  phone: string
  note: string
  vendorId: string
  vendorName: string
}

function initialFormState(editing: DispoData): FormState {
  return {
    pointId: editing?.pointId ?? "",
    pointName: editing?.pointName ?? "",
    status: (editing?.status as AvailabilityStatus) ?? "disponible",
    quantity: editing?.quantity?.toString() ?? "",
    format: editing?.format ?? "",
    brand: editing?.brand ?? "",
    weightKg: editing?.weightKg ?? "",
    expiresAt: toDateValue(editing?.expiresAt),
    phone: editing?.phone ?? "",
    note: editing?.note ?? "",
    vendorId: editing?.vendorId ?? "",
    vendorName: editing?.vendorName ?? "",
  }
}

export function AdminDisponibiliteForm({
  open,
  onClose,
  editingDispo,
  points,
  brands,
}: {
  open: boolean
  onClose: () => void
  editingDispo: DispoData
  points: PointOption[]
  brands: string[]
}) {
  const isEditing = editingDispo !== null

  const [formState, setFormState] = useState<FormState>(() => initialFormState(editingDispo))
  const [step, setStep] = useState<"form" | "confirm" | "deleteConfirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const pointName = formState.pointName.trim()
  const pointOk = isEditing
    ? formState.pointId !== ""
    : pointName !== "" &&
      points.some((p) => p.name.trim().toLowerCase() === pointName.toLowerCase())
  const formatOk = formState.format.trim() !== ""
  const brandOk = formState.brand.trim() !== ""
  const noteOk = formState.note.trim() !== ""
  const isValid = pointOk && formatOk && brandOk && noteOk

  const missingFields = (): string[] => {
    const missing: string[] = []
    if (!pointName) missing.push("« Point de vente »")
    else if (!pointOk) missing.push("« Point de vente » introuvable")
    if (!formatOk) missing.push("« Format de bouteille »")
    if (!brandOk) missing.push("« Marque de bouteille »")
    if (!noteOk) missing.push("« Niveau de l'itinéraire »")
    return missing
  }

  const submitAction = async (formData: FormData) => {
    const result = isEditing
      ? await updateDisponibiliteAdmin(null, formData)
      : await createDisponibiliteAdmin(null, formData)
    setFeedback(result)
    if (result.ok) {
      setFormState(initialFormState(null))
      setStep("form")
      onClose()
    }
  }

  const deleteAction = async (formData: FormData) => {
    const result = await deleteDisponibiliteAdmin(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
  }

  const optionalFields = (
    <>
      <input type="hidden" name="quantity" value={formState.quantity} />
      <input type="hidden" name="weightKg" value={formState.weightKg} />
      <input type="hidden" name="expiresAt" value={formState.expiresAt} />
      <input type="hidden" name="phone" value={formState.phone} />
    </>
  )

  const hiddenFields = (
    <>
      {isEditing ? (
        <>
          <input type="hidden" name="disponibiliteId" value={editingDispo?.id ?? ""} />
          <input type="hidden" name="pointId" value={formState.pointId} />
        </>
      ) : (
        <input type="hidden" name="pointName" value={formState.pointName} />
      )}
      <input type="hidden" name="format" value={formState.format} />
      <input type="hidden" name="status" value={formState.status} />
      <input type="hidden" name="brand" value={formState.brand} />
      <input type="hidden" name="note" value={formState.note} />
      {optionalFields}
    </>
  )

  const selectedPoint = points.find((p) => p.id === formState.pointId)
  const displayPointName =
    isEditing && formState.pointName
      ? formState.pointName
      : points.find((p) => p.name.trim().toLowerCase() === formState.pointName.trim().toLowerCase())?.name ??
        formState.pointName

  const confirmContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" />
        Récapitulatif de la disponibilité
      </div>
      <dl className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Point de vente</dt>
          <dd className="font-medium text-foreground">{displayPointName}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Format de bouteille</dt>
          <dd className="font-medium text-foreground">{formState.format}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Statut</dt>
          <dd className="font-medium text-foreground">{availabilityLabel[formState.status]}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Marque de bouteille</dt>
          <dd className="font-medium text-foreground">{formState.brand.trim()}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Niveau de l&apos;itinéraire</dt>
          <dd className="font-medium text-foreground">{formState.note.trim()}</dd>
        </div>
        {isEditing && selectedPoint && (
          <div className="flex justify-between">
            <dt>Vendeur du dépôt</dt>
            <dd className="font-medium text-foreground">{selectedPoint.vendorName}</dd>
          </div>
        )}
        {formState.quantity && (
          <div className="flex justify-between">
            <dt>Quantité</dt>
            <dd className="font-medium text-foreground">{formState.quantity}</dd>
          </div>
        )}
        {formState.weightKg && (
          <div className="flex justify-between">
            <dt>Poids</dt>
            <dd className="font-medium text-foreground">{formState.weightKg} kg</dd>
          </div>
        )}
        {formState.expiresAt && (
          <div className="flex justify-between">
            <dt>Expire le</dt>
            <dd className="font-medium text-foreground">{formState.expiresAt}</dd>
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
        {displayPointName} — {formState.format}
      </p>
      <p className="text-xs text-muted-foreground">
        Cette action est irréversible.
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "deleteConfirm"
              ? "Supprimer la disponibilité"
              : step === "confirm"
              ? "Confirmer la disponibilité"
              : isEditing
              ? "Modifier la disponibilité"
              : "Créer une disponibilité"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (isValid) setStep("confirm")
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="point-input" className="flex items-center gap-1">
                Point de vente
                <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="point-input"
                type="text"
                list="point-name-suggestions"
                value={formState.pointName}
                onChange={(e) => setFormState((s) => ({ ...s, pointName: e.target.value }))}
                placeholder="Saisissez ou sélectionnez un point de vente"
                disabled={isEditing}
              />
              <datalist id="point-name-suggestions">
                {points.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-select">Vendeur</Label>
              <Select
                value={formState.vendorId}
                onValueChange={(v) => setFormState((s) => ({ ...s, vendorId: v ?? "", vendorName: "" }))}
              >
                <SelectTrigger id="vendor-select" className="w-full">
                  <SelectValue placeholder="Choisir un vendeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="format-select" className="flex items-center gap-1">
                  Format de bouteille
                  <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Select
                  value={formState.format}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v ?? "" }))}
                >
                  <SelectTrigger id="format-select" className="w-full">
                    <SelectValue placeholder="Saisissez un format" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Formats suggérés mais saisie libre acceptée */}
                    {bottleFormats.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand-input" className="flex items-center gap-1">
                  Marque de bouteille
                  <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Input
                  id="brand-input"
                  type="text"
                  list="brand-suggestions"
                  value={formState.brand}
                  onChange={(e) => setFormState((s) => ({ ...s, brand: e.target.value }))}
                  placeholder="Ex: Total, Payo, Gazex..."
                />
                <datalist id="brand-suggestions">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-input" className="flex items-center gap-1">
                Niveau de l&apos;itinéraire
                <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Textarea
                id="note-input"
                value={formState.note}
                onChange={(e) => setFormState((s) => ({ ...s, note: e.target.value }))}
                placeholder="Ex: Après Tradex, à côté de la pharmacie..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity-input">Quantité (facultatif)</Label>
              <Input
                id="quantity-input"
                type="number"
                min="0"
                value={formState.quantity}
                onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                placeholder="Ex: 25"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weight-input">Poids (kg, facultatif)</Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                min="0"
                value={formState.weightKg}
                onChange={(e) => setFormState((s) => ({ ...s, weightKg: e.target.value }))}
                placeholder="Ex: 12,5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expires-input">Expire le (facultatif)</Label>
              <Input
                id="expires-input"
                type="date"
                value={formState.expiresAt}
                onChange={(e) => setFormState((s) => ({ ...s, expiresAt: e.target.value }))}
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

            {!isValid && (
              <p role="alert" className="text-sm text-destructive">
                Champ{missingFields().length > 1 ? "s" : ""} manquant
                {missingFields().length > 1 ? "s" : ""} : {missingFields().join(", ")}.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!isValid}
              >
                {isEditing ? "Enregistrer les modifications" : "Créer la disponibilité"}
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

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
            )}
          </form>
        )}

        {step === "confirm" && (
          <form action={submitAction} className="space-y-4">
            {hiddenFields}
            {confirmContent}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!!feedback?.ok}>
                Confirmer
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Annuler
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