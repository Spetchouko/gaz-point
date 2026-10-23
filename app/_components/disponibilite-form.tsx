"use client"

import { useState, type FormEvent } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { bottleFormats } from "@/lib/gaz"
import { upsertDisponibilite, deleteDisponibilite, type ActionResult } from "@/app/dashboard/pro/actions"
import { authClient } from "@/lib/auth-client"
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

/** Met uniquement la première lettre en majuscule, sans toucher au reste. */
function capitalizeFirst(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

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
    vendorName: "",
    format: editingDispo?.dispo.format ?? "",
    status: (editingDispo?.dispo.status as AvailabilityStatus) ?? "disponible",
    phone: editingDispo?.dispo.phone ?? "",
    quantity: editingDispo?.dispo.quantity ?? "",
    note: editingDispo?.dispo.note ?? "",
    brand: (editingDispo?.dispo as { brand?: string | null })?.brand ?? "",
    expiresAt: "",
  })
  const [step, setStep] = useState<"form" | "deleteConfirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [pending, setPending] = useState(false)

  // Préremplissage du nom du vendeur à partir du compte connecté :
  // valeur dérivée à l'affichage, l'utilisateur peut toujours la modifier.
  const sessionName = authClient.useSession().data?.user?.name ?? ""
  const vendorDisplayValue = formState.vendorName || sessionName

  // Exactement les trois formats canoniques ; à l'édition d'une ancienne
  // disponibilité, sa valeur d'origine reste sélectionnable.
  const formatItems =
    formState.format && !(bottleFormats as readonly string[]).includes(formState.format)
      ? [formState.format, ...bottleFormats]
      : [...bottleFormats]

  // Le point de vente reste une saisie libre : on le rattache au dépôt
  // correspondant lorsqu'un nom exact correspond, sinon le serveur fait
  // lui-même la résolution par nom (post-soumission).
  const matchedPoint = points.find(
    (p) => p.name.trim().toLowerCase() === formState.pointName.trim().toLowerCase()
  )
  const pointId = isEditing
    ? editingDispo?.pointId ?? formState.pointId
    : matchedPoint?.id ?? ""
  const pointUnknown = !isEditing && formState.pointName.trim() !== "" && !matchedPoint

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (pending) return
    setPending(true)
    setFeedback(null)
    try {
      const result = await upsertDisponibilite(null, formData)
      setFeedback(result)
      if (result.ok) onClose()
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (pending) return
    setPending(true)
    setFeedback(null)
    try {
      const result = await deleteDisponibilite(null, formData)
      setFeedback(result)
      if (result.ok) onClose()
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  const deleteConfirmContent = (
    <div className="space-y-4 text-center">
      <p className="text-sm text-destructive">
        Voulez-vous vraiment supprimer cette disponibilité ?
      </p>
      <p className="text-sm text-muted-foreground">
        {formState.pointName || formState.pointId} — {formState.format}
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
              : isEditing
              ? "Modifier la disponibilité"
              : "Créer une disponibilité"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="pointId" value={pointId} />
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            {isEditing && (
              <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="point-name" className="flex items-center gap-1">
                Point de vente
                <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="point-name"
                name="pointName"
                type="text"
                list="dispo-point-suggestions"
                value={formState.pointName}
                onChange={(e) => setFormState((s) => ({ ...s, pointName: e.target.value }))}
                placeholder="Saisissez le nom du dépôt"
                required
                disabled={isEditing || pending}
              />
              <datalist id="dispo-point-suggestions">
                {points.map((point) => (
                  <option key={point.id} value={point.name} />
                ))}
              </datalist>
              {pointUnknown && (
                <p className="text-xs text-muted-foreground">
                  Ce nom ne correspond pas encore à l&apos;un de vos dépôts enregistrés.
                  Vérifiez la saisie exacte.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Vendeur</Label>
              <Input
                id="vendor-name"
                name="vendorName"
                type="text"
                value={vendorDisplayValue}
                onChange={(e) => setFormState((s) => ({ ...s, vendorName: e.target.value }))}
                placeholder="Nom du vendeur ou du dépositaire (facultatif)"
                disabled={pending}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="format-select" className="flex items-center gap-1">
                  Format de bouteille
                  <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Select
                  value={formState.format || undefined}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v ?? "" }))}
                  disabled={pending}
                >
                  <SelectTrigger id="format-select" className="w-full">
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
                  name="brand"
                  type="text"
                  value={formState.brand}
                  onChange={(e) => setFormState((s) => ({ ...s, brand: e.target.value }))}
                  onBlur={() => setFormState((s) => ({ ...s, brand: capitalizeFirst(s.brand) }))}
                  placeholder="Ex. : Total, Tradex, Bocom…"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantity-input">Quantité (facultatif)</Label>
                <Input
                  id="quantity-input"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formState.quantity}
                  onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                  placeholder="Ex : 25"
                  disabled={pending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expires-input">Expire le (facultatif)</Label>
                <Input
                  id="expires-input"
                  name="expiresAt"
                  type="date"
                  value={formState.expiresAt}
                  onChange={(e) => setFormState((s) => ({ ...s, expiresAt: e.target.value }))}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="directions-input">Indication / itinéraire (facultatif)</Label>
              <Textarea
                id="directions-input"
                name="directions"
                value={formState.note}
                onChange={(e) => setFormState((s) => ({ ...s, note: e.target.value }))}
                placeholder="Ex : après Tradex, à côté de la pharmacie…"
                rows={3}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-input">Téléphone (facultatif)</Label>
              <Input
                id="phone-input"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Ex : +237 6 99 00 00 00"
                disabled={pending}
              />
            </div>

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="flex-1" disabled={pending || !!feedback?.ok}>
                {pending
                  ? "Enregistrement en cours…"
                  : isEditing
                  ? "Enregistrer les modifications"
                  : "Créer la disponibilité"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setStep("deleteConfirm")}
                  disabled={pending}
                >
                  <X className="size-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </form>
        )}

        {step === "deleteConfirm" && (
          <form onSubmit={handleDelete} className="space-y-4">
            <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            {deleteConfirmContent}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" className="flex-1" disabled={pending}>
                Supprimer définitivement
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Annuler
              </Button>
            </div>
            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}
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
