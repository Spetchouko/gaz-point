"use client"

import { useState } from "react"
import { Image as ImageIcon, ImageUp, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createPublicite, updatePublicite, type ActionResult } from "@/app/admin/actions"
import { cn } from "@/lib/utils"
import type { PubliciteRow } from "@/app/_components/admin-publicite-table"
import {
  PublicitePreview,
  type PubliciteBannerData,
} from "@/app/_components/publicite-banner"
import {
  PUBLICITE_ACCEPT_ATTRIBUTE,
  PUBLICITE_DESCRIPTION_MAX,
  PUBLICITE_IMAGE_MAX_BYTES,
  PUBLICITE_SLOTS,
  PUBLICITE_SLOT_VALUES,
  PUBLICITE_STATUS_LABELS,
  PUBLICITE_TITLE_MAX,
  derivePubliciteStatus,
  formatBytes,
  isPubliciteImageUrl,
  publiciteSlotLabel,
  validatePubliciteDescription,
  validatePubliciteImage,
  validatePubliciteTitle,
} from "@/lib/publicite-config"
import { optimizeImageFile } from "@/lib/image-utils"

const toLocalInput = (value: Date | string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : ""

/** Neutralise les anciennes valeurs d'image invalides (ex. texte non-URL). */
const sanitizeInitialImage = (value: string | null | undefined) =>
  isPubliciteImageUrl(value) ? (value ?? "").trim() : ""

const DEFAULT_SLOT = PUBLICITE_SLOTS[0].value
const selectClass =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

type FieldErrors = {
  title?: string
  description?: string
  image?: string
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const length = value.length
  const ratio = max > 0 ? length / max : 0
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        ratio >= 1
          ? "font-semibold text-destructive"
          : ratio >= 0.9
            ? "text-warning"
            : "text-muted-foreground"
      )}
    >
      {length}/{max}
    </span>
  )
}

