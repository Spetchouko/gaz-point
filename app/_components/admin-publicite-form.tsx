"use client"

import { useState } from "react"
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
import { createPublicite, updatePublicite, type ActionResult } from "@/app/admin/actions"
import { cn } from "@/lib/utils"
import type { PubliciteRow } from "@/app/_components/admin-publicite-table"

const toLocalInput = (value: Date | string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : ""

export function AdminPubliciteForm({
  open,
  onClose,
  edit,
}: {
  open: boolean
  onClose: () => void
  edit: PubliciteRow | null
}) {
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [formState, setFormState] = useState({
    title: edit?.title ?? "",
    description: edit?.description ?? "",
    image: edit?.image ?? "",
    price: edit?.price !== null && edit?.price !== undefined ? String(edit.price) : "",
    priceLabel: edit?.priceLabel ?? "",
    location: edit?.location ?? "",
    phone: edit?.phone ?? "",
    linkUrl: edit?.linkUrl ?? "",
    slot: edit?.slot ?? "home_hero",
    status: edit?.status ?? "active",
    startAt: toLocalInput(edit?.startAt ?? null),
    endAt: toLocalInput(edit?.endAt ?? null),
  })

  if (!open) return null

  const onPickImage = (file: File | undefined) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ ok: false, message: "Image trop lourde (2 Mo maximum)." })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFormState((s) => ({ ...s, image: String(reader.result ?? "") }))
    reader.readAsDataURL(file)
  }

  const run = async (data: FormData) => {
    setFeedback(null)
    if (edit) data.set("publiciteId", edit.id)
    const result = edit ? await updatePublicite(null, data) : await createPublicite(null, data)
    setFeedback(result)
    if (result.ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
          <DialogDescription>
            La bannière apparaît en haut de la page sélectionnée tant qu&apos;elle est active et dans sa période.
          </DialogDescription>
        </DialogHeader>

        <form action={run} className="space-y-4">
          {edit && <input type="hidden" name="publiciteId" value={edit.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="ad-title">Titre</Label>
            <Input
              id="ad-title"
              name="title"
              value={formState.title}
              onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-description">Description</Label>
            <Input
              id="ad-description"
              name="description"
              value={formState.description}
              onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
              placeholder="Courte phrase d'information (facultatif)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-image">Image (2 Mo max)</Label>
            {formState.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={formState.image} alt="Aperçu" className="h-32 w-full rounded-lg object-cover" />
            )}
            <Input
              id="ad-image"
              name="image"
              value={formState.image.startsWith("data:") ? "(image téléchargée)" : formState.image}
              readOnly={formState.image.startsWith("data:")}
              onChange={(e) => setFormState((s) => ({ ...s, image: e.target.value }))}
              placeholder="Coller une URL d'image (facultatif)"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0])}
              className="pt-1.5"
            />
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
                onChange={(e) => setFormState((s) => ({ ...s, price: e.target.value }))}
                placeholder="Ex: 6500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-price-label">Libellé prix</Label>
              <Input
                id="ad-price-label"
                name="priceLabel"
                value={formState.priceLabel}
                onChange={(e) => setFormState((s) => ({ ...s, priceLabel: e.target.value }))}
                placeholder="Ex: À partir de"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-location">Localisation</Label>
              <Input
                id="ad-location"
                name="location"
                value={formState.location}
                onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
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
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-link">Lien au clic</Label>
              <Input
                id="ad-link"
                name="linkUrl"
                type="url"
                value={formState.linkUrl}
                onChange={(e) => setFormState((s) => ({ ...s, linkUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ad-slot">Emplacement</Label>
              <select
                id="ad-slot"
                name="slot"
                value={formState.slot}
                onChange={(e) => setFormState((s) => ({ ...s, slot: e.target.value }))}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="home_hero">Accueil (au-dessus du cadre de recherche)</option>
                <option value="apropos">À propos</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-status">Statut</Label>
              <select
                id="ad-status"
                name="status"
                value={formState.status}
                onChange={(e) => setFormState((s) => ({ ...s, status: e.target.value }))}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ad-start">Début de période</Label>
              <Input
                id="ad-start"
                name="startAt"
                type="datetime-local"
                value={formState.startAt}
                onChange={(e) => setFormState((s) => ({ ...s, startAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-end">Fin de période</Label>
              <Input
                id="ad-end"
                name="endAt"
                type="datetime-local"
                value={formState.endAt}
                onChange={(e) => setFormState((s) => ({ ...s, endAt: e.target.value }))}
              />
            </div>
          </div>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}>
              {feedback.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit">{edit ? "Enregistrer" : "Créer la publicité"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}