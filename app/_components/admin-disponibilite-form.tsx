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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { availabilityLabel, bottleFormats } from "@/lib/gaz"
import { Textarea } from "@/components/ui/textarea"
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

function toDateValue(value: Date | string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

type FormState = {
  pointId: string
  pointName: string
  status: AvailabilityStatus
  format: string
  brand: string
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
    format: editing?.format ?? "",
    brand: editing?.brand ?? "",
    expiresAt: toDateValue(editing?.expiresAt),
    phone: editing?.phone ?? "",
    note: editing?.note ?? "",
    vendorId: editing?.vendorId ?? "",
    vendorName: editing?.vendorName ?? "",
  }
}

/** Met uniquement la première lettre en majuscule, sans toucher au reste. */
function capitalizeFirst(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
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
  const [pending, setPending] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const pointName = formState.pointName.trim()

  // Seuls le point de vente et le format sont réellement indispensables :
  // la marque et l'itinéraire restent facultatifs et ne bloquent jamais le bouton.
  const missingFields = [
    ...(pointName ? [] : ["« Point de vente »"]),
    ...(formState.format.trim() ? [] : ["« Format de la bouteille »"]),
  ]
  const isValid = missingFields.length === 0

  const submitAction = async (formData: FormData) => {
    if (pending) return
    setPending(true)
    try {
      const result = isEditing
        ? await updateDisponibiliteAdmin(null, formData)
        : await createDisponibiliteAdmin(null, formData)
      setFeedback(result)
      if (result.ok) {
        setFormState(initialFormState(null))
        setStep("form")
        setSubmitAttempted(false)
        onClose()
      }
    } finally {
      setPending(false)
    }
  }

  const deleteAction = async (formData: FormData) => {
    if (pending) return
    setPending(true)
    try {
      const result = await deleteDisponibiliteAdmin(null, formData)
      setFeedback(result)
      if (result.ok) onClose()
    } finally {
      setPending(false)
    }
  }

  // Exactement les trois formats canoniques ; à l'édition d'une ancienne
  // disponibilité, sa valeur d'origine reste sélectionnable.
  const formatItems =
    formState.format && !(bottleFormats as readonly string[]).includes(formState.format)
      ? [formState.format, ...bottleFormats]
      : [...bottleFormats]

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
        {formState.brand.trim() && (
          <div className="flex justify-between">
            <dt>Marque de bouteille</dt>
            <dd className="font-medium text-foreground">{formState.brand.trim()}</dd>
          </div>
        )}
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
              setSubmitAttempted(true)
              if (isValid && !pending) setStep("confirm")
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
                onChange={(e) => {
                  const next = e.target.value
                  const match = points.find(
                    (p) => p.name.trim().toLowerCase() === next.trim().toLowerCase()
                  )
                  // Préremplissage du vendeur d'après le dépôt reconnu.
                  setFormState((s) => ({
                    ...s,
                    pointName: next,
                    vendorName: s.vendorName ? s.vendorName : match?.vendorName ?? s.vendorName,
                  }))
                }}
                placeholder="Saisissez ou sélectionnez un point de vente"
                disabled={isEditing}
              />
              <datalist id="point-name-suggestions">
                {points.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
              {submitAttempted && !pointName && (
                <p className="text-xs text-destructive">
                  Le point de vente est requis.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-input">Vendeur</Label>
              <Input
                id="vendor-input"
                type="text"
                value={formState.vendorName}
                onChange={(e) => setFormState((s) => ({ ...s, vendorName: e.target.value }))}
                placeholder="Nom du vendeur (facultatif)"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="format-input" className="flex items-center gap-1">
                  Format de bouteille
                  <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Select
                  value={formState.format || undefined}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v ?? "" }))}
                >
                  <SelectTrigger id="format-input" className="w-full">
                    <SelectValue placeholder="Sélectionner le format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatItems.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand-input">Marque de bouteille</Label>
                <Input
                  id="brand-input"
                  type="text"
                  list="brand-suggestions"
                  value={formState.brand}
                  onChange={(e) => setFormState((s) => ({ ...s, brand: e.target.value }))}
                  onBlur={() => setFormState((s) => ({ ...s, brand: capitalizeFirst(s.brand) }))}
                  placeholder="Ex. : Total, Tradex, Bocom…"
                />
                <datalist id="brand-suggestions">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-input">Niveau de l&apos;itinéraire (facultatif)</Label>
              <Textarea
                id="note-input"
                name="note"
                value={formState.note}
                onChange={(e) => setFormState((s) => ({ ...s, note: e.target.value }))}
                placeholder="Ex : après Tradex, à côté de la pharmacie…"
                rows={3}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expires-input">Expire le (facultatif)</Label>
                <Input
                  id="expires-input"
                  name="expiresAt"
                  type="date"
                  value={formState.expiresAt}
                  onChange={(e) => setFormState((s) => ({ ...s, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-input">Téléphone (facultatif)</Label>
              <Input
                id="phone-input"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Ex. : +237 6 99 00 00 00"
              />
            </div>

            {submitAttempted && missingFields.length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Champ{missingFields.length > 1 ? "s" : ""} requis manquant
                {missingFields.length > 1 ? "s" : ""} : {missingFields.join(", ")}.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Enregistrement en cours…" : isEditing ? "Enregistrer les modifications" : "Créer la disponibilité"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setStep("deleteConfirm")}
                  disabled={pending}
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
            <input type="hidden" name="vendorName" value={formState.vendorName} />
            <input type="hidden" name="expiresAt" value={formState.expiresAt} />
            <input type="hidden" name="phone" value={formState.phone} />
            {confirmContent}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Enregistrement en cours…" : "Confirmer"}
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
              <Button type="submit" variant="destructive" className="flex-1" disabled={pending}>
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
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" />
            {feedback.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