export function AdminPubliciteForm({
  open,
  onClose,
  edit,
}: {
  open: boolean
  onClose: () => void
  edit: PubliciteRow | null
}) {
  const initialSlot =
    edit?.slot && PUBLICITE_SLOT_VALUES.includes(edit.slot)
      ? edit.slot
      : DEFAULT_SLOT

  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [imageInfo, setImageInfo] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [previewSlot, setPreviewSlot] = useState<string>(initialSlot)
  const [formState, setFormState] = useState({
    title: edit?.title ?? "",
    description: edit?.description ?? "",
    image: sanitizeInitialImage(edit?.image),
    price: edit?.price !== null && edit?.price !== undefined ? String(edit.price) : "",
    priceLabel: edit?.priceLabel ?? "",
    location: edit?.location ?? "",
    phone: edit?.phone ?? "",
    linkUrl: edit?.linkUrl ?? "",
    slot: initialSlot,
    startAt: toLocalInput(edit?.startAt ?? null),
    endAt: toLocalInput(edit?.endAt ?? null),
  })

  if (!open) return null

  const legacySlot =
    formState.slot && !PUBLICITE_SLOT_VALUES.includes(formState.slot)
      ? formState.slot
      : null

  const derivedStatus = derivePubliciteStatus(
    formState.startAt || null,
    formState.endAt || null
  )

  const previewAd: PubliciteBannerData = {
    id: edit?.id ?? "apercu",
    title: formState.title,
    description: formState.description || null,
    image: formState.image || null,
    price:
      formState.price && Number.isFinite(Number(formState.price))
        ? Number.parseInt(formState.price, 10)
        : null,
    priceLabel: formState.priceLabel || null,
    location: formState.location || null,
    phone: formState.phone || null,
    linkUrl: formState.linkUrl || null,
    startAt: formState.startAt || null,
    endAt: formState.endAt || null,
    status: derivedStatus,
  }

  const onPickImage = async (
    file: File | undefined,
    input?: HTMLInputElement | null
  ) => {
    if (input) input.value = ""
    if (!file) return
    setFeedback(null)
    setFieldErrors((errors) => ({ ...errors, image: undefined }))
    setImageInfo(null)
    setImageBusy(true)
    const result = await optimizeImageFile(file)
    setImageBusy(false)
    if (!result.ok) {
      setFieldErrors((errors) => ({ ...errors, image: result.error }))
      return
    }
    setFormState((state) => ({ ...state, image: result.dataUrl }))
    setImageInfo(
      `Image optimisée : ${result.width}×${result.height} px · ${formatBytes(
        result.bytes
      )} · ${result.format.toUpperCase()}` +
        (result.resized
          ? ` (redimensionnée depuis ${formatBytes(result.originalBytes)})`
          : "")
    )
  }

  const run = async (data: FormData) => {
    setFeedback(null)
    const titleError = validatePubliciteTitle(formState.title)
    const descriptionError = validatePubliciteDescription(formState.description)
    const imageResult = validatePubliciteImage(formState.image)

    if (titleError || descriptionError || !imageResult.ok) {
      setFieldErrors({
        title: titleError ?? undefined,
        description: descriptionError ?? undefined,
        image: imageResult.ok ? undefined : imageResult.error,
      })
      return
    }
    setFieldErrors({})

    if (edit) data.set("publiciteId", edit.id)
    const result = edit
      ? await updatePublicite(null, data)
      : await createPublicite(null, data)
    setFeedback(result)
    if (result.ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
          <DialogDescription>
            Deux emplacements sur l&apos;accueil. La bannière s&apos;affiche tant
            qu&apos;elle est en cours et dans sa période de diffusion.
          </DialogDescription>
        </DialogHeader>

        <form action={run} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ---------------- Colonne formulaire ---------------- */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ad-title">Titre</Label>
                  <CharCounter value={formState.title} max={PUBLICITE_TITLE_MAX} />
                </div>
                <Input
                  id="ad-title"
                  name="title"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, title: e.target.value }))
                  }
                  maxLength={PUBLICITE_TITLE_MAX}
                  aria-invalid={fieldErrors.title ? true : undefined}
                  required
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive">{fieldErrors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ad-description">Description</Label>
                  <CharCounter
                    value={formState.description}
                    max={PUBLICITE_DESCRIPTION_MAX}
                  />
                </div>
                <Textarea
                  id="ad-description"
                  name="description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, description: e.target.value }))
                  }
                  maxLength={PUBLICITE_DESCRIPTION_MAX}
                  rows={3}
                  placeholder="Courte phrase d'information (facultatif)"
                  aria-invalid={fieldErrors.description ? true : undefined}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-image-url">Image</Label>
                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  {formState.image ? (
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formState.image}
                        alt="Aperçu de l'image"
                        className="h-20 w-28 shrink-0 rounded-md border object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-xs text-muted-foreground">
                          {formState.image.startsWith("data:")
                            ? "Image importée (optimisée)"
                            : formState.image}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setFormState((s) => ({ ...s, image: "" }))
                            setImageInfo(null)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Retirer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="size-4" />
                      Aucune image
                    </div>
                  )}

                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                      imageBusy && "pointer-events-none opacity-60"
                    )}
                  >
                    {imageBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImageUp className="size-4" />
                    )}
                    {imageBusy
                      ? "Optimisation en cours…"
                      : `Importer une image (${formatBytes(
                          PUBLICITE_IMAGE_MAX_BYTES
                        )} max)`}
                    <input
                      type="file"
                      accept={PUBLICITE_ACCEPT_ATTRIBUTE}
                      className="sr-only"
                      disabled={imageBusy}
                      onChange={(e) =>
                        onPickImage(e.target.files?.[0], e.currentTarget)
                      }
                    />
                  </label>

                  <Input
                    id="ad-image-url"
                    value={formState.image.startsWith("data:") ? "" : formState.image}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, image: e.target.value }))
                    }
                    placeholder="…ou coller une URL d'image (facultatif)"
                    disabled={imageBusy}
                  />

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-6 rounded border-2 border-dashed"
                        aria-hidden
                      />
                      Carré 1:1
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-5 w-7 rounded border-2 border-dashed"
                        aria-hidden
                      />
                      Paysage 4:3
                    </span>
                    <span>PNG, JPEG, WebP — WebP généré automatiquement</span>
                  </div>

                  {imageInfo && (
                    <p className="text-xs text-success">{imageInfo}</p>
                  )}
                  {fieldErrors.image && (
                    <p className="text-xs text-destructive">{fieldErrors.image}</p>
                  )}
                </div>
                {/* Valeur réellement transmise au serveur */}
                <input type="hidden" name="image" value={formState.image} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-price">Prix (FCFA)</Label>
                  <Input
                    id="ad-price"
                    name="price"
                    type="number"
                    min="0"
                    value={formState.price}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, price: e.target.value }))
                    }
                    placeholder="Ex: 6500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-price-label">Libellé prix</Label>
                  <Input
                    id="ad-price-label"
                    name="priceLabel"
                    value={formState.priceLabel}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, priceLabel: e.target.value }))
                    }
                    placeholder="Ex: À partir de"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-location">Localisation</Label>
                  <Input
                    id="ad-location"
                    name="location"
                    value={formState.location}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, location: e.target.value }))
                    }
                    placeholder="Ex: Douala, Akwa"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-phone">Téléphone</Label>
                  <Input
                    id="ad-phone"
                    name="phone"
                    type="tel"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-link">Lien au clic</Label>
                  <Input
                    id="ad-link"
                    name="linkUrl"
                    type="url"
                    value={formState.linkUrl}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, linkUrl: e.target.value }))
                    }
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-slot">Emplacement</Label>
                <select
                  id="ad-slot"
                  name="slot"
                  value={formState.slot}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormState((s) => ({ ...s, slot: value }))
                    setPreviewSlot(value)
                  }}
                  className={selectClass}
                >
                  {legacySlot && (
                    <option value={legacySlot} disabled>
                      {publiciteSlotLabel(legacySlot)}
                    </option>
                  )}
                  {PUBLICITE_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {legacySlot && (
                  <p className="text-xs text-warning">
                    Cet emplacement n&apos;est plus diffusé. Choisissez un nouvel
                    emplacement pour enregistrer.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Statut</Label>
                <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
                  <span className="font-medium">
                    {PUBLICITE_STATUS_LABELS[derivedStatus]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — déterminé automatiquement par les dates de diffusion
                  </span>
                </div>
                <input type="hidden" name="status" value={derivedStatus} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-start">Début de période</Label>
                  <Input
                    id="ad-start"
                    name="startAt"
                    type="datetime-local"
                    value={formState.startAt}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, startAt: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-end">Fin de période</Label>
                  <Input
                    id="ad-end"
                    name="endAt"
                    type="datetime-local"
                    value={formState.endAt}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, endAt: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* ---------------- Colonne aperçu ---------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Aperçu sur la landing</p>
                <span className="text-xs text-muted-foreground">
                  Mise à jour en direct
                </span>
              </div>

              <Tabs value={previewSlot} onValueChange={setPreviewSlot}>
                <TabsList className="w-full">
                  {PUBLICITE_SLOTS.map((slot) => (
                    <TabsTrigger
                      key={slot.value}
                      value={slot.value}
                      className="flex-1 text-xs"
                    >
                      {slot.short}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <PublicitePreview ad={previewAd} slot={previewSlot} />

              <p className="text-xs text-muted-foreground">
                {publiciteSlotLabel(previewSlot)} —{" "}
                {PUBLICITE_SLOTS.find((slot) => slot.value === previewSlot)?.hint}
              </p>
            </div>
          </div>

          {feedback && (
            <p
              role="alert"
              className={cn(
                "text-sm",
                feedback.ok ? "text-success" : "text-destructive"
              )}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={imageBusy}>
              {edit ? "Enregistrer" : "Créer la publicité"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
