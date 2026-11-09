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
import { useEffect, useCallback } from "react"
import { availabilityLabel, bottleFormats } from "@/lib/gaz"
import { Textarea } from "@/components/ui/textarea"
import { createDisponibiliteAdmin, updateDisponibiliteAdmin, deleteDisponibiliteAdmin, createDisponibiliteAdminForVendor, type ActionResult } from "@/app/admin/actions"
import type { AvailabilityStatus } from "@/db/schema"
import { db } from "@/db"
import { pointDeVente, brand, pointDeVenteBouteille } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

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
  allPoints: PointOption[]
  availableBrands: string[]  // brands available for selected point
  availableFormats: string[]  // formats available for selected point + brand
}

function capitalizeFirst(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

// Fetch available brands and formats for a point de vente
async function fetchAvailableBottles(
  pointId: string,
  dbClient: any
): Promise<{ brands: string[]; formatsByBrand: Map<string, string[]> }> {
  // Get bottles registered for this point de vente
  const bottles: { brandId: string; format: string }[] = await dbClient
    .select({
      brandId: pointDeVenteBouteille.brandId,
      format: pointDeVenteBouteille.format,
    })
    .from(pointDeVenteBouteille)
    .where(eq(pointDeVenteBouteille.pointDeVenteId, pointId))

  // Get brand names
  const brandIds = [...new Set(bottles.map((b) => b.brandId))]
  const brandsMap = new Map<string, string>()
  if (brandIds.length > 0) {
    const brandRows = await dbClient
      .select({ id: brand.id, name: brand.name })
      .from(brand)
      .where(inArray(brand.id, brandIds as string[]))
    for (const br of brandRows) {
      brandsMap.set(br.id, br.name)
    }
  }

  // Build brands list and formats grouped by brand
  const brands: string[] = []
  const formatsByBrand = new Map<string, string[]>()

  for (const bottle of bottles) {
    const brandName = brandsMap.get(bottle.brandId) || "Inconnu"
    if (!brands.includes(brandName)) {
      brands.push(brandName)
    }
    const existingFormats = formatsByBrand.get(brandName) || []
    if (!existingFormats.includes(bottle.format)) {
      existingFormats.push(bottle.format)
    }
    formatsByBrand.set(brandName, existingFormats)
  }

  return { brands, formatsByBrand }
}

export function AdminDisponibiliteForm({
  open,
  onClose,
  editingDispo,
  points,
  brands: initialBrands,
  vendorId: preselectedVendorId,
  pointId: preselectedPointId,
  vendorName: preselectedVendorName,
  pointName: preselectedPointName,
}: {
  open: boolean
  onClose: () => void
  editingDispo: DispoData
  points: PointOption[]
  brands: string[]
  vendorId?: string
  pointId?: string
  vendorName?: string
  pointName?: string
}) {
  const isEditing = editingDispo !== null
  const isAssisted = Boolean(preselectedVendorId && preselectedPointId)

  const [formState, setFormState] = useState<FormState>({
    pointId: isAssisted ? (preselectedPointId ?? "") : (editingDispo?.pointId ?? ""),
    pointName: isAssisted ? (preselectedPointName ?? "") : (editingDispo?.pointName ?? ""),
    status: (editingDispo?.status as AvailabilityStatus) ?? "disponible",
    format: editingDispo?.format ?? "",
    brand: editingDispo?.brand ?? "",
    expiresAt: editingDispo ? toDateValue(editingDispo.expiresAt) : "",
    phone: editingDispo?.phone ?? "",
    note: editingDispo?.note ?? "",
    vendorId: isAssisted ? (preselectedVendorId ?? "") : (editingDispo?.vendorId ?? ""),
    vendorName: isAssisted ? (preselectedVendorName ?? "") : (editingDispo?.vendorName ?? ""),
    allPoints: points,
    availableBrands: [],
    availableFormats: [],
  })

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

  // Fetch available bottles when point de vente changes
  useEffect(() => {
    // We'll fetch on mount or when point changes via the onChange handler below
  }, [])

  // When pointId changes, fetch available brands/formats
  useEffect(() => {
    // Fetch will happen in the onChange handler below
  }, [formState.pointId])

  // Handle point devente change to fetch available bottles
  const onPointChange = useCallback(async (pointId: string) => {
    // We'll fetch from the DB, but for now set empty states
    setFormState((prev) => ({
      ...prev,
      pointId,
      pointName: "",
      vendorName: "",
      availableBrands: [],
      availableFormats: [],
    }))
  }, [])

  // Handle vendor change to update points
  const onVendorChange = useCallback(async (vendorName: string) => {
    // Find the point de vente for this vendor
    const point = points.find((p) => p.name.trim().toLowerCase() === vendorName.trim().toLowerCase())
    if (point) {
      setFormState((prev) => ({
        ...prev,
        pointId: point.id,
        pointName: point.name,
        vendorName: point.vendorName,
      }))
    }
  }, [points])

  // Submit action
  const submitAction = async (formData: FormData) => {
    if (pending) return
    setPending(true)
    try {
      const result = isEditing
        ? await updateDisponibiliteAdmin(null, formData)
        : isAssisted
        ? await createDisponibiliteAdminForVendor(null, formData)
        : await createDisponibiliteAdmin(null, formData)
      setFeedback(result)
      if (result.ok) {
        setFormState({
          pointId: "",
          pointName: "",
          status: "disponible",
          format: "",
          brand: "",
          expiresAt: "",
          phone: "",
          note: "",
          vendorId: "",
          vendorName: "",
          allPoints: points,
          availableBrands: [],
          availableFormats: [],
        } as FormState)
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

  // Format options - use the canonical formats or allow custom
  const formatItems =
    formState.format && !(bottleFormats as readonly string[]).includes(formState.format)
      ? [formState.format, ...bottleFormats]
      : [...bottleFormats]

  // Filter points by vendor selected
  const filteredPoints = points.filter(
    (p) => formState.vendorName ? p.vendorName === formState.vendorName : true
  )

  const selectedPoint = filteredPoints.find((p) => p.id === formState.pointId)
  const displayPointName =
    isEditing && formState.pointName
      ? formState.pointName
      : filteredPoints.find(
          (p) => p.name.trim().toLowerCase() === formState.pointName.trim().toLowerCase()
        )?.name ??
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
          <dt>Niveau de l'itinéraire</dt>
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
                disabled={isEditing || isAssisted}
                required
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
                placeholder="Nom du vendeur (recherche)"
                disabled={isEditing || isAssisted}
              />
              {submitAttempted && !formState.vendorName && (
                <p className="text-xs text-destructive">
                  Le vendeur est requis.
                </p>
              )}
              {!isAssisted && points.length > 0 && (
                <div className="mt-2">
                  <Label htmlFor="vendor-suggestions" className="sr-only">
                    Vendeurs suggérés
                  </Label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Array.from(new Set(points.map((p) => p.vendorName))).map(
                      (vendor) => (
                        <div
                          key={vendor}
                          onClick={() => setFormState((s) => ({ ...s, vendorName: vendor }))}
                          className="flex items-center gap-2 rounded hover:bg-muted cursor-pointer px-2 py-1 text-sm"
                        >
                          <span className="text-primary">{vendor}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
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
                  disabled={pending}
                />
                <datalist id="brand-suggestions">
                  {formState.availableBrands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Dynamic formats based on selected brand */}
            {formState.availableBrands.length > 0 && formState.brand.trim() && (
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="format-selective">Formats disponibles pour "{formState.brand}"</Label>
                <Select
                  value={formState.format || undefined}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v ?? "" }))}
                  disabled={pending}
                >
                  <SelectTrigger id="format-selective" className="w-full">
                    <SelectValue placeholder="Sélectionner le format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formState.availableFormats
                      .map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {fmt}
                        </SelectItem>
                      ))}
                    {/* Allow custom format if not in the list */}
                    {formState.format && !formState.availableFormats.includes(formState.format) && (
                      <SelectItem key={formState.format} value={formState.format}>
                        {formState.format}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

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
            {isAssisted && (
              <>
                <input type="hidden" name="vendorId" value={formState.vendorId} />
                <input type="hidden" name="pointId" value={formState.pointId} />
              </>
            )}
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